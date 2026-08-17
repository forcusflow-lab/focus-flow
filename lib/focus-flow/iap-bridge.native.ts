import { deepLinkToSubscriptions, useIAP, type ProductSubscription } from "expo-iap";

import type { IapBridge, IapBridgeOptions } from "./iap-bridge";

export async function openSubscriptionManagement(): Promise<void> {
  await deepLinkToSubscriptions({ skuAndroid: "focus_flow_plus", packageNameAndroid: "com.app.focusflow" });
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
    fetchProducts: async (skus) => { await iap.fetchProducts({ skus, type: "subs" }); },
    getActiveSubscriptions: async () => { await iap.getActiveSubscriptions(); },
    reconnect: async () => { await iap.reconnect(); },
    requestPurchase: async (request) => { await iap.requestPurchase(request); },
    restorePurchases: iap.restorePurchases,
  };
}
