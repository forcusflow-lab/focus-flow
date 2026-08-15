import { NativeModules, Platform } from "react-native";

export type BillingStatus = "unavailable" | "loading" | "eligible" | "pending" | "active" | "inactive" | "error";
export type PlusStatus = { status: BillingStatus; active: boolean; productId?: string; price?: string; reason?: string };

type FocusBillingNativeModule = { getPlusStatus: () => Promise<PlusStatus>; restorePlus: () => Promise<PlusStatus>; purchasePlus: () => Promise<PlusStatus> };
const nativeBilling = () => Platform.OS === "android" ? (NativeModules.FocusBilling as FocusBillingNativeModule | undefined) : undefined;
const unavailable: PlusStatus = { status: "unavailable", active: false };

export async function getPlusStatus(): Promise<PlusStatus> { try { return (await nativeBilling()?.getPlusStatus()) ?? unavailable; } catch { return { status: "error", active: false, reason: "STATUS_UNAVAILABLE" }; } }
export async function restorePlus(): Promise<PlusStatus> { try { return (await nativeBilling()?.restorePlus()) ?? unavailable; } catch { return { status: "error", active: false, reason: "RESTORE_UNAVAILABLE" }; } }
export async function purchasePlus(): Promise<PlusStatus> { try { return (await nativeBilling()?.purchasePlus()) ?? unavailable; } catch { return { status: "error", active: false, reason: "PURCHASE_UNAVAILABLE" }; } }
