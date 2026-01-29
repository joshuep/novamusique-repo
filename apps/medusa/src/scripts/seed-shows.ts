import { CreateInventoryLevelInput, ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
  createApiKeysWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
} from "@medusajs/medusa/core-flows"

export default async function seedShows({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT)
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL)
  const storeModuleService = container.resolve(Modules.STORE)

  logger.info("🎭 Starting Nova Musique shows seeding...")

  // Get or create store
  const [store] = await storeModuleService.listStores()

  // Check if we already have a sales channel
  let defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Nova Musique",
  })

  if (!defaultSalesChannel.length) {
    logger.info("Creating Nova Musique sales channel...")
    const { result: salesChannelResult } = await createSalesChannelsWorkflow(
      container
    ).run({
      input: {
        salesChannelsData: [
          {
            name: "Nova Musique",
            description: "Billetterie Nova Musique",
          },
        ],
      },
    })
    defaultSalesChannel = salesChannelResult
  }

  // Update store with CAD currency
  logger.info("Configuring store for CAD currency...")
  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        supported_currencies: [
          { currency_code: "cad", is_default: true },
        ],
        default_sales_channel_id: defaultSalesChannel[0].id,
      },
    },
  })

  // Create Quebec region with Stripe payment
  logger.info("Creating Quebec/Canada region...")
  let region
  const { data: existingRegions } = await query.graph({
    entity: "region",
    fields: ["id", "name"],
    filters: { name: "Québec" },
  })

  if (existingRegions.length > 0) {
    region = existingRegions[0]
    logger.info("Quebec region already exists, skipping...")
  } else {
    const { result: regionResult } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "Québec",
            currency_code: "cad",
            countries: ["ca"],
            payment_providers: ["pp_stripe_stripe"],
          },
        ],
      },
    })
    region = regionResult[0]
  }

  // Create tax region for Canada
  logger.info("Creating tax region...")
  try {
    await createTaxRegionsWorkflow(container).run({
      input: [
        {
          country_code: "ca",
          provider_id: "tp_system",
        },
      ],
    })
  } catch (e: any) {
    if (!e.message?.includes("already exists")) {
      throw e
    }
    logger.info("Tax region already exists, skipping...")
  }

  // Create stock location for venue
  logger.info("Creating venue stock location...")
  let stockLocation
  const { data: existingLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
    filters: { name: "Salle Émile-Legault" },
  })

  if (existingLocations.length > 0) {
    stockLocation = existingLocations[0]
  } else {
    const { result: stockLocationResult } = await createStockLocationsWorkflow(
      container
    ).run({
      input: {
        locations: [
          {
            name: "Salle Émile-Legault",
            address: {
              city: "Montréal",
              country_code: "CA",
              address_1: "625 Avenue Sainte-Croix",
              postal_code: "H4L 3X7",
              province: "QC",
            },
          },
        ],
      },
    })
    stockLocation = stockLocationResult[0]
  }

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        default_location_id: stockLocation.id,
      },
    },
  })

  // Create shipping profile for digital tickets
  logger.info("Creating digital ticket shipping profile...")
  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  })
  let shippingProfile = shippingProfiles.length ? shippingProfiles[0] : null

  if (!shippingProfile) {
    const { result: shippingProfileResult } =
      await createShippingProfilesWorkflow(container).run({
        input: {
          data: [
            {
              name: "E-Tickets",
              type: "default",
            },
          ],
        },
      })
    shippingProfile = shippingProfileResult[0]
  }

  // Link sales channel to stock location
  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [defaultSalesChannel[0].id],
    },
  })

  // Create fulfillment set for digital delivery
  logger.info("Creating digital delivery fulfillment...")
  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: "E-Ticket Delivery",
    type: "shipping",
    service_zones: [
      {
        name: "Canada",
        geo_zones: [
          {
            country_code: "ca",
            type: "country",
          },
        ],
      },
    ],
  })

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_set_id: fulfillmentSet.id,
    },
  })

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: "manual_manual",
    },
  })

  // Create free shipping option for digital tickets
  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "E-Ticket (Gratuit)",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "E-Ticket",
          description: "Billet électronique envoyé par email",
          code: "e-ticket",
        },
        prices: [
          {
            currency_code: "cad",
            amount: 0,
          },
          {
            region_id: region.id,
            amount: 0,
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
    ],
  })

  // Create publishable API key
  logger.info("Creating publishable API key...")
  const { data: existingKeys } = await query.graph({
    entity: "api_key",
    fields: ["id", "title", "token"],
    filters: { type: "publishable" },
  })

  let publishableApiKey = existingKeys?.[0]

  if (!publishableApiKey) {
    const {
      result: [publishableApiKeyResult],
    } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [
          {
            title: "Nova Musique Storefront",
            type: "publishable",
            created_by: "",
          },
        ],
      },
    })
    publishableApiKey = publishableApiKeyResult
  }

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableApiKey.id,
      add: [defaultSalesChannel[0].id],
    },
  })

  // Create "Spectacles" category
  logger.info("Creating Spectacles category...")
  let spectaclesCategory
  const { data: existingCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name"],
    filters: { name: "Spectacles" },
  })

  if (existingCategories.length > 0) {
    spectaclesCategory = existingCategories[0]
  } else {
    const { result: categoryResult } = await createProductCategoriesWorkflow(
      container
    ).run({
      input: {
        product_categories: [
          {
            name: "Spectacles",
            is_active: true,
          },
        ],
      },
    })
    spectaclesCategory = categoryResult[0]
  }

  // Create Sarahmée product
  logger.info("Creating Sarahmée show product...")
  const { data: existingProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle"],
    filters: { handle: "vivre-la-chanson-sarahmee" },
  })

  if (existingProducts.length > 0) {
    logger.info("Sarahmée product already exists, skipping...")
  } else {
    await createProductsWorkflow(container).run({
      input: {
        products: [
          {
            title: "Vivre la chanson avec Sarahmée",
            handle: "vivre-la-chanson-sarahmee",
            description: `Venez vivre une expérience unique avec Sarahmée dans le cadre de la série "Vivre la chanson". Un spectacle intime et interactif où l'artiste partage sa passion pour la musique avec le jeune public.

Durée: 60 minutes
Public: Familles et enfants de 5 à 12 ans
Lieu: Salle Émile-Legault, Cégep Saint-Laurent`,
            category_ids: [spectaclesCategory.id],
            status: ProductStatus.PUBLISHED,
            shipping_profile_id: shippingProfile.id,
            metadata: {
              event_date: "2026-04-22",
              venue: "Salle Émile-Legault, Cégep Saint-Laurent",
              venue_address: "625 Avenue Sainte-Croix, Montréal, QC H4L 3X7",
              artist: "Sarahmée",
              duration: "60 minutes",
              age_range: "5-12 ans",
            },
            images: [],
            options: [
              {
                title: "Séance",
                values: ["10h30", "13h00"],
              },
            ],
            variants: [
              {
                title: "Séance 10h30",
                sku: "SARAHMEE-1030",
                manage_inventory: true,
                options: {
                  Séance: "10h30",
                },
                prices: [
                  {
                    amount: 2000, // 20.00 CAD in cents
                    currency_code: "cad",
                  },
                ],
              },
              {
                title: "Séance 13h00",
                sku: "SARAHMEE-1300",
                manage_inventory: true,
                options: {
                  Séance: "13h00",
                },
                prices: [
                  {
                    amount: 2000, // 20.00 CAD in cents
                    currency_code: "cad",
                  },
                ],
              },
            ],
            sales_channels: [
              {
                id: defaultSalesChannel[0].id,
              },
            ],
          },
        ],
      },
    })
  }

  // Set inventory levels for the variants
  logger.info("Setting inventory levels (200 places per session)...")
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id", "sku"],
    filters: {
      sku: ["SARAHMEE-1030", "SARAHMEE-1300"],
    },
  })

  if (inventoryItems.length > 0) {
    const inventoryLevels: CreateInventoryLevelInput[] = inventoryItems.map(
      (item: any) => ({
        location_id: stockLocation.id,
        stocked_quantity: 200,
        inventory_item_id: item.id,
      })
    )

    try {
      await createInventoryLevelsWorkflow(container).run({
        input: {
          inventory_levels: inventoryLevels,
        },
      })
    } catch (e: any) {
      if (!e.message?.includes("already exists")) {
        throw e
      }
      logger.info("Inventory levels already exist, skipping...")
    }
  }

  logger.info("✅ Nova Musique shows seeding completed!")
  logger.info("")
  logger.info("📋 Summary:")
  logger.info("   - Region: Québec (CAD)")
  logger.info("   - Sales Channel: Nova Musique")
  logger.info("   - Product: Vivre la chanson avec Sarahmée")
  logger.info("   - Variants: 10h30 and 13h00 (20$ each)")
  logger.info("   - Inventory: 200 places per session")
  logger.info("")
  logger.info(`🔑 Publishable API Key: ${publishableApiKey.token || 'Check admin dashboard'}`)
}
