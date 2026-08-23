"use client";

import { useState } from "react";
import { ArrowLeft, Loader2, ShoppingBag, Truck, Check, ShieldCheck, Zap } from "lucide-react";
import { useShop } from "@/store/use-shop";
import { useGamification } from "@/store/use-gamification";
import { celebrateOrderComplete } from "@/lib/celebrations";
import { playOrderComplete } from "@/lib/sounds";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { computePricing } from "@/lib/pricing";

type PaymentMethod = "tng" | "duitnow" | "card";

const PRESET_ADDRESSES = [
  { label: "KLCC, Kuala Lumpur", city: "Kuala Lumpur", state: "WP Kuala Lumpur", zip: "50450", address: "Suria KLCC, Jalan Ampang" },
  { label: "Petaling Jaya, Selangor", city: "Petaling Jaya", state: "Selangor", zip: "47301", address: "Jalan SS 21/37, Damansara Utama" },
  { label: "Shah Alam, Selangor", city: "Shah Alam", state: "Selangor", zip: "40000", address: "Seksyen 7, Persiaran Masjid" },
  { label: "Georgetown, Penang", city: "Georgetown", state: "Pulau Pinang", zip: "10200", address: "Gurney Drive" },
];

const PAYMENTS: {
  id: PaymentMethod;
  name: string;
  desc: string;
  badge: string;
  badgeBg: string;
  badgeColor: string;
}[] = [
  {
    id: "tng",
    name: "Touch 'n Go",
    desc: "Pay with TNG eWallet",
    badge: "TNG",
    badgeBg: "bg-[#005EB8]",
    badgeColor: "text-white",
  },
  {
    id: "duitnow",
    name: "DuitNow QR / FPX",
    desc: "Instant online banking",
    badge: "DN",
    badgeBg: "bg-[var(--color-dowgnut-blue-dark)]",
    badgeColor: "text-white",
  },
  {
    id: "card",
    name: "Debit / Credit Card",
    desc: "Visa / Mastercard",
    badge: "💳",
    badgeBg: "bg-white",
    badgeColor: "text-[var(--color-dowgnut-blue-dark)]",
  },
];

