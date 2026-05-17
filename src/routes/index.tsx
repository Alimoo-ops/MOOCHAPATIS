import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  Flame,
  ShoppingBag,
  Star,
  Copy,
  Check,
  X,
  Sparkles,
  Truck,
  Gift,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

import heroImg from "@/assets/moo-hero.png";
import { sendOrderToTelegram } from "@/lib/telegram.functions";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "Moo Chapatis — Fresh Hot Chapatis Delivered Fast in Kitengela" },
      {
        name: "description",
        content:
          "Order fresh hot chapatis in Kitengela. Daily delivery 7PM–10PM. Bonus on first 5+ orders. WhatsApp 0718357737.",
      },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: "Fresh Hot Chapati",
          image: ["/icon-512.png"],
          description: "Soft, hot, freshly cooked Kenyan chapatis delivered to your door in Kitengela.",
          brand: { "@type": "Brand", name: "Moo Chapatis" },
          offers: {
            "@type": "Offer",
            priceCurrency: "KES",
            price: "20",
            availability: "https://schema.org/InStock",
            areaServed: "Kitengela, Kenya",
          },
          aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "184" },
        }),
      },
    ],
  }),
});

const PHONE = "0718357737";
const WHATSAPP = "254718357737";
const MPESA = "0718357737";

const PRODUCTS = [
  { id: "classic", name: "Classic Chapati", price: 20, tag: "Most loved", desc: "Soft, layered, hot off the pan." },
  { id: "family", name: "Family Pack (10)", price: 180, tag: "Save KSh 20", desc: "10 fresh chapatis for the whole family." },
  { id: "jumbo", name: "Jumbo Pack (20)", price: 350, tag: "Best value", desc: "20 chapatis — perfect for events & sharing." },
  { id: "supreme", name: "Supreme Soft (5)", price: 110, tag: "Extra soft", desc: "Premium extra-soft chapatis, 5pcs." },
];

const AREAS = [
  "Kitengela Town", "Milimani", "Yukos", "Acacia", "Chuna", "Kimalat",
  "New Valley", "Nyama Villa", "Old Namanga Road", "Deliverance", "Korrompoi",
  "EPZ", "Athi River", "GMC", "Prisons", "KAG", "Oloosirkon", "Other (specify)",
];

const TESTIMONIALS = [
  { name: "Wanjiku M.", area: "Milimani", text: "Best chapatis in Kitengela! Always hot and soft. Delivery is fast 🔥", rating: 5 },
  { name: "Brian K.", area: "EPZ", text: "Ordered for a family event — everyone loved them. Will order again!", rating: 5 },
  { name: "Aisha N.", area: "Yukos", text: "Order, they deliver. Simple. The bonus on my first order was lovely.", rating: 5 },
];

