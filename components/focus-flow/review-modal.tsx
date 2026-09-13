import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { ScaledText } from "./scaled-text";
import { COLORS, safeHaptic, useFocusPalette } from "./ui";
import { isEnglish } from "@/lib/focus-flow/i18n";
import { useFocusFlow } from "@/lib/focus-flow/provider";
import {
  openStoreReview,
  recordReviewAction,
  SUPPORT_EMAIL,
} from "@/lib/focus-flow/review-prompt";

export type ReviewModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function ReviewModal({ visible, onClose }: ReviewModalProps) {
  const router = useRouter();
  const { displaySettings } = useFocusFlow();
  const palette = useFocusPalette();
  const english = isEnglish(displaySettings);

  const [stage, setStage] = useState<"ask" | "positive" | "feedback">("ask");

  const handleClose = () => {
    setStage("ask");
    onClose();
  };

  const handleDismiss = async () => {
    safeHaptic("light");
    await recordReviewAction("dismiss");
    handleClose();
  };

  const handleRateStore = async () => {
    safeHaptic("success");
    await recordReviewAction("rated");
    handleClose();
    await openStoreReview();
  };

  const handleSendFeedback = async () => {
    safeHaptic("light");
    await recordReviewAction("feedback");
    handleClose();
    // サポート画面へ遷移、またはメーラー起動
    const mailUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      english ? "Focus Flow Feedback & Suggestions" : "Focus Flow ご意見・改善のご提案"
    )}`;
    try {
      const canOpen = await Linking.canOpenURL(mailUrl);
      if (canOpen) {
        await Linking.openURL(mailUrl);
        return;
      }
    } catch {
      // fallback
    }
    router.push("/support" as never);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
            },
          ]}
        >
          {stage === "ask" ? (
            <>
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: palette.primarySoft },
                ]}
              >
                <Text style={styles.emojiIcon}>⭐</Text>
              </View>

              <ScaledText style={[styles.title, { color: palette.text }]}>
                {english ? "Enjoying Focus Flow?" : "Focus Flow は役立っていますか？"}
              </ScaledText>

              <ScaledText style={[styles.message, { color: palette.muted }]}>
                {english
                  ? "Great work on reaching your goals today! Is Focus Flow helping you stay focused and build daily habits?"
                  : "今日の目標達成おめでとうございます！Focus Flowは日々の集中と習慣化のサポートになっていますか？"}
              </ScaledText>

              <View style={styles.buttonCol}>
                <TouchableOpacity
                  activeOpacity={0.82}
                  onPress={() => {
                    safeHaptic("success");
                    setStage("positive");
                  }}
                  style={[styles.primaryButton, { backgroundColor: palette.primary }]}
                >
                  <Text
                    style={[
                      styles.primaryButtonText,
                      { color: palette.isDark ? palette.background : COLORS.white },
                    ]}
                  >
                    {english ? "Yes, loving it! 😊" : "はい、とても満足！ 😊"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.82}
                  onPress={() => {
                    safeHaptic("light");
                    setStage("feedback");
                  }}
                  style={[styles.secondaryButton, { borderColor: palette.border, backgroundColor: palette.elevated }]}
                >
                  <Text style={[styles.secondaryButtonText, { color: palette.text }]}>
                    {english ? "Could be better / Needs work" : "改善してほしい点がある"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleDismiss}
                  hitSlop={8}
                  style={styles.textButton}
                >
                  <Text style={[styles.textButtonLabel, { color: palette.muted }]}>
                    {english ? "Ask me later" : "後で回答する"}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : stage === "positive" ? (
            <>
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: palette.primarySoft },
                ]}
              >
                <Text style={styles.emojiIcon}>🎉</Text>
              </View>

              <ScaledText style={[styles.title, { color: palette.text }]}>
                {english ? "Thank You!" : "ありがとうございます！"}
              </ScaledText>

              <ScaledText style={[styles.message, { color: palette.muted }]}>
                {english
                  ? "Your support keeps us going. Would you take 10 seconds to leave a 5-star review on Google Play?"
                  : "開発チームの大きな励みになります。よろしければGoogle Playストアで星5つのレビューをいただけませんか？"}
              </ScaledText>

              <View style={styles.buttonCol}>
                <TouchableOpacity
                  activeOpacity={0.82}
                  onPress={handleRateStore}
                  style={[styles.primaryButton, { backgroundColor: "#B87A10" }]}
                >
                  <View style={styles.rateRow}>
                    <MaterialIcons name="star" size={18} color="#FFFFFF" />
                    <Text style={[styles.primaryButtonText, { color: "#FFFFFF" }]}>
                      {english ? "Rate 5 Stars on Google Play" : "★5 でストアを評価する"}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleDismiss}
                  hitSlop={8}
                  style={styles.textButton}
                >
                  <Text style={[styles.textButtonLabel, { color: palette.muted }]}>
                    {english ? "Maybe later" : "また今度"}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: palette.isDark ? "#3F2C35" : "#FEECEF" },
                ]}
              >
                <MaterialIcons name="chat" size={26} color={palette.primary} />
              </View>

              <ScaledText style={[styles.title, { color: palette.text }]}>
                {english ? "We Value Your Feedback" : "ご意見をお聞かせください"}
              </ScaledText>

              <ScaledText style={[styles.message, { color: palette.muted }]}>
                {english
                  ? "We are sorry for any inconvenience. Please let us know how we can make Focus Flow better for you."
                  : "ご期待に沿えず申し訳ありません。使いづらい点や不具合など、改善に向けたご意見を直接開発チームにお送りください。"}
              </ScaledText>

              <View style={styles.buttonCol}>
                <TouchableOpacity
                  activeOpacity={0.82}
                  onPress={handleSendFeedback}
                  style={[styles.primaryButton, { backgroundColor: palette.primary }]}
                >
                  <View style={styles.rateRow}>
                    <MaterialIcons name="mail-outline" size={18} color={palette.isDark ? palette.background : COLORS.white} />
                    <Text
                      style={[
                        styles.primaryButtonText,
                        { color: palette.isDark ? palette.background : COLORS.white },
                      ]}
                    >
                      {english ? "Send Feedback / Bug Report" : "ご意見・不具合を直接送信"}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleDismiss}
                  hitSlop={8}
                  style={styles.textButton}
                >
                  <Text style={[styles.textButtonLabel, { color: palette.muted }]}>
                    {english ? "Dismiss" : "閉じる"}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(16, 26, 22, 0.62)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 18,
    alignItems: "center",
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emojiIcon: {
    fontSize: 26,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  buttonCol: {
    width: "100%",
    gap: 9,
  },
  rateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "800",
  },
  secondaryButton: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: "800",
  },
  textButton: {
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  textButtonLabel: {
    fontSize: 12.5,
    fontWeight: "700",
  },
});
