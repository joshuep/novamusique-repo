import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { generateTicketsWorkflow } from "../workflows/generate-tickets"

export default async function orderPaymentCapturedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const orderId = event.data.id
  logger.info(`🎫 Processing ticket generation for order: ${orderId}`)

  try {
    // Fetch order with items and product details
    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "email",
        "shipping_address.first_name",
        "shipping_address.last_name",
        "items.id",
        "items.quantity",
        "items.title",
        "items.variant_title",
        "items.variant.product.metadata",
        "items.variant.product.title",
      ],
      filters: {
        id: orderId,
      },
    })

    if (!orders || orders.length === 0) {
      logger.error(`Order ${orderId} not found`)
      return
    }

    const order = orders[0]

    // Build customer name from shipping address
    const customerName = order.shipping_address
      ? `${order.shipping_address.first_name || ""} ${order.shipping_address.last_name || ""}`.trim()
      : "Client"

    // Prepare items for ticket generation
    const items = order.items?.map((item: any) => ({
      line_item_id: item.id,
      quantity: item.quantity,
      product_title: item.variant?.product?.title || item.title,
      variant_title: item.variant_title || item.title,
      metadata: item.variant?.product?.metadata || {},
    })) || []

    if (items.length === 0) {
      logger.warn(`No items found for order ${orderId}`)
      return
    }

    // Run the ticket generation workflow
    const { result: tickets } = await generateTicketsWorkflow(container).run({
      input: {
        order_id: orderId,
        customer_email: order.email || "",
        customer_name: customerName,
        items,
      },
    })

    logger.info(`✅ Generated ${tickets.length} ticket(s) for order ${orderId}`)
  } catch (error) {
    logger.error(`❌ Failed to generate tickets for order ${orderId}:`, error)
    throw error
  }
}

export const config: SubscriberConfig = {
  event: "order.payment_captured",
}
