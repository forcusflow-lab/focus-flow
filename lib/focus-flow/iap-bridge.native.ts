import { deepLinkToSubscriptions, finishTransaction, useIAP, type Product, type ProductSubscription, type Purchase } from "expo-iap";

import type { IapBridge, IapBridgeOptions } from "./iap-bridge";

export async function openSubscriptionManagement(): Promise<void> {
  await deepLinkToSubscriptions({ skuAndroid: "focus_flow_plus", packageNameAndroid: "com.app.focusflow" });
}

export async function finishPlatformPurchase(purchase: unknown, isConsumable = false): Promise<void> {
  await finishTransaction({ purchase: purchase as Purchase, isConsumable });
}

export function usePlatformIAP(options: IapBridgeOptions): IapBridge {
  const iap = useIAP({
    onPurchaseSuccess: options.onPurchaseSuccess,
    onPurchaseError: options.onPurchaseError,
    onError: options.onError,
  });

  return {
    activeSubscriptions: iap.activeSubscriptions,
    connected: iap.connected,
    subscriptions: iap.subscriptions as ProductSubscription[],
    products: iap.products as Product[],
    fetchProducts: async (request) => { await iap.fetchProducts(request); },
    getActiveSubscriptions: async () => { await iap.getActiveSubscriptions(); },
    reconnect: async () => { await iap.reconnect(); },
    requestPurchase: async (request) => { await iap.requestPurchase(request); },
    restorePurchases: iap.restorePurchases,
  };
}
