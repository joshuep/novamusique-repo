import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { handle } = req.params
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
      "images.*",
      "variants.*",
      "variants.prices.*",
      "variants.options.*",
    ],
    filters: {
      handle,
      status: "published",
    },
  })

  if (!products || products.length === 0) {
    return res.status(404).json({
      message: "Show not found",
    })
  }

  const product = products[0]

  const show = {
    id: product.id,
    title: product.title,
    handle: product.handle,
    description: product.description,
    thumbnail: product.thumbnail,
    images: product.images,
    metadata: product.metadata,
    sessions: product.variants?.map((variant: any) => ({
      id: variant.id,
      title: variant.title,
      sku: variant.sku,
      options: variant.options,
      price: variant.prices?.[0]?.amount,
      currency: variant.prices?.[0]?.currency_code,
      inventory_quantity: variant.inventory_quantity,
    })) || [],
  }

  res.json({
    show,
  })
}