export function CheckoutView() {
  const cart = useShop((s) => s.cart);
  const checkout = useShop((s) => s.checkout);
  const setView = useShop((s) => s.setView);
  const startTracking = useShop((s) => s.startTracking);
  const recordOrder = useGamification((s) => s.recordOrder);
  const profile = useShop((s) => s.profile);
  const { toast } = useToast();

  // Pre-fill from saved profile + default address (return customer)
  const defaultAddr = profile?.addresses.find((a) => a.isDefault) ?? profile?.addresses[0];

  const [form, setForm] = useState({
    customerName: profile?.customerName ?? "",
    customerEmail: profile?.customerEmail ?? "",
    customerPhone: profile?.customerPhone ?? defaultAddr?.customerPhone ?? "",
    address: defaultAddr?.address ?? "",
    city: defaultAddr?.city ?? "",
    state: defaultAddr?.state ?? "",
    zip: defaultAddr?.zip ?? "",
    notes: "",
  });
  const [payment, setPayment] = useState<PaymentMethod>("tng");
  const [submitting, setSubmitting] = useState(false);

  const subtotal = cart.reduce((sum, c) => sum + c.donut.price * c.quantity, 0);
  const { delivery, sst, total } = computePricing(subtotal);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const applyPreset = (preset: typeof PRESET_ADDRESSES[0]) => {
    setForm((f) => ({
      ...f,
      address: preset.address,
      city: preset.city,
      state: preset.state,
      zip: preset.zip,
    }));
    toast({
      title: "Preset applied 📍",
      description: preset.label,
    });
  };

  const validate = () => {
    const missing: string[] = [];
    if (!form.customerName.trim()) missing.push("name");
    if (!form.customerEmail.trim()) missing.push("email");
    if (!form.customerPhone.trim()) missing.push("phone");
    if (!form.address.trim()) missing.push("address");
    if (!form.city.trim()) missing.push("city");
    if (!form.state.trim()) missing.push("state");
    if (!form.zip.trim()) missing.push("postcode");
    if (form.zip && !/^\d{5}$/.test(form.zip.trim())) missing.push("postcode (5 digits)");
    if (form.customerPhone && !/^[0-9+\-\s]{10,15}$/.test(form.customerPhone.trim())) missing.push("phone (valid number)");
    return missing;
  };

  const onPlace = async () => {
    const missing = validate();
    if (missing.length > 0) {
      toast({
        title: "Missing required fields",
        description: `Please fill: ${missing.join(", ")}`,
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      // 1. Create the order on the server
      const order = await checkout({
        ...form,
        paymentMethod: payment,
      });

      // 2. Ask Billplz (or dev fallback) for a payment URL
      const billRes = await fetch("/api/payment/billplz/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const billData = await billRes.json().catch(() => ({} as any));

      if (billRes.ok && billData.paymentUrl) {
        toast({
          title: "Redirecting to payment…",
          description: `${PAYMENTS.find((p) => p.id === payment)?.name} secured by Billplz.`,
        });
        celebrateOrderComplete();
        playOrderComplete();
        const donutNames = order.items.map((i: any) => i.name);
        const types = cart.map((c) => c.donut.type);
        recordOrder(donutNames, types);
        startTracking(order.id, form.customerName);
        window.location.href = billData.paymentUrl;
        return;
      }

      // 3. Fallback (inline confirmation)
      toast({
        title: "Payment successful! 🍩",
        description: `Order confirmed via ${PAYMENTS.find((p) => p.id === payment)?.name}.`,
      });
      celebrateOrderComplete();
      playOrderComplete();
      const donutNames = order.items.map((i: any) => i.name);
      const types = cart.map((c) => c.donut.type);
      recordOrder(donutNames, types);
      startTracking(order.id, form.customerName);
    } catch (err: any) {
      toast({
        title: "Couldn't place order",
        description: err?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <section className="mx-auto w-full max-w-3xl flex-1 px-4 pb-12 pt-8 sm:px-6">
        <div className="flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-[var(--color-dowgnut-blue-dark)]/15 bg-[var(--color-dowgnut-cream)] p-10 text-center">
          <ShoppingBag className="size-10 text-[var(--color-dowgnut-pink)]" />
          <h2 className="graffiti-text text-2xl text-[var(--color-dowgnut-blue-dark)]">
            Your cart is empty
          </h2>
          <p className="text-sm text-[var(--color-dowgnut-blue-dark)]/70">
            Add some dowgs before checking out!
          </p>
          <Button
            onClick={() => setView("shop")}
            className="rounded-full bg-[var(--color-dowgnut-pink)] px-6 text-white hover:bg-[var(--color-dowgnut-pink-dark)] hover:text-white"
          >
            Go shopping
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl flex-1 px-4 pb-12 pt-6 sm:px-6">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView("shop")}
            aria-label="Back to shop"
            className="inline-flex size-10 items-center justify-center rounded-full bg-white text-[var(--color-dowgnut-blue)] shadow-xs hover:bg-[var(--color-dowgnut-blue)] hover:text-white transition-colors"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-dowgnut-pink-dark)]">
              Step 2 of 2
            </p>
            <h1 className="graffiti-text text-2xl text-[var(--color-dowgnut-blue-dark)] sm:text-3xl">
              Checkout & Delivery
            </h1>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left: delivery + payment */}
        <div className="flex flex-col gap-6">
          {/* Quick-Fill Presets */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--color-dowgnut-blue-dark)]/70 shrink-0">
              <Zap className="size-3.5 text-amber-500 fill-amber-400" /> Quick Fill:
            </span>
            {PRESET_ADDRESSES.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset)}
                className="shrink-0 rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-[var(--color-dowgnut-blue-dark)] shadow-2xs border border-[rgba(239,159,189,0.3)] hover:bg-white active:scale-95 transition-transform"
              >
                📍 {preset.label.split(",")[0]}
              </button>
            ))}
          </div>

          {/* Delivery details */}
          <Card className="gap-4 rounded-3xl border border-[rgba(239,159,189,0.3)] bg-white/80 backdrop-blur-sm p-5 sm:p-6 shadow-xs">
            <h2 className="graffiti-text text-xl text-[var(--color-dowgnut-blue-dark)]">
              Delivery Address
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name" className="text-xs font-bold text-[var(--color-dowgnut-blue-dark)]">Recipient Name *</Label>
                <Input id="name" value={form.customerName} onChange={set("customerName")} placeholder="Megat Danial" className="h-11 bg-white rounded-xl" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email" className="text-xs font-bold text-[var(--color-dowgnut-blue-dark)]">Email Address *</Label>
                <Input id="email" type="email" value={form.customerEmail} onChange={set("customerEmail")} placeholder="megat@dowgnut.com" className="h-11 bg-white rounded-xl" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="phone" className="text-xs font-bold text-[var(--color-dowgnut-blue-dark)]">Phone Number *</Label>
                <Input id="phone" type="tel" value={form.customerPhone} onChange={set("customerPhone")} placeholder="012-345 6789" className="h-11 bg-white rounded-xl" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="zip" className="text-xs font-bold text-[var(--color-dowgnut-blue-dark)]">Postcode * (5 digits)</Label>
                <Input id="zip" value={form.zip} onChange={set("zip")} placeholder="50450" maxLength={5} className="h-11 bg-white rounded-xl" />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="address" className="text-xs font-bold text-[var(--color-dowgnut-blue-dark)]">Street Address *</Label>
                <Input id="address" value={form.address} onChange={set("address")} placeholder="Unit / Street / Building" className="h-11 bg-white rounded-xl" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="city" className="text-xs font-bold text-[var(--color-dowgnut-blue-dark)]">City *</Label>
                <Input id="city" value={form.city} onChange={set("city")} placeholder="Kuala Lumpur" className="h-11 bg-white rounded-xl" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="state" className="text-xs font-bold text-[var(--color-dowgnut-blue-dark)]">State *</Label>
                <select
                  id="state"
                  value={form.state}
                  onChange={set("state") as any}
                  className="h-11 rounded-xl border border-[var(--color-dowgnut-blue-dark)]/15 bg-white px-3 text-sm font-semibold"
                >
                  <option value="">Select state</option>
                  <option value="Selangor">Selangor</option>
                  <option value="WP Kuala Lumpur">WP Kuala Lumpur</option>
                  <option value="WP Putrajaya">WP Putrajaya</option>
                  <option value="Pulau Pinang">Pulau Pinang</option>
                  <option value="Johor">Johor</option>
                  <option value="Perak">Perak</option>
                  <option value="Sabah">Sabah</option>
                  <option value="Sarawak">Sarawak</option>
                  <option value="Negeri Sembilan">Negeri Sembilan</option>
                  <option value="Kedah">Kedah</option>
                  <option value="Kelantan">Kelantan</option>
                  <option value="Terengganu">Terengganu</option>
                  <option value="Pahang">Pahang</option>
                  <option value="Melaka">Melaka</option>
                  <option value="Perlis">Perlis</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="notes" className="text-xs font-bold text-[var(--color-dowgnut-blue-dark)]">Delivery Notes (optional)</Label>
                <Textarea id="notes" value={form.notes} onChange={set("notes")} placeholder="Leave at guardhouse, ring bell, etc." className="min-h-16 bg-white rounded-xl resize-none" />
              </div>
            </div>
          </Card>

          {/* Payment method — Malaysia gateways */}
          <Card className="gap-4 rounded-3xl border border-[rgba(239,159,189,0.3)] bg-white/80 backdrop-blur-sm p-5 sm:p-6 shadow-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-[var(--color-dowgnut-blue)]" />
              <h2 className="graffiti-text text-xl text-[var(--color-dowgnut-blue-dark)]">
                Select Payment Method
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {PAYMENTS.map((p) => {
                const selected = payment === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPayment(p.id)}
                    className={cn(
                      "relative flex flex-col items-start gap-2 rounded-2xl border-2 p-3.5 text-left transition-all",
                      selected
                        ? "border-[var(--color-dowgnut-pink)] bg-white shadow-md scale-[1.02]"
                        : "border-[var(--color-dowgnut-blue-dark)]/10 bg-white/60 hover:border-[var(--color-dowgnut-blue-dark)]/30"
                    )}
                  >
                    {selected && (
                      <span className="absolute right-2 top-2 inline-flex size-5 items-center justify-center rounded-full bg-[var(--color-dowgnut-pink)] text-white shadow-2xs">
                        <Check className="size-3" />
                      </span>
                    )}
                    <span className={cn("inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-black shadow-2xs", p.badgeBg, p.badgeColor)}>
                      {p.badge}
                    </span>
                    <div>
                      <p className="text-sm font-black text-[var(--color-dowgnut-blue-dark)]">{p.name}</p>
                      <p className="text-[11px] text-[var(--color-dowgnut-blue-dark)]/60">{p.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] font-medium text-[var(--color-dowgnut-blue-dark)]/60">
              🔒 100% Encrypted & Verified via Bank Negara Malaysia FPX / TNG eWallet.
            </p>
          </Card>
        </div>

        {/* Right: order summary */}
        <Card className="h-fit gap-3 rounded-3xl border border-[rgba(239,159,189,0.3)] bg-white/95 backdrop-blur-md p-5 sm:p-6 shadow-md">
          <h2 className="graffiti-text text-xl text-[var(--color-dowgnut-blue-dark)]">
            Order Summary
          </h2>
          <ul className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
            {cart.map((item) => (
              <li key={item.id} className="flex items-center gap-3 rounded-2xl bg-[var(--color-dowgnut-cream)] p-2 border border-white/60">
                <img src={item.donut.imgUrl} alt={item.donut.name} className="size-12 object-contain select-none" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="line-clamp-1 text-xs font-black text-[var(--color-dowgnut-blue-dark)]">{item.donut.name}</span>
                  <span className="text-[11px] font-semibold text-[var(--color-dowgnut-blue-dark)]/60">{item.quantity} × RM {item.donut.price.toFixed(2)}</span>
                </div>
                <span className="text-xs font-black text-[var(--color-dowgnut-blue-dark)]">RM {(item.donut.price * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 space-y-1.5 border-t border-[var(--color-dowgnut-blue-dark)]/10 pt-3 text-xs font-bold text-[var(--color-dowgnut-blue-dark)]/80">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-black text-[var(--color-dowgnut-blue-dark)]">RM {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1"><Truck className="size-3.5 text-[var(--color-dowgnut-pink)]" /> Delivery</span>
              <span className="font-black text-[var(--color-dowgnut-pink-dark)]">{delivery === 0 ? "FREE" : `RM ${delivery.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between">
              <span>SST (6%)</span>
              <span className="font-black text-[var(--color-dowgnut-blue-dark)]">RM {sst.toFixed(2)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-[var(--color-dowgnut-blue-dark)]/10 pt-2 text-base font-black text-[var(--color-dowgnut-blue-dark)]">
              <span>Total Payable</span>
              <span className="text-lg text-[var(--color-dowgnut-pink-dark)]">RM {total.toFixed(2)}</span>
            </div>
          </div>

          <Button
            onClick={onPlace}
            disabled={submitting}
            className="mt-3 h-12 w-full rounded-full bg-[var(--color-dowgnut-pink)] text-sm font-black text-white hover:bg-[var(--color-dowgnut-pink-dark)] shadow-md active:scale-95 transition-transform"
          >
            {submitting ? (
              <><Loader2 className="size-4 animate-spin" /> Processing Payment…</>
            ) : (
              <>Pay RM {total.toFixed(2)} with {PAYMENTS.find((p) => p.id === payment)?.name}</>
            )}
          </Button>
        </Card>
      </div>
    </section>
  );
}
