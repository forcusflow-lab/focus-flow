import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

import { ScaledText } from "./scaled-text";
import { COLORS, safeHaptic } from "./ui";
import { getAppPalette } from "@/lib/focus-flow/app-themes";
import { isEnglish } from "@/lib/focus-flow/i18n";
import { useFocusFlow } from "@/lib/focus-flow/provider";
import { R, stringResource } from "@/lib/focus-flow/strings";

export type PaywallModalProps = {
  visible?: boolean;
  onClose?: () => void;
};

export function PaywallModal({ visible, onClose }: PaywallModalProps) {
  const router = useRouter();
  const {
    displaySettings,
    isPlus,
    plusStatus,
    paywallVisible,
    closePaywall,
    purchasePlus,
    restorePlus,
    managePlus,
  } = useFocusFlow();

  const isVisible = visible !== undefined ? visible : paywallVisible;
  const handleClose = useCallback(() => {
    if (onClose) onClose();
    else closePaywall();
  }, [closePaywall, onClose]);

  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const palette = getAppPalette(displaySettings, colorScheme);
  const english = isEnglish(displaySettings);

  const [selectedPlan, setSelectedPlan] = useState<"annual" | "monthly">("annual");
  const [busy, setBusy] = useState(false);

  // Pro化されたら自動で閉じる & 成功ハプティクス
  useEffect(() => {
    if (isPlus && isVisible) {
      safeHaptic("success");
      const timer = setTimeout(() => {
        handleClose();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [handleClose, isPlus, isVisible]);

  const handlePurchase = async () => {
    safeHaptic("light");
    setBusy(true);
    try {
      await purchasePlus();
    } catch {
      Alert.alert(
        stringResource(R.string.paywall_offline_title, english ? "en" : "ja"),
        stringResource(R.string.paywall_offline_message, english ? "en" : "ja"),
        [{ text: "OK" }],
      );
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    safeHaptic("light");
    setBusy(true);
    try {
      await restorePlus();
    } catch {
      Alert.alert(
        stringResource(R.string.paywall_offline_title, english ? "en" : "ja"),
        stringResource(R.string.paywall_offline_message, english ? "en" : "ja"),
        [{ text: "OK" }],
      );
    } finally {
      setBusy(false);
    }
  };

  const isPurchasing = busy || plusStatus.status === "loading";

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
      transparent={false}
    >
      <View style={[styles.root, { backgroundColor: palette.background }]}>
        {/* トップバー: 閉じるボタン & 復元ボタン */}
        <View style={[styles.navBar, { borderBottomColor: palette.border }]}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={english ? "Close" : "閉じる"}
            onPress={handleClose}
            hitSlop={12}
            style={[styles.closeButton, { backgroundColor: palette.elevated, borderColor: palette.border }]}
          >
            <MaterialIcons name="close" size={20} color={palette.text} />
          </TouchableOpacity>

          <View style={styles.navTitleRow}>
            <View style={[styles.miniProBadge, { backgroundColor: palette.primarySoft, borderColor: palette.primary }]}>
              <Text style={[styles.miniProBadgeText, { color: palette.primary }]}>👑 PRO</Text>
            </View>
          </View>

          {!isPlus ? (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={stringResource(R.string.paywall_restore, english ? "en" : "ja")}
              onPress={handleRestore}
              disabled={isPurchasing}
              hitSlop={8}
              style={styles.restoreTopButton}
            >
              <Text style={[styles.restoreTopText, { color: palette.primary }]}>
                {stringResource(R.string.paywall_restore, english ? "en" : "ja")}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Heroエリア: 幾何学グラデーション・透け感・クラウン */}
          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
              },
            ]}
          >
            {/* 背景装飾（幾何学模様の透け感） */}
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              <View
                style={[
                  styles.heroCircleA,
                  {
                    backgroundColor: palette.isDark ? "#2A4060" : "#B8D4E8",
                    opacity: palette.isDark ? 0.28 : 0.45,
                  },
                ]}
              />
              <View
                style={[
                  styles.heroCircleB,
                  {
                    backgroundColor: palette.isDark ? "#3D2D50" : "#D4C4E0",
                    opacity: palette.isDark ? 0.22 : 0.38,
                  },
                ]}
              />
            </View>

            <View style={[styles.heroCrownContainer, { backgroundColor: palette.primarySoft, borderColor: palette.primary }]}>
              <MaterialIcons name="workspace-premium" size={38} color={palette.primary} />
            </View>

            <ScaledText style={[styles.heroTitle, { color: palette.text }]}>
              {stringResource(R.string.paywall_hero_title, english ? "en" : "ja")}
            </ScaledText>
            <ScaledText style={[styles.heroTagline, { color: palette.muted }]}>
              {stringResource(R.string.paywall_hero_tagline, english ? "en" : "ja")}
            </ScaledText>
          </View>

          {/* Pro契約中の場合の表示 */}
          {isPlus ? (
            <View style={[styles.activeCard, { backgroundColor: palette.primarySoft, borderColor: palette.primary }]}>
              <MaterialIcons name="check-circle" size={26} color={palette.primary} />
              <View style={styles.activeCopy}>
                <Text style={[styles.activeTitle, { color: palette.text }]}>
                  {stringResource(R.string.paywall_active_title, english ? "en" : "ja")}
                </Text>
                <Text style={[styles.activeDesc, { color: palette.muted }]}>
                  {stringResource(R.string.paywall_active_desc, english ? "en" : "ja")}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Pro機能のバリュー提示（4大機能） */}
          <View style={styles.valuesSection}>
            <View style={styles.valueRow}>
              <View style={[styles.valueIconWrap, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
                <MaterialIcons name="wallpaper" size={20} color={palette.primary} />
              </View>
              <View style={styles.valueCopy}>
                <Text style={[styles.valueTitle, { color: palette.text }]}>
                  {stringResource(R.string.paywall_feature_bg_title, english ? "en" : "ja")}
                </Text>
                <Text style={[styles.valueDesc, { color: palette.muted }]}>
                  {stringResource(R.string.paywall_feature_bg_desc, english ? "en" : "ja")}
                </Text>
              </View>
            </View>

            <View style={styles.valueRow}>
              <View style={[styles.valueIconWrap, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
                <MaterialIcons name="tune" size={20} color={palette.primary} />
              </View>
              <View style={styles.valueCopy}>
                <Text style={[styles.valueTitle, { color: palette.text }]}>
                  {stringResource(R.string.paywall_feature_widget_title, english ? "en" : "ja")}
                </Text>
                <Text style={[styles.valueDesc, { color: palette.muted }]}>
                  {stringResource(R.string.paywall_feature_widget_desc, english ? "en" : "ja")}
                </Text>
              </View>
            </View>

            <View style={styles.valueRow}>
              <View style={[styles.valueIconWrap, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
                <MaterialIcons name="all-inclusive" size={20} color={palette.primary} />
              </View>
              <View style={styles.valueCopy}>
                <Text style={[styles.valueTitle, { color: palette.text }]}>
                  {stringResource(R.string.paywall_feature_unlimited_title, english ? "en" : "ja")}
                </Text>
                <Text style={[styles.valueDesc, { color: palette.muted }]}>
                  {stringResource(R.string.paywall_feature_unlimited_desc, english ? "en" : "ja")}
                </Text>
              </View>
            </View>

            <View style={styles.valueRow}>
              <View style={[styles.valueIconWrap, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
                <MaterialIcons name="lock-clock" size={20} color={palette.primary} />
              </View>
              <View style={styles.valueCopy}>
                <Text style={[styles.valueTitle, { color: palette.text }]}>
                  {stringResource(R.string.paywall_feature_limits_title, english ? "en" : "ja")}
                </Text>
                <Text style={[styles.valueDesc, { color: palette.muted }]}>
                  {stringResource(R.string.paywall_feature_limits_desc, english ? "en" : "ja")}
                </Text>
              </View>
            </View>
          </View>

          {/* プラン選択カード (未契約時) */}
          {!isPlus ? (
            <View style={styles.plansContainer}>
              {/* 年額プラン (推奨) */}
              <TouchableOpacity
                accessibilityRole="radio"
                accessibilityState={{ checked: selectedPlan === "annual" }}
                activeOpacity={0.82}
                onPress={() => {
                  safeHaptic("light");
                  setSelectedPlan("annual");
                }}
                style={[
                  styles.planCard,
                  {
                    backgroundColor: palette.surface,
                    borderColor: selectedPlan === "annual" ? palette.primary : palette.border,
                    borderWidth: selectedPlan === "annual" ? 2 : 1,
                  },
                ]}
              >
                <View style={styles.planHeaderRow}>
                  <View style={styles.planTitleCol}>
                    <View style={styles.badgeRow}>
                      <View style={[styles.bestValueBadge, { backgroundColor: "#B87A10" }]}>
                        <Text style={styles.bestValueBadgeText}>
                          👑 {stringResource(R.string.paywall_plan_annual_badge, english ? "en" : "ja")}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.planTitle, { color: palette.text }]}>
                      {stringResource(R.string.paywall_plan_annual_title, english ? "en" : "ja")}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor: selectedPlan === "annual" ? palette.primary : palette.border,
                        backgroundColor: selectedPlan === "annual" ? palette.primary : "transparent",
                      },
                    ]}
                  >
                    {selectedPlan === "annual" ? <MaterialIcons name="check" size={14} color="#FFFFFF" /> : null}
                  </View>
                </View>

                <View style={styles.planPriceRow}>
                  <Text style={[styles.planPrice, { color: palette.primary }]}>
                    {stringResource(R.string.paywall_plan_annual_price, english ? "en" : "ja")}
                  </Text>
                  <Text style={[styles.planPriceSub, { color: palette.muted }]}>
                    {stringResource(R.string.paywall_plan_annual_sub, english ? "en" : "ja")}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* 月額プラン */}
              <TouchableOpacity
                accessibilityRole="radio"
                accessibilityState={{ checked: selectedPlan === "monthly" }}
                activeOpacity={0.82}
                onPress={() => {
                  safeHaptic("light");
                  setSelectedPlan("monthly");
                }}
                style={[
                  styles.planCard,
                  {
                    backgroundColor: palette.surface,
                    borderColor: selectedPlan === "monthly" ? palette.primary : palette.border,
                    borderWidth: selectedPlan === "monthly" ? 2 : 1,
                  },
                ]}
              >
                <View style={styles.planHeaderRow}>
                  <View style={styles.planTitleCol}>
                    <Text style={[styles.planTitle, { color: palette.text }]}>
                      {stringResource(R.string.paywall_plan_monthly_title, english ? "en" : "ja")}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor: selectedPlan === "monthly" ? palette.primary : palette.border,
                        backgroundColor: selectedPlan === "monthly" ? palette.primary : "transparent",
                      },
                    ]}
                  >
                    {selectedPlan === "monthly" ? <MaterialIcons name="check" size={14} color="#FFFFFF" /> : null}
                  </View>
                </View>

                <View style={styles.planPriceRow}>
                  <Text style={[styles.planPrice, { color: palette.primary }]}>
                    {plusStatus.price || stringResource(R.string.paywall_plan_monthly_price, english ? "en" : "ja")}
                  </Text>
                  <Text style={[styles.planPriceSub, { color: palette.muted }]}>
                    {stringResource(R.string.paywall_plan_monthly_sub, english ? "en" : "ja")}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* メインアクションCTA */}
          {!isPlus ? (
            <View style={styles.ctaSection}>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={handlePurchase}
                disabled={isPurchasing}
                activeOpacity={0.85}
                style={[styles.ctaButton, { backgroundColor: palette.primary }]}
              >
                {isPurchasing ? (
                  <ActivityIndicator size="small" color={palette.isDark ? palette.background : "#FFFFFF"} />
                ) : (
                  <Text style={[styles.ctaButtonText, { color: palette.isDark ? palette.background : "#FFFFFF" }]}>
                    {selectedPlan === "annual"
                      ? stringResource(R.string.paywall_cta_trial, english ? "en" : "ja")
                      : stringResource(R.string.paywall_cta_start, english ? "en" : "ja")}
                  </Text>
                )}
              </TouchableOpacity>

              <Text style={[styles.cancelAnytimeNotice, { color: palette.muted }]}>
                {stringResource(R.string.paywall_cancel_anytime, english ? "en" : "ja")}
              </Text>
            </View>
          ) : (
            <View style={styles.ctaSection}>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => void managePlus()}
                style={[styles.ctaButton, { backgroundColor: palette.primary }]}
              >
                <Text style={[styles.ctaButtonText, { color: palette.isDark ? palette.background : "#FFFFFF" }]}>
                  {english ? "Manage Subscription" : "サブスクリプションを管理"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Google Play / 法的要件（フッター導線） */}
          <View style={styles.footerLinks}>
            {!isPlus ? (
              <>
                <TouchableOpacity onPress={handleRestore} disabled={isPurchasing}>
                  <Text style={[styles.footerLinkText, { color: palette.muted }]}>
                    {stringResource(R.string.paywall_restore, english ? "en" : "ja")}
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.footerDot, { color: palette.border }]}>·</Text>
              </>
            ) : null}

            <TouchableOpacity
              onPress={() => {
                handleClose();
                router.push("/terms" as never);
              }}
            >
              <Text style={[styles.footerLinkText, { color: palette.muted }]}>
                {stringResource(R.string.paywall_terms, english ? "en" : "ja")}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.footerDot, { color: palette.border }]}>·</Text>

            <TouchableOpacity
              onPress={() => {
                handleClose();
                router.push("/privacy" as never);
              }}
            >
              <Text style={[styles.footerLinkText, { color: palette.muted }]}>
                {stringResource(R.string.paywall_privacy, english ? "en" : "ja")}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 14 : 10,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  navTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  miniProBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  miniProBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  restoreTopButton: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  restoreTopText: {
    fontSize: 13,
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: 22,
    borderWidth: 1,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 20,
  },
  heroCircleA: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    top: -30,
    left: -20,
  },
  heroCircleB: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    bottom: -40,
    right: -30,
  },
  heroCrownContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  heroTagline: {
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 6,
    fontWeight: "600",
    paddingHorizontal: 10,
  },
  activeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 18,
  },
  activeCopy: {
    flex: 1,
  },
  activeTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  activeDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  valuesSection: {
    gap: 14,
    marginBottom: 24,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  valueIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  valueCopy: {
    flex: 1,
  },
  valueTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "800",
  },
  valueDesc: {
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 2,
  },
  plansContainer: {
    gap: 12,
    marginBottom: 20,
  },
  planCard: {
    borderRadius: 18,
    padding: 16,
  },
  planHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  planTitleCol: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  bestValueBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  bestValueBadgeText: {
    color: "#FFFFFF",
    fontSize: 10.5,
    fontWeight: "900",
  },
  planTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  planPriceRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  planPrice: {
    fontSize: 18,
    fontWeight: "900",
  },
  planPriceSub: {
    fontSize: 12,
    fontWeight: "600",
  },
  ctaSection: {
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  ctaButton: {
    width: "100%",
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  cancelAnytimeNotice: {
    fontSize: 11,
    textAlign: "center",
  },
  footerLinks: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 6,
  },
  footerLinkText: {
    fontSize: 11.5,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  footerDot: {
    fontSize: 12,
  },
});
