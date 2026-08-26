import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Platform, Share, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

import { ScaledText as Text } from "@/components/focus-flow/scaled-text";
import { COLORS, useFocusPalette } from "@/components/focus-flow/ui";
import { ScreenContainer } from "@/components/screen-container";
import { getGateDiagnostics, type GateDiagnostics } from "@/lib/focus-flow/android-gate";
import { isEnglish } from "@/lib/focus-flow/i18n";
import { useFocusFlow } from "@/lib/focus-flow/provider";

type Faq = { question: string; answer: string };

const FAQS: Record<"ja" | "en", Record<"android" | "ios", Faq[]>> = {
  ja: {
    android: [
      { question: "集中ルールでは何ができますか？", answer: "集中ルールでは、選んだアプリを、必須Todoや必須習慣が完了するまで制限できます。設定画面で時間帯を決められます。" },
      { question: "選んだアプリが制限されないのはなぜですか？", answer: "集中ルールがオンか、現在が有効時間帯か、対象アプリが選ばれているか、アクセシビリティが有効かを確認してください。バッテリー設定によっては動作が不安定になる場合があります。" },
      { question: "集中ルールを止めるには？", answer: "「その他」から設定を開き、集中ルールをオフにしてください。Androidの設定でアクセシビリティを無効にすることもできます。" },
      { question: "なぜアクセシビリティが必要ですか？", answer: "選んだアプリが前面に開いたことを検知して集中ルールを適用するためです。画面の文字、メッセージ、入力内容、スクリーンショットは読み取りません。" },
      { question: "端末外に送信されるデータはありますか？", answer: "Todo、メモ、日課、アプリの利用状況は端末内に保管されます。Focus Flowは広告SDKや行動追跡SDKを使用しません。" },
      { question: "時間管理の項目を早く完了したい場合は？", answer: "分を目標にしたTodo・習慣は、計測を開始して設定時間が経過すると完了します。時間前に完了する場合は、対象項目の画面からストアが表示する1回限りの早期完了を利用できます。集中ルールを止める場合は、設定からオフにしてください。" },
      { question: "不具合を報告するには？", answer: "下のテンプレートを共有してください。端末と権限の情報だけを含め、Todoやメモの内容は送らないでください。" },
    ],
    ios: [
      { question: "iPhoneでは何が使えますか？", answer: "Todo、習慣、メモ、日課、進捗の振り返り、セットアップガイドを使えます。計画データは端末内に保管されます。" },
      { question: "なぜアプリ制限を使えないのですか？", answer: "このiPhoneビルドは他のアプリを制限しません。iPhoneでのアプリ制限にはAppleのScreen Time認可と専用実装が必要です。将来追加する場合は、事前に権限の目的を明確に説明します。" },
      { question: "アクセシビリティを有効にする必要はありますか？", answer: "ありません。iPhoneではAndroidのアクセシビリティを使用しません。Focus Flowの基本的な計画機能は端末権限なしで使えます。" },
      { question: "端末外に送信されるデータはありますか？", answer: "Todo、メモ、日課、アプリの利用状況は端末内に保管されます。Focus Flowは広告SDKや行動追跡SDKを使用しません。" },
      { question: "不具合を報告するには？", answer: "下のテンプレートを共有してください。端末情報だけを含め、Todoやメモの内容は送らないでください。" },
    ],
  },
  en: {
    android: [
      { question: "What do App limits do?", answer: "App limits keep the apps you choose locked until you complete your must-do tasks and habits. You decide when limits apply by setting schedules in Settings." },
      { question: "Why isn't an app being locked?", answer: "Check that App limits are on, the current time is inside an active schedule, the app is selected in that schedule, and Accessibility is enabled. Battery settings can also prevent Android from running limits reliably." },
      { question: "How do I turn off App limits?", answer: "Open More, then Settings. You can turn off App limits at any time. You can also disable Accessibility in Android settings." },
      { question: "Why does Focus Flow need Accessibility?", answer: "Accessibility lets Focus Flow detect when a selected app opens so it can apply your App limits. It does not read screen text, messages, typed content, or screenshots." },
      { question: "What data leaves my device?", answer: "Your tasks, notes, routines, and app activity stay on your device. Focus Flow does not use advertising or behavioral-tracking SDKs." },
      { question: "What if I need to finish a timed item early?", answer: "Tasks and habits measured in minutes complete after you start their timer and the scheduled time passes. To finish sooner, use the one-time early completion shown by your store from that item. To stop App limits, turn them off in Settings." },
      { question: "How can I report a problem?", answer: "Use the template below. It includes non-sensitive device and permission details to help reproduce the issue. Do not include task or note content." },
    ],
    ios: [
      { question: "What works on iPhone?", answer: "Tasks, habits, notes, routines, progress tracking, and the setup guide work on iPhone. Your planning data stays on your device." },
      { question: "Why are App limits unavailable?", answer: "This iPhone build does not lock other apps. iPhone app limits require Apple's Screen Time authorization and a separate iPhone implementation. Focus Flow will clearly explain any future permission before asking for it." },
      { question: "Do I need to enable Accessibility?", answer: "No. Android Accessibility is not used on iPhone, and you do not need to change any device permission to use Focus Flow's core planning features." },
      { question: "What data leaves my device?", answer: "Your tasks, notes, routines, and app activity stay on your device. Focus Flow does not use advertising or behavioral-tracking SDKs." },
      { question: "How can I report a problem?", answer: "Use the template below. It includes non-sensitive device details to help reproduce an issue. Do not include task or note content." },
    ],
  },
};

