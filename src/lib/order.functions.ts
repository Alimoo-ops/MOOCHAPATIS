import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const OrderSchema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().min(7).max(20),
  area: z.string().min(2).max(60),
  address: z.string().min(2).max(200),
  quantity: z.number().int().min(5).max(500),
  notes: z.string().max(500).optional().default(""),
  payment: z.enum(["MPESA", "CASH"]),
});

const UNIT_PRICE = 20;
const DELIVERY_FEE = 50;

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => OrderSchema.parse(input))
  .handler(async ({ data }) => {
    const subtotal = data.quantity * UNIT_PRICE;
    const total = subtotal + DELIVERY_FEE;
    const orderId = `MC-${Date.now().toString(36).toUpperCase()}`;
    const when = new Date().toLocaleString("en-KE", { timeZone: "Africa/Nairobi" });

    const text = [
      `🔥 *NEW ORDER — Moo Chapatis*`,
      `Order: \`${orderId}\``,
      `Time: ${when}`,
      ``,
      `👤 *Customer*`,
      `Name: ${data.name}`,
      `Phone: ${data.phone}`,
      ``,
      `📍 *Delivery*`,
      `Area: ${data.area}`,
      `Address: ${data.address}`,
      ``,
      `🫓 *Order*`,
      `Qty: ${data.quantity} chapatis @ KES ${UNIT_PRICE}`,
      `Subtotal: KES ${subtotal}`,
      `Delivery: KES ${DELIVERY_FEE}`,
      `*Total: KES ${total}*`,
      `Payment: ${data.payment}`,
      data.notes ? `\n📝 Notes: ${data.notes}` : "",
    ].join("\n");

    const token = process.env.BOT_TOKEN;
    const chatId = process.env.CHAT_ID;
    if (!token || !chatId) {
      console.error("Telegram BOT_TOKEN / CHAT_ID missing");
      return { ok: false, orderId, total, error: "Notification service unavailable" };
    }

    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
      });
      if (!res.ok) {
        const body = await res.text();
        console.error("Telegram send failed", res.status, body);
        return { ok: false, orderId, total, error: "Could not notify kitchen" };
      }
    } catch (e) {
      console.error("Telegram fetch error", e);
      return { ok: false, orderId, total, error: "Network error notifying kitchen" };
    }

    return { ok: true, orderId, total, subtotal, deliveryFee: DELIVERY_FEE };
  });
