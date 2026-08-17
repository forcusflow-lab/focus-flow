import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

import { ScaledText as Text } from "@/components/focus-flow/scaled-text";
import { COLORS } from "@/components/focus-flow/ui";
import { ScreenContainer } from "@/components/screen-container";
import { isEnglish } from "@/lib/focus-flow/i18n";
import { useFocusFlow } from "@/lib/focus-flow/provider";

export default function LegalScreen() {
  const router = useRouter();
  const { displaySettings } = useFocusFlow();
  const english = isEnglish(displaySettings);
  const t = (ja: string, en: string) => english ? en : ja;
  const sections = [
    { title: t("基本機能", "Core features"), body: t("Todo、習慣、メモ、日課、リマインダー、言語、配色、外観モード、文字サイズ、ウィジェットの見た目は無料です。基本的な計画機能、アクセシビリティ、個人設定を課金で制限しません。", "Tasks, habits, notes, routines, reminders, language, color, appearance mode, text size, and widget styling are free. Core planning, accessibility, and personal settings are never paywalled.") },
    { title: t("Focus Flow Plus", "Focus Flow Plus"), body: t("Plusは、現在の配色・文字・ウィジェット設定を名前付きテーマセットとして保存・呼び出すための任意の定期購入です。購入前に、ストアが価格、請求期間、更新条件を表示します。", "Plus is an optional subscription that lets you save and reuse named theme sets containing your color, type, and widget choices. Your store shows the price, billing period, and renewal terms before purchase.") },
    { title: t("復元・管理・解約", "Restore, manage, and cancel"), body: t("同じストアアカウントで購入済みの場合は、設定画面の「購入を復元」を使えます。解約、支払い方法、返金の申請、請求上の問題は、設定画面の「サブスクリプションを管理」から各ストアの管理画面で行います。解約後も、現在の請求期間が終わるまではPlusを使えます。", "If you previously bought Plus with the same store account, use Restore purchases in Settings. Use Manage subscription to reach your store's controls for cancellation, payment methods, refund requests, and billing issues. After cancelling, Plus remains available until the end of the current billing period.") },
    { title: t("データと端末", "Data and devices"), body: t("Focus FlowのTodo、習慣、メモ、日課、表示設定は端末内に保存されます。Plusはストアの購入状態を確認するために使われますが、計画データを端末外へ送信しません。データの扱いと端末内データの削除は「プライバシーとデータ」で確認できます。", "Focus Flow stores tasks, habits, notes, routines, and display settings on your device. Plus checks your store purchase status but does not send planning data off your device. Review data handling and delete on-device data in Privacy & data.") },
    { title: t("大切なお知らせ", "Important notice"), body: t("Focus Flowは、目標管理と集中を支援する一般的なツールです。医療、緊急対応、診断のためのサービスではありません。Androidのアプリ制限は任意で、Androidの設定からいつでも無効にできます。", "Focus Flow is a general planning and focus tool. It is not a medical, emergency, or diagnostic service. Android App limits are optional and can be disabled at any time in Android settings.") },
  ];
  return <ScreenContainer className="px-5" containerClassName="bg-background"><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><TouchableOpacity accessibilityRole="button" accessibilityLabel={t("管理へ戻る", "Back to Manage")} onPress={() => router.back()} style={styles.back}><MaterialIcons name="arrow-back" size={20} color={COLORS.forest} /><Text style={styles.backText}>{t("管理へ戻る", "Back to Manage")}</Text></TouchableOpacity><Text style={styles.eyebrow}>{t("透明性", "TRANSPARENCY")}</Text><Text style={styles.title}>{t("利用条件とサブスクリプション", "Terms & subscriptions")}</Text><Text style={styles.intro}>{t("購入前に、無料で使える範囲とPlusの対象を確認できます。", "Review what stays free and what Plus includes before you buy.")}</Text>{sections.map((section) => <View key={section.title} style={styles.card}><Text style={styles.cardTitle}>{section.title}</Text><Text style={styles.cardBody}>{section.body}</Text></View>)}</ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { paddingTop: 14, paddingBottom: 44 }, back: { minHeight: 40, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 2 }, backText: { color: COLORS.forest, fontSize: 13, fontWeight: "800" }, eyebrow: { color: COLORS.forest, fontSize: 12, letterSpacing: 0.7, fontWeight: "900", marginTop: 9 }, title: { color: COLORS.text, fontSize: 28, lineHeight: 34, letterSpacing: -0.5, fontWeight: "900", marginTop: 2 }, intro: { color: COLORS.muted, fontSize: 14, lineHeight: 21, marginTop: 7, marginBottom: 8 }, card: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, padding: 16, marginTop: 12 }, cardTitle: { color: COLORS.text, fontSize: 16, lineHeight: 22, fontWeight: "900" }, cardBody: { color: "#46645B", fontSize: 14, lineHeight: 21, marginTop: 7 } });
