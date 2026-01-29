import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "handle",
      "description",
      "thumbnail",
      "metadata",
      "variants.*",
      "variants.prices.*",
    ],
    filters: {
      status: "published",
    },
  })

  // Transform products to shows format
  const shows = products.map((product: any) => ({
    id: product.id,
    title: product.title,
    handle: product.handle,
    description: product.description,
    thumbnail: product.thumbnail,
    metadata: product.metadata,
    sessions: product.variants?.map((variant: any) => ({
      id: variant.id,
      title: variant.title,
      sku: variant.sku,
      price: variant.prices?.[0]?.amount,
      currency: variant.prices?.[0]?.currency_code,
      inventory_quantity: variant.inventory_quantity,
    })) || [],
  }))

  res.json({
    shows,
  })
}
