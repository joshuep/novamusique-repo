import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { TICKET_MODULE } from "../../../../modules/ticket"
import type TicketModuleService from "../../../../modules/ticket/service"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { orderId } = req.params

  const ticketService: TicketModuleService = req.scope.resolve(TICKET_MODULE)

  const tickets = await ticketService.getTicketsByOrderId(orderId)

  if (!tickets || tickets.length === 0) {
    return res.status(404).json({
      message: "No tickets found for this order",
    })
  }

  res.json({
    tickets: tickets.map((ticket) => ({
      id: ticket.id,
      status: ticket.status,
      qr_code: ticket.qr_code,
      show_title: ticket.show_title,
      session_time: ticket.session_time,
      session_date: ticket.session_date,
      venue: ticket.venue,
      customer_name: ticket.customer_name,
      customer_email: ticket.customer_email,
    })),
  })
}
