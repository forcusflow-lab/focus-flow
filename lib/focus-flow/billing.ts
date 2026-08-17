export const PLUS_PRODUCT_ID = "focus_flow_plus";
/** 時間管理項目を設定時間前に1回だけ完了するための消費型商品。 */
export const EARLY_COMPLETION_PRODUCT_ID = "focus_flow_early_complete_100";
export const FREE_ITEM_LIMIT = 2;
export const FREE_BLOCKED_APP_LIMIT = 5;

export type BillingStatus = "unavailable" | "loading" | "eligible" | "pending" | "active" | "inactive" | "error";
export type PlusStatus = {
  status: BillingStatus;
  active: boolean;
  productId?: string;
  price?: string;
  reason?: string;
};

export type EarlyCompletionStatus = {
  status: BillingStatus;
  productId?: string;
  price?: string;
  reason?: string;
};
