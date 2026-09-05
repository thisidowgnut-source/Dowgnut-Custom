export type PaymentState = "paid" | "pending" | "failed";

type PaymentStateInput = {
  status: string;
  paidAt?: string | Date | null;
};

/** The server-provided payment timestamp is the only positive payment proof. */
export function classifyPaymentState(order: PaymentStateInput): PaymentState {
  if (order.paidAt) return "paid";
  if (
    order.status === "payment_failed" ||
    order.status === "payment_expired"
  ) {
    return "failed";
  }
  return "pending";
}
