import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { TICKET_MODULE } from "../../../../../modules/ticket"
import type TicketModuleService from "../../../../../modules/ticket/service"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { ticketId } = req.params
  const { markAsUsed = true } = req.body as { markAsUsed?: boolean }

  const ticketService: TicketModuleService = req.scope.resolve(TICKET_MODULE)

  // Validate the ticket
  const validation = await ticketService.validateTicket(ticketId)

  if (!validation.valid) {
    return res.status(400).json({
      valid: false,
      error: validation.error,
      ticket: validation.ticket ? {
        id: validation.ticket.id,
        status: validation.ticket.status,
        show_title: validation.ticket.show_title,
        session_time: validation.ticket.session_time,
        used_at: validation.ticket.used_at,
      } : null,
    })
  }

  // Mark as used if requested
  if (markAsUsed) {
    const usedTicket = await ticketService.markTicketUsed(ticketId)
    return res.json({
      valid: true,
      message: "Ticket validated and marked as used",
      ticket: {
        id: usedTicket.id,
        status: usedTicket.status,
        show_title: usedTicket.show_title,
        session_time: usedTicket.session_time,
        session_date: usedTicket.session_date,
        venue: usedTicket.venue,
        customer_name: usedTicket.customer_name,
        used_at: usedTicket.used_at,
      },
    })
  }

  // Just validate without marking as used
  res.json({
    valid: true,
    message: "Ticket is valid",
    ticket: {
      id: validation.ticket!.id,
      status: validation.ticket!.status,
      show_title: validation.ticket!.show_title,
      session_time: validation.ticket!.session_time,
      session_date: validation.ticket!.session_date,
      venue: validation.ticket!.venue,
      customer_name: validation.ticket!.customer_name,
    },
  })
}