function status(value: boolean | null | undefined, english: boolean) {
  if (value === null || value === undefined) return english ? "Unknown" : "未確認";
  return value ? (english ? "Yes" : "はい") : (english ? "No" : "いいえ");
}

export default function SupportScreen() {
  const router = useRouter();
  const { displaySettings } = useFocusFlow();
  const palette = useFocusPalette();
  const [openQuestion, setOpenQuestion] = useState<number | null>(0);
  const [diagnostics, setDiagnostics] = useState<GateDiagnostics | undefined>();
  const [loading, setLoading] = useState(true);
  const isAndroid = Platform.OS === "android";
  const english = isEnglish(displaySettings);
  const t = useCallback((ja: string, en: string) => english ? en : ja, [english]);
  const faqs = FAQS[english ? "en" : "ja"][isAndroid ? "android" : "ios"];

  const loadDiagnostics = useCallback(async () => {
    setLoading(true);
    try {
      setDiagnostics(isAndroid ? await getGateDiagnostics() : undefined);
    } finally {
      setLoading(false);
    }
  }, [isAndroid]);

  useEffect(() => { void loadDiagnostics(); }, [loadDiagnostics]);

  const report = useMemo(() => {
    const device = diagnostics ? `${diagnostics.manufacturer} ${diagnostics.model}` : t("利用できません", "Not available");
    const os = diagnostics ? `Android API ${diagnostics.apiLevel}` : isAndroid ? `Android ${String(Platform.Version)}` : `iOS ${String(Platform.Version)}`;
    const platformDetails = isAndroid
      ? [
          `- ${t("アクセシビリティ有効", "Accessibility enabled")}: ${status(diagnostics?.accessibilityEnabled, english)}`,
          `- ${t("バッテリー最適化の対象外", "Battery optimization ignored")}: ${status(diagnostics?.batteryOptimizationIgnored, english)}`,
          `- ${t("バックグラウンド実行の制限", "Background restricted")}: ${status(diagnostics?.backgroundRestricted, english)}`,
        ]
      : [t("- Androidのアクセシビリティ: iPhoneでは使用しません", "- Android Accessibility: Not used on iPhone"), t("- アプリ制限: このiPhoneビルドでは利用できません", "- App limits: Not available in this iPhone build")];
    return english
      ? ["Focus Flow support report", "", "What happened?", "[Describe what you saw]", "", "What did you expect to happen?", "[Describe the expected result]", "", "Steps to reproduce", "1. [First step]", "2. [Next step]", "3. [What happened]", "", "Device details", `- Device: ${device}`, `- OS: ${os}`, ...platformDetails, "", "Optional", "- Screenshot or screen recording: [Attach if it does not show private task or note content]", "- Anything else that may help us reproduce it:"].join("\n")
      : ["Focus Flow サポートレポート", "", "起きたこと", "[表示された内容を記入]", "", "期待していたこと", "[期待した動作を記入]", "", "再現手順", "1. [最初の操作]", "2. [次の操作]", "3. [起きたこと]", "", "端末情報", `- 端末: ${device}`, `- OS: ${os}`, ...platformDetails, "", "任意", "- スクリーンショットまたは画面録画: [Todo・メモ等の私的な内容が写らない場合のみ添付]", "- 再現に役立つその他の情報:"].join("\n");
  }, [diagnostics, english, isAndroid, t]);

  const shareReport = async () => {
    await Share.share({ title: t("Focus Flow サポートレポート", "Focus Flow support report"), message: report });
  };

  return (
    <ScreenContainer className="px-5" containerClassName="bg-background">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={t("その他へ戻る", "Back to More")} onPress={() => router.back()} style={styles.back}>
          <MaterialIcons name="arrow-back" size={20} color={palette.primary} />
          <Text style={styles.backText}>{t("その他へ戻る", "Back to More")}</Text>
        </TouchableOpacity>
        <Text style={styles.eyebrow}>{t("サポート", "SUPPORT")}</Text>
        <Text style={styles.title}>{t("よくある質問・不具合報告", "FAQ & bug reports")}</Text>
        <Text style={styles.intro}>{isAndroid ? t("よくある質問を確認し、うまく動かない場合は必要な情報だけを含むレポートを共有してください。", "Find quick answers, then send a clear report if something does not work as expected.") : t("このiPhoneビルドについてよくある質問を確認し、必要な情報だけを含むレポートを共有してください。", "Find quick answers for this iPhone build, then send a clear report if something does not work as expected.")}</Text>
        <Text style={styles.sectionTitle}>{t("よくある質問", "Frequently asked questions")}</Text>
        <View style={[styles.faqGroup, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
          {faqs.map((faq, index) => {
            const open = openQuestion === index;
            return (
              <View key={faq.question} style={[styles.faqItem, { borderBottomColor: palette.border }, open && { backgroundColor: palette.elevated }]}>
                <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpenQuestion(open ? null : index)} style={styles.faqButton}>
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <MaterialIcons name={open ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={22} color={palette.primary} />
                </TouchableOpacity>
                {open ? <Text style={styles.faqAnswer}>{faq.answer}</Text> : null}
              </View>
            );
          })}
        </View>
        <View style={styles.reportHeader}>
          <View style={[styles.reportIcon, { backgroundColor: palette.elevated }]}><MaterialIcons name="bug-report" size={21} color={palette.primary} /></View>
          <View style={styles.reportCopy}>
            <Text style={styles.sectionTitle}>{t("不具合を報告する", "Report a problem")}</Text>
            <Text style={styles.reportIntro}>{isAndroid ? t("このテンプレートには端末と集中ルールの情報だけを追加します。Todoやメモの内容は含めません。", "This template adds device and App limits details without including your tasks or notes.") : t("このテンプレートにはiPhoneの端末情報だけを追加します。Todoやメモの内容は含めません。", "This template adds iPhone device details without including your tasks or notes.")}</Text>
          </View>
        </View>
        <TouchableOpacity accessibilityRole="button" onPress={() => void loadDiagnostics()} style={[styles.refreshButton, { backgroundColor: palette.primarySoft }]}>
          <MaterialIcons name="refresh" size={18} color={palette.primary} />
          <Text style={styles.refreshText}>{loading ? t("端末情報を確認しています…", "Checking device info…") : isAndroid ? t("端末情報を再確認", "Refresh device info") : t("iPhone情報を再確認", "Refresh iPhone info")}</Text>
          {loading ? <ActivityIndicator size="small" color={palette.primary} /> : null}
        </TouchableOpacity>
        <Text style={styles.templateLabel}>{t("このテンプレートをコピーまたは共有", "Copy or share this template")}</Text>
        <TextInput value={report} editable={false} selectTextOnFocus multiline style={[styles.template, { borderColor: palette.border, backgroundColor: palette.surface, color: palette.text }]} accessibilityLabel={t("不具合報告テンプレート", "Bug report template")} />
        <TouchableOpacity accessibilityRole="button" onPress={() => void shareReport()} style={[styles.shareButton, { backgroundColor: palette.primary }]}>
          <MaterialIcons name="ios-share" size={19} color={COLORS.white} />
          <Text style={styles.shareText}>{t("レポートを共有", "Share report")}</Text>
        </TouchableOpacity>
        <Text style={styles.privacyNote}>{t("共有する前に、私的な情報を削除してください。Todo名、メモ本文、個人情報を含むスクリーンショットは送らないでください。", "Before you share, remove anything private. Do not include task titles, note content, or screenshots containing sensitive information.")}</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 14, paddingBottom: 42 },
  back: { minHeight: 40, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 2 },
  backText: { color: COLORS.forest, fontSize: 13, fontWeight: "800" },
  eyebrow: { color: COLORS.forest, fontSize: 12, letterSpacing: 0.7, fontWeight: "900", marginTop: 9 },
  title: { color: COLORS.text, fontSize: 28, lineHeight: 34, letterSpacing: -0.5, fontWeight: "900", marginTop: 2 },
  intro: { color: COLORS.muted, fontSize: 14, lineHeight: 21, marginTop: 7, maxWidth: 540 },
  sectionTitle: { color: COLORS.text, fontSize: 18, lineHeight: 24, fontWeight: "900", marginTop: 26 },
  faqGroup: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, overflow: "hidden", backgroundColor: COLORS.white, marginTop: 10 },
  faqItem: { borderBottomWidth: 1, borderBottomColor: "#E5ECE8" },
  faqOpen: { backgroundColor: "#F0F7F4" },
  faqButton: { minHeight: 57, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 10 },
  faqQuestion: { flex: 1, color: COLORS.text, fontSize: 14, lineHeight: 20, fontWeight: "800" },
  faqAnswer: { color: "#46645B", fontSize: 13, lineHeight: 20, paddingHorizontal: 14, paddingBottom: 15 },
  reportHeader: { flexDirection: "row", gap: 11, marginTop: 30 },
  reportIcon: { width: 39, height: 39, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: "#E8F0FB" },
  reportCopy: { flex: 1 },
  reportIntro: { color: COLORS.muted, fontSize: 13, lineHeight: 19, marginTop: 3 },
  refreshButton: { minHeight: 45, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 13, backgroundColor: "#EAF5F1", marginTop: 14, paddingHorizontal: 12 },
  refreshText: { color: COLORS.forest, fontSize: 13, fontWeight: "800" },
  templateLabel: { color: COLORS.text, fontSize: 13, fontWeight: "800", marginTop: 17, marginBottom: 7 },
  template: { minHeight: 278, borderRadius: 15, borderWidth: 1, borderColor: "#CADAD4", backgroundColor: COLORS.white, color: COLORS.text, fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 12, lineHeight: 18, padding: 13, textAlignVertical: "top" },
  shareButton: { minHeight: 51, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 15, backgroundColor: COLORS.forest, marginTop: 12 },
  shareText: { color: COLORS.white, fontSize: 15, fontWeight: "900" },
  privacyNote: { color: COLORS.muted, fontSize: 11, lineHeight: 16, marginTop: 10, textAlign: "center" },
});
