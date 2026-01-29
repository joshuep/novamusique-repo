import { model } from "@medusajs/framework/utils"

export const TicketStatus = {
  VALID: "valid",
  USED: "used",
  CANCELLED: "cancelled",
} as const

export type TicketStatusType = (typeof TicketStatus)[keyof typeof TicketStatus]

const Ticket = model.define("ticket", {
  id: model.id({ prefix: "tkt" }).primaryKey(),
  order_id: model.text(),
  order_line_item_id: model.text(),
  customer_email: model.text(),
  customer_name: model.text(),
  qr_code: model.text(),
  qr_code_data: model.text(),
  status: model.enum(Object.values(TicketStatus)).default(TicketStatus.VALID),
  show_title: model.text(),
  session_time: model.text(),
  session_date: model.text(),
  venue: model.text(),
  used_at: model.dateTime().nullable(),
})

export default Ticket