function HomePage() {
  const [splash, setSplash] = useState(false);
  const [showOrder, setShowOrder] = useState(false);
  const [selected, setSelected] = useState(PRODUCTS[0]);
  const [qty, setQty] = useState(5);
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<null | { total: number; ref: string }>(null);
  const [copied, setCopied] = useState(false);

  const sendOrder = useServerFn(sendOrderToTelegram);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!sessionStorage.getItem("moo_splash")) {
      setSplash(true);
      sessionStorage.setItem("moo_splash", "1");
      const t = setTimeout(() => setSplash(false), 1800);
      return () => clearTimeout(t);
    }
  }, []);

  const total = useMemo(() => selected.price * qty, [selected, qty]);

  function openOrder(product = PRODUCTS[0]) {
    setSelected(product);
    setQty(product.id === "family" ? 1 : product.id === "jumbo" ? 1 : 5);
    setShowOrder(true);
  }

  async function submit() {
    if (!phone.match(/^[0-9+]{7,15}$/)) { toast.error("Enter a valid phone number"); return; }
    if (!area) { toast.error("Select your delivery area"); return; }
    if (location.trim().length < 3) { toast.error("Enter your delivery location"); return; }
    setSubmitting(true);
    try {
      const res = await sendOrder({
        data: {
          product: selected.name,
          quantity: qty,
          unitPrice: selected.price,
          total,
          phone,
          area,
          location,
          instructions: notes,
        },
      });
      if (!res.ok) {
        toast.error("Order saved, but notification failed. Please WhatsApp us.");
      } else {
        toast.success("Order received! 🎉");
      }
      const ref = "MOO" + Math.floor(100000 + Math.random() * 900000);
      setConfirmed({ total, ref });
      setShowOrder(false);
    } catch (e) {
      console.error(e);
      toast.error("Couldn't send order. Try WhatsApp instead.");
    } finally {
      setSubmitting(false);
    }
  }

  function copyMpesa() {
    navigator.clipboard.writeText(MPESA);
    setCopied(true);
    toast.success("MPESA number copied");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Splash */}
      {splash && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-hero animate-fade-up">
          <div className="text-center text-primary-foreground">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 backdrop-blur animate-float">
              <Flame className="h-10 w-10" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Moo Chapatis</h1>
            <p className="mt-2 text-sm opacity-90">Order, We Deliver</p>
          </div>
        </div>
      )}

      {/* Sticky nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a href="#top" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-soft">
              <Flame className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <div className="text-base font-extrabold tracking-tight">Moo Chapatis</div>
              <div className="text-[10px] font-medium text-muted-foreground">Order, We Deliver</div>
            </div>
          </a>
          <Button size="sm" className="rounded-full bg-gradient-primary shadow-soft" onClick={() => openOrder()}>
            <ShoppingBag className="mr-1.5 h-4 w-4" /> Order
          </Button>
        </div>
      </header>

      <main id="top">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-hero opacity-95" />
          <div className="absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-8 sm:pt-14">
            <div className="grid items-center gap-6 sm:grid-cols-2">
              <div className="text-primary-foreground animate-fade-up">
                <Badge className="mb-3 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur hover:bg-white/30">
                  <Sparkles className="mr-1 h-3 w-3" /> Kitengela • 7PM–10PM
                </Badge>
                <h1 className="text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl">
                  Fresh Hot Chapatis<br />Delivered Fast.
                </h1>
                <p className="mt-3 text-base/relaxed opacity-95">
                  Order, We Deliver. Soft, layered chapatis cooked fresh and brought hot to your door.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button size="lg" onClick={() => openOrder()} className="rounded-full bg-white text-primary shadow-glow hover:bg-white/95">
                    <ShoppingBag className="mr-2 h-5 w-5" /> Order Now
                  </Button>
                  <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer">
                    <Button size="lg" variant="outline" className="rounded-full border-white/40 bg-white/10 text-white backdrop-blur hover:bg-white/20 hover:text-white">
                      <MessageCircle className="mr-2 h-5 w-5" /> WhatsApp
                    </Button>
                  </a>
                </div>
                <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-black/25 px-3 py-1.5 text-xs font-semibold backdrop-blur">
                  <Gift className="h-3.5 w-3.5" /> Claim a BONUS on your first order of 5+ chapatis!
                </div>
              </div>

              <div className="relative animate-fade-up">
                <div className="absolute inset-0 -z-10 rounded-[2rem] bg-white/20 blur-2xl" />
                <img
                  src={heroImg}
                  alt="Stack of fresh hot Moo Chapatis"
                  className="mx-auto w-full max-w-sm rounded-[2rem] shadow-glow ring-4 ring-white/30"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Quick info */}
        <section className="mx-auto -mt-5 max-w-6xl px-4">
          <div className="grid grid-cols-3 gap-2 rounded-2xl border bg-card p-2 shadow-card sm:gap-3 sm:p-4">
            {[
              { icon: Clock, label: "Daily 7–10 PM" },
              { icon: Truck, label: "Free over 10" },
              { icon: MapPin, label: "All Kitengela" },
            ].map((it, i) => (
              <div key={i} className="flex flex-col items-center justify-center rounded-xl bg-secondary/60 p-3 text-center sm:flex-row sm:gap-2">
                <it.icon className="mb-1 h-4 w-4 text-primary sm:mb-0" />
                <span className="text-[11px] font-semibold sm:text-sm">{it.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Menu */}
        <section id="menu" className="mx-auto max-w-6xl px-4 py-10">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Today's Menu</h2>
              <p className="text-sm text-muted-foreground">Tap any item to order in seconds.</p>
            </div>
            <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/15">
              <Flame className="mr-1 h-3 w-3" /> Hot
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {PRODUCTS.map((p) => (
              <button
                key={p.id}
                onClick={() => openOrder(p)}
                className="group relative overflow-hidden rounded-2xl border bg-card p-3 text-left shadow-card transition-all hover:-translate-y-1 hover:shadow-glow"
              >
                <div className="relative mb-3 overflow-hidden rounded-xl bg-secondary/60 aspect-square">
                  <img src={heroImg} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow-soft">
                    {p.tag}
                  </span>
                </div>
                <div className="text-sm font-bold leading-tight">{p.name}</div>
                <div className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{p.desc}</div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-base font-black text-primary">KSh {p.price}</span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-soft transition-transform group-hover:scale-110">
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Promo banner */}
        <section className="mx-auto max-w-6xl px-4 pb-10">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-5 text-primary-foreground shadow-glow sm:p-8">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
            <Badge className="rounded-full bg-white/20 text-white hover:bg-white/25">Flash Bonus</Badge>
            <h3 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">
              First 5+ orders get a FREE bonus chapati 🎁
            </h3>
            <p className="mt-1 max-w-md text-sm opacity-95">
              Order today and we'll add extras to your pack. Limited daily — order early!
            </p>
            <Button onClick={() => openOrder()} className="mt-4 rounded-full bg-white text-primary hover:bg-white/95">
              Claim Bonus
            </Button>
          </div>
        </section>

        {/* Coverage */}
        <section id="coverage" className="mx-auto max-w-6xl px-4 pb-10">
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Delivery Coverage</h2>
          <p className="mb-4 text-sm text-muted-foreground">We deliver across Kitengela and nearby areas.</p>
          <div className="flex flex-wrap gap-2">
            {AREAS.filter((a) => a !== "Other (specify)").map((a) => (
              <span key={a} className="rounded-full border bg-card px-3 py-1.5 text-xs font-semibold shadow-card">
                <MapPin className="mr-1 inline h-3 w-3 text-primary" />
                {a}
              </span>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="mx-auto max-w-6xl px-4 pb-10">
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">What customers say</h2>
          <p className="mb-4 text-sm text-muted-foreground">Loved by Kitengela.</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="rounded-2xl border bg-card p-4 shadow-card">
                <div className="mb-2 flex">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm">"{t.text}"</p>
                <div className="mt-3 text-xs font-semibold">
                  {t.name} <span className="text-muted-foreground">• {t.area}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="mx-auto max-w-6xl px-4 pb-24">
          <div className="grid gap-3 rounded-3xl border bg-card p-5 shadow-card sm:grid-cols-3">
            <a href={`tel:+${WHATSAPP}`} className="flex items-center gap-3 rounded-2xl bg-secondary/60 p-4 transition hover:bg-secondary">
              <Phone className="h-5 w-5 text-primary" />
              <div>
                <div className="text-[11px] text-muted-foreground">Call us</div>
                <div className="text-sm font-bold">{PHONE}</div>
              </div>
            </a>
            <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl bg-secondary/60 p-4 transition hover:bg-secondary">
              <MessageCircle className="h-5 w-5 text-primary" />
              <div>
                <div className="text-[11px] text-muted-foreground">WhatsApp</div>
                <div className="text-sm font-bold">{PHONE}</div>
              </div>
            </a>
            <div className="flex items-center gap-3 rounded-2xl bg-secondary/60 p-4">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <div className="text-[11px] text-muted-foreground">Open daily</div>
                <div className="text-sm font-bold">7:00 PM – 10:00 PM</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-card/60 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Moo Chapatis • Kitengela, Kenya • Order, We Deliver
      </footer>

      {/* Floating WhatsApp */}
      <a
        href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Hi Moo Chapatis! I'd like to order.")}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[oklch(0.7_0.18_150)] text-white shadow-glow animate-pulse-glow"
      >
        <MessageCircle className="h-7 w-7" />
      </a>

      {/* Order dialog */}
      <Dialog open={showOrder} onOpenChange={setShowOrder}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Place your order</DialogTitle>
            <DialogDescription>Fast, hot, delivered to your door.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Product</Label>
              <Select value={selected.id} onValueChange={(v) => setSelected(PRODUCTS.find((p) => p.id === v)!)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRODUCTS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} — KSh {p.price}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Quantity</Label>
                <Input type="number" min={1} max={500} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} className="rounded-xl" />
              </div>
              <div>
                <Label className="text-xs">Total</Label>
                <div className="flex h-9 items-center rounded-xl bg-gradient-primary px-3 text-sm font-bold text-primary-foreground shadow-soft">
                  KSh {total}
                </div>
              </div>
            </div>
            <div>
              <Label className="text-xs">Phone number</Label>
              <Input inputMode="tel" placeholder="07XX XXX XXX" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <Label className="text-xs">Delivery area</Label>
              <Select value={area} onValueChange={setArea}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select area" /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {AREAS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Exact location / landmark</Label>
              <Input placeholder="e.g. House 12, near Naivas" value={location} onChange={(e) => setLocation(e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <Label className="text-xs">Extra instructions (optional)</Label>
              <Textarea rows={2} placeholder="Gate code, preferred time…" value={notes} onChange={(e) => setNotes(e.target.value)} className="rounded-xl" />
            </div>
            <Button disabled={submitting} onClick={submit} className="w-full rounded-full bg-gradient-primary py-6 text-base font-bold shadow-glow">
              {submitting ? "Sending…" : `Place Order • KSh ${total}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation + MPESA */}
      <Dialog open={!!confirmed} onOpenChange={(o) => !o && setConfirmed(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-[oklch(0.7_0.18_150)] text-white">
              <Check className="h-7 w-7" />
            </div>
            <DialogTitle className="text-center text-xl font-black">Order received! 🎉</DialogTitle>
            <DialogDescription className="text-center">
              Ref <b>{confirmed?.ref}</b> • Total <b>KSh {confirmed?.total}</b>
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl border bg-gradient-to-br from-primary/10 to-primary-glow/10 p-4">
            <div className="text-xs font-semibold text-muted-foreground">Pay via MPESA</div>
            <div className="mt-1 flex items-center justify-between">
              <div className="text-2xl font-black tracking-tight text-primary">{MPESA}</div>
              <Button size="sm" onClick={copyMpesa} className="rounded-full">
                {copied ? <><Check className="mr-1 h-4 w-4" /> Copied</> : <><Copy className="mr-1 h-4 w-4" /> Copy</>}
              </Button>
            </div>
            <ol className="mt-3 space-y-1 text-xs text-muted-foreground">
              <li>1. Go to MPESA → Send Money</li>
              <li>2. Enter the number <b>{MPESA}</b></li>
              <li>3. Enter amount <b>KSh {confirmed?.total}</b></li>
              <li>4. Use your phone to confirm</li>
            </ol>
          </div>
          <div className="rounded-xl bg-secondary/60 p-3 text-xs">
            <b>Estimated delivery:</b> 20–40 mins (7–10 PM). We'll WhatsApp you for confirmation.
          </div>
          <div className="flex gap-2">
            <a href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hi, I just placed order ${confirmed?.ref} for KSh ${confirmed?.total}.`)}`} target="_blank" rel="noreferrer" className="flex-1">
              <Button className="w-full rounded-full bg-[oklch(0.7_0.18_150)] hover:bg-[oklch(0.65_0.18_150)]">
                <MessageCircle className="mr-2 h-4 w-4" /> Confirm on WhatsApp
              </Button>
            </a>
            <Button variant="outline" onClick={() => setConfirmed(null)} className="rounded-full">
              <X className="mr-1 h-4 w-4" /> Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
