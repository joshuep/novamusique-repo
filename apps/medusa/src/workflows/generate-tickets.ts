import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { TICKET_MODULE } from "../modules/ticket"
import type TicketModuleService from "../modules/ticket/service"

type GenerateTicketsInput = {
  order_id: string
  customer_email: string
  customer_name: string
  items: {
    line_item_id: string
    quantity: number
    product_title: string
    variant_title: string
    metadata?: Record<string, any>
  }[]
}

const generateTicketsStep = createStep(
  "generate-tickets-step",
  async (input: GenerateTicketsInput, { container }) => {
    const ticketService: TicketModuleService = container.resolve(TICKET_MODULE)

    const generatedTickets = []

    for (const item of input.items) {
      // Generate one ticket per quantity
      for (let i = 0; i < item.quantity; i++) {
        const ticket = await ticketService.generateTicket({
          order_id: input.order_id,
          order_line_item_id: item.line_item_id,
          customer_email: input.customer_email,
          customer_name: input.customer_name,
          show_title: item.product_title,
          session_time: item.variant_title,
          session_date: item.metadata?.event_date || "22 avril 2026",
          venue: item.metadata?.venue || "Salle Émile-Legault, Cégep Saint-Laurent",
        })
        generatedTickets.push(ticket)
      }
    }

    return new StepResponse(generatedTickets, generatedTickets.map((t) => t.id))
  },
  async (ticketIds, { container }) => {
    // Compensation: cancel tickets if workflow fails
    if (!ticketIds?.length) return

    const ticketService: TicketModuleService = container.resolve(TICKET_MODULE)

    for (const ticketId of ticketIds) {
      await ticketService.cancelTicket(ticketId)
    }
  }
)

export const generateTicketsWorkflow = createWorkflow(
  "generate-tickets",
  (input: GenerateTicketsInput) => {
    const tickets = generateTicketsStep(input)
    return new WorkflowResponse(tickets)
  }
)
