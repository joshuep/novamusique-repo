import { MedusaService } from "@medusajs/framework/utils"
import Ticket, { TicketStatus } from "./models/ticket"
import QRCode from "qrcode"

type CreateTicketInput = {
  order_id: string
  order_line_item_id: string
  customer_email: string
  customer_name: string
  show_title: string
  session_time: string
  session_date: string
  venue: string
}

class TicketModuleService extends MedusaService({
  Ticket,
}) {
  async generateTicket(data: CreateTicketInput): Promise<typeof Ticket.$inferSelect> {
    // Generate unique QR code data
    const qrCodeData = JSON.stringify({
      ticketId: `TKT-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      orderId: data.order_id,
      email: data.customer_email,
      show: data.show_title,
      session: data.session_time,
      date: data.session_date,
      venue: data.venue,
      timestamp: new Date().toISOString(),
    })

    // Generate QR code as base64 data URL
    const qrCode = await QRCode.toDataURL(qrCodeData, {
      errorCorrectionLevel: "H",
      type: "image/png",
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })

    const ticket = await this.createTickets({
      ...data,
      qr_code: qrCode,
      qr_code_data: qrCodeData,
      status: TicketStatus.VALID,
    })

    return ticket
  }

  async validateTicket(ticketId: string): Promise<{
    valid: boolean
    ticket?: typeof Ticket.$inferSelect
    error?: string
  }> {
    const ticket = await this.retrieveTicket(ticketId)

    if (!ticket) {
      return { valid: false, error: "Ticket not found" }
    }

    if (ticket.status === TicketStatus.USED) {
      return {
        valid: false,
        ticket,
        error: `Ticket already used at ${ticket.used_at}`
      }
    }

    if (ticket.status === TicketStatus.CANCELLED) {
      return { valid: false, ticket, error: "Ticket has been cancelled" }
    }

    return { valid: true, ticket }
  }

  async markTicketUsed(ticketId: string): Promise<typeof Ticket.$inferSelect> {
    const ticket = await this.updateTickets(ticketId, {
      status: TicketStatus.USED,
      used_at: new Date(),
    })

    return ticket
  }

  async getTicketsByOrderId(orderId: string): Promise<(typeof Ticket.$inferSelect)[]> {
    const tickets = await this.listTickets({
      order_id: orderId,
    })

    return tickets
  }

  async cancelTicket(ticketId: string): Promise<typeof Ticket.$inferSelect> {
    const ticket = await this.updateTickets(ticketId, {
      status: TicketStatus.CANCELLED,
    })

    return ticket
  }
}

export default TicketModuleService
