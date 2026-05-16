import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  sendOrderToTelegram,
  testTelegram,
} from "@/lib/telegram.functions";

const DELIVERY_AREAS = [
  "Kitengela Town",
  "Milimani",
  "Yukos",
  "Acacia",
  "Chuna",
  "Kimalat",
  "New Valley",
  "Nyama Villa",
  "Old Namanga Road",
  "Deliverance",
  "Korrompoi",
  "EPZ",
  "Athi River",
  "Sabaki",
  "GMC",
  "Prisons",
  "KAG",
  "Oloosirkon",
];

const UNIT_PRICE = 25; // KSh per chapati
const WHATSAPP = "254718357737";
const MPESA = "0718357737";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Moo Chapatis — Fresh Hot Chapatis Delivered Fast in Kitengela" },
      {
        name: "description",
        content:
          "Order fresh hot chapatis delivered in Kitengela. Order, We Deliver — 7PM to 10PM. WhatsApp 0718357737.",
      },
      { property: "og:title", content: "Moo Chapatis — Order, We Deliver" },
      {
        property: "og:description",
        content: "Fresh hot chapatis delivered fast across Kitengela, 7PM–10PM.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const sendOrder = useServerFn(sendOrderToTelegram);
  const sendTest = useServerFn(testTelegram);

  const [quantity, setQuantity] = useState(5);
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState(DELIVERY_AREAS[0]);
  const [address, setAddress] = useState("");
  const [instructions, setInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<
    | { kind: "idle" }
    | { kind: "success"; sentAt: string }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  const total = useMemo(() => quantity * UNIT_PRICE, [quantity]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult({ kind: "idle" });
    try {
      const res = await sendOrder({
        data: {
          product: "Fresh Hot Chapati",
          quantity,
          unitPrice: UNIT_PRICE,
          totalPrice: total,
          customerPhone: phone.trim(),
          deliveryArea: area,
          deliveryAddress: address.trim(),
          instructions: instructions.trim(),
          paymentMethod: "MPESA",
        },
      });
      if (res.ok) {
        setResult({ kind: "success", sentAt: res.sentAt });
      } else {
        setResult({ kind: "error", message: res.error });
      }
    } catch (err) {
      setResult({
        kind: "error",
        message: err instanceof Error ? err.message : "Failed to place order",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTest() {
    const res = await sendTest({});
    if (res.ok) alert("Test message sent to Telegram ✅");
    else alert("Telegram test failed: " + res.error);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              Moo Chapatis
            </h1>
            <p className="text-xs text-muted-foreground">Order, We Deliver</p>
          </div>
          <a
            href={`https://wa.me/${WHATSAPP}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
          >
            WhatsApp
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-2xl px-4 pt-6 pb-3">
        <div className="rounded-2xl bg-accent p-5 shadow-sm">
          <h2 className="text-2xl font-bold leading-tight">
            Fresh Hot Chapatis Delivered Fast
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Kitengela • 7PM – 10PM • KSh {UNIT_PRICE} per chapati
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-2xl px-4 pb-32">
        <form
          onSubmit={handleSubmit}
          className="mt-4 space-y-4 rounded-2xl border bg-card p-5 shadow-sm"
        >
          <h3 className="text-base font-semibold">Place your order</h3>

          <div>
            <label className="text-xs font-medium">Quantity</label>
            <div className="mt-1 flex items-center gap-3">
              <button
                type="button"
                className="h-10 w-10 rounded-full border text-lg"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                −
              </button>
              <span className="w-10 text-center text-lg font-semibold">
                {quantity}
              </span>
              <button
                type="button"
                className="h-10 w-10 rounded-full border text-lg"
                onClick={() => setQuantity((q) => Math.min(500, q + 1))}
              >
                +
              </button>
              <span className="ml-auto text-sm font-semibold">
                KSh {total.toLocaleString()}
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium">Phone number</label>
            <input
              required
              inputMode="tel"
              pattern="[0-9+ ]{7,20}"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07XX XXX XXX"
              className="mt-1 w-full rounded-xl border bg-background px-3 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium">Delivery area</label>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="mt-1 w-full rounded-xl border bg-background px-3 py-2.5 text-sm"
            >
              {DELIVERY_AREAS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium">Address / landmark</label>
            <input
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Yukos, next to Naivas, gate 4"
              className="mt-1 w-full rounded-xl border bg-background px-3 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium">
              Extra instructions (optional)
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={2}
              placeholder="e.g. Call when you arrive"
              className="mt-1 w-full rounded-xl border bg-background px-3 py-2.5 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-sm transition active:scale-[0.99] disabled:opacity-60"
          >
            {submitting ? "Placing order…" : `Order now • KSh ${total.toLocaleString()}`}
          </button>

          <button
            type="button"
            onClick={handleTest}
            className="w-full rounded-xl border py-2 text-xs font-medium text-muted-foreground"
          >
            Send test message to Telegram
          </button>
        </form>

        {result.kind === "success" && (
          <div
            role="dialog"
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          >
            <div className="w-full max-w-md rounded-2xl bg-card p-5 shadow-xl">
              <h4 className="text-base font-bold">Order received ✅</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Your order was sent. Pay <b>KSh {total.toLocaleString()}</b> via
                MPESA to:
              </p>
              <div className="mt-3 flex items-center justify-between rounded-xl bg-accent px-3 py-2.5">
                <span className="font-mono text-base font-semibold">
                  {MPESA}
                </span>
                <button
                  onClick={() => navigator.clipboard?.writeText(MPESA)}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                >
                  Copy
                </button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Estimated delivery: 30–45 min. We will WhatsApp you on{" "}
                {phone || "your number"} once dispatched.
              </p>
              <button
                onClick={() => setResult({ kind: "idle" })}
                className="mt-4 w-full rounded-xl border py-2 text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {result.kind === "error" && (
          <p className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {result.message}
          </p>
        )}
      </main>

      <a
        href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
          "Hi Moo Chapatis, I'd like to order.",
        )}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl text-primary-foreground shadow-lg"
      >
        💬
      </a>
    </div>
  );
}
