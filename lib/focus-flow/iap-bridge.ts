import { useMemo } from "react";

export type IapSubscription = {
  id: string;
  displayPrice?: string;
  subscriptionOffers?: Array<{ offerTokenAndroid?: string | null }> | null;
};

export type IapProduct = { id: string; displayPrice?: string };

export type IapActiveSubscription = {
  productId?: string;
  isActive?: boolean;
};

export type IapBridgeOptions = {
  onPurchaseSuccess: (purchase: unknown) => void;
  onPurchaseError: () => void;
  onError: () => void;
};

export async function finishPlatformPurchase(_purchase: unknown, _isConsumable = false): Promise<void> {
  return undefined;
}

export async function openSubscriptionManagement(): Promise<void> {
  return undefined;
}

export type IapBridge = {
  activeSubscriptions: IapActiveSubscription[];
  connected: boolean;
  subscriptions: IapSubscription[];
  products: IapProduct[];
  fetchProducts: (request: any) => Promise<void>;
  getActiveSubscriptions: (skus?: string[]) => Promise<void>;
  reconnect: () => Promise<void>;
  requestPurchase: (request: any) => Promise<void>;
  restorePurchases: () => Promise<void>;
};

export function usePlatformIAP(_options: IapBridgeOptions): IapBridge {
  return useMemo(() => ({
    activeSubscriptions: [],
    connected: false,
    subscriptions: [],
    products: [],
    fetchProducts: async () => undefined,
    getActiveSubscriptions: async () => undefined,
    reconnect: async () => undefined,
    requestPurchase: async () => undefined,
    restorePurchases: async () => undefined,
  }), []);
}
