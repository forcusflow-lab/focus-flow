import AsyncStorage from "@react-native-async-storage/async-storage";
import { Linking, Platform } from "react-native";

export const REVIEW_STORAGE_KEY = "@focus-flow/review-state-v1";
export const ANDROID_PACKAGE_NAME = "com.app.focusflow";
export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE_NAME}`;
export const PLAY_STORE_MARKET_URL = `market://details?id=${ANDROID_PACKAGE_NAME}`;
export const SUPPORT_EMAIL = "forcus.flow@gmail.com";

export type ReviewState = {
  /** ユーザーが今日のタスク全完了または目標達成した累計回数 */
  milestoneCount: number;
  /** 前回レビュープロンプトを表示した日時 (ISO 8601) */
  lastPromptedAt: string | null;
  /** プロンプトの表示回数 */
  promptCount: number;
  /** 最終ステータス */
  status: "idle" | "rated" | "feedback_sent" | "dismissed";
};

export const DEFAULT_REVIEW_STATE: ReviewState = {
  milestoneCount: 0,
  lastPromptedAt: null,
  promptCount: 0,
  status: "idle",
};

/** 最初のレビュー促進に必要な最小達成回数（いきなり初回で出さずファン化を待つ） */
export const MIN_MILESTONES_BEFORE_PROMPT = 2;
/** 再度プロンプトを表示するまでの最低インターバル（30日） */
export const PROMPT_COOLDOWN_DAYS = 30;

/** レビューステートの取得 */
export async function getReviewState(): Promise<ReviewState> {
  try {
    const raw = await AsyncStorage.getItem(REVIEW_STORAGE_KEY);
    if (!raw) return DEFAULT_REVIEW_STATE;
    const parsed = JSON.parse(raw) as Partial<ReviewState>;
    return {
      milestoneCount: Number(parsed.milestoneCount) || 0,
      lastPromptedAt: parsed.lastPromptedAt ?? null,
      promptCount: Number(parsed.promptCount) || 0,
      status: parsed.status ?? "idle",
    };
  } catch {
    return DEFAULT_REVIEW_STATE;
  }
}

/** レビューステートの保存 */
export async function saveReviewState(state: ReviewState): Promise<void> {
  try {
    await AsyncStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

/**
 * レビューダイアログを表示すべきか判定する
 */
export function shouldShowReviewPrompt(state: ReviewState, now = new Date()): boolean {
  // すでにストアで星評価を済ませている場合は二度と出さない
  if (state.status === "rated") return false;

  // 最小達成回数に達していない場合は出さない
  if (state.milestoneCount < MIN_MILESTONES_BEFORE_PROMPT) return false;

  // 前回表示からのクールダウン期間（30日）を確認
  if (state.lastPromptedAt) {
    const lastDate = new Date(state.lastPromptedAt);
    const diffMs = now.getTime() - lastDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays < PROMPT_COOLDOWN_DAYS) {
      return false;
    }
  }

  return true;
}

/**
 * 達成マイルストーン（今日のタスク全完了など）を記録し、レビューを表示すべきかを返す
 */
export async function recordMilestoneAndCheckPrompt(): Promise<boolean> {
  const current = await getReviewState();
  const next: ReviewState = {
    ...current,
    milestoneCount: current.milestoneCount + 1,
  };
  await saveReviewState(next);
  return shouldShowReviewPrompt(next);
}

/**
 * レビュープロンプトを表示したことを記録
 */
export async function markReviewPromptShown(): Promise<void> {
  const current = await getReviewState();
  await saveReviewState({
    ...current,
    lastPromptedAt: new Date().toISOString(),
    promptCount: current.promptCount + 1,
  });
}

/**
 * ユーザーのリアクションを記録
 */
export async function recordReviewAction(action: "rated" | "feedback" | "dismiss"): Promise<void> {
  const current = await getReviewState();
  const nextStatus = action === "rated" ? "rated" : action === "feedback" ? "feedback_sent" : "dismissed";
  await saveReviewState({
    ...current,
    status: nextStatus,
    lastPromptedAt: new Date().toISOString(),
  });
}

/**
 * Google Play ストアのレビュー画面を開く
 */
export async function openStoreReview(): Promise<void> {
  if (Platform.OS === "android") {
    try {
      const supported = await Linking.canOpenURL(PLAY_STORE_MARKET_URL);
      if (supported) {
        await Linking.openURL(PLAY_STORE_MARKET_URL);
        return;
      }
    } catch {
      // fallback
    }
  }
  // Web fallback or other OS
  try {
    await Linking.openURL(PLAY_STORE_URL);
  } catch {
    // ignore
  }
}
