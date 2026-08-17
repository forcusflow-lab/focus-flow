export const PLUS_PRODUCT_ID = "focus_flow_plus";

export type BillingStatus = "unavailable" | "loading" | "eligible" | "pending" | "active" | "inactive" | "error";
export type PlusStatus = {
  status: BillingStatus;
  active: boolean;
  productId?: string;
  price?: string;
  reason?: string;
};
