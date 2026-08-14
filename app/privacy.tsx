import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

import { ScaledText as Text } from "@/components/focus-flow/scaled-text";
import { COLORS, ScreenHeading } from "@/components/focus-flow/ui";
import { ScreenContainer } from "@/components/screen-container";
import { isEnglish } from "@/lib/focus-flow/i18n";
import { useFocusFlow } from "@/lib/focus-flow/provider";

const JAPANESE_DATA_ITEMS = [
  { icon: "storage" as const, title: "端末内に保存する情報", body: "Todo、習慣、メモ、日課ルール、表示設定は、この端末のアプリ保存領域に保管されます。" },
  { icon: "accessibility-new" as const, title: "アクセシビリティサービス", body: "選択したアプリが前面に開いたことだけを検知し、あなたが設定した集中ルールを適用します。画面の文字や入力内容は読み取りません。" },
  { icon: "cloud-off" as const, title: "端末外への送信", body: "現在のベータ版は、Todo本文・メモ本文・利用状況を端末外へ送信しません。広告SDKや行動追跡SDKも利用しません。" },
];

const ENGLISH_DATA_ITEMS = [
  { icon: "storage" as const, title: "Information stored on your device", body: "Your To-dos, habits, notes, routine rules, and display settings stay in the app storage on this device." },
  { icon: "accessibility-new" as const, title: "AccessibilityService", body: "Focus Flow only detects when a selected app comes to the foreground to apply the rule you set. It does not read screen text or typed content." },
  { icon: "cloud-off" as const, title: "Off-device transfer", body: "This beta does not send your To-dos, notes, or app activity off your device. It does not use advertising or behavioral-tracking SDKs." },
];

export default function PrivacyScreen() {
  const router = useRouter();
  const { displaySettings } = useFocusFlow();
  const english = isEnglish(displaySettings);
  const dataItems = english ? ENGLISH_DATA_ITEMS : JAPANESE_DATA_ITEMS;
  return <ScreenContainer className="px-5" containerClassName="bg-background"><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <TouchableOpacity accessibilityRole="button" onPress={() => router.back()} style={styles.back}><MaterialIcons name="arrow-back" size={20} color={COLORS.forest} /><Text style={styles.backText}>{english ? "Back to Manage" : "管理へ戻る"}</Text></TouchableOpacity>
    <ScreenHeading eyebrow={english ? "Trust & beta" : "Trust & Beta"} title={english ? "Privacy & beta" : "プライバシーとベータ案内"} />
    <View style={styles.hero}><MaterialIcons name="verified-user" size={25} color="#215B83" /><View style={styles.heroCopy}><Text style={styles.heroTitle}>{english ? "Protect your focus on your device" : "あなたの集中を、あなたの端末で守る"}</Text><Text style={styles.heroText}>{english ? "Focus Flow's app-limit feature is optional and can be turned off anytime in Android settings." : "Focus Flowの制限機能は任意です。Androidの設定からいつでも無効にできます。"}</Text></View></View>
    <Text style={styles.section}>{english ? "How your data is handled" : "データの取り扱い"}</Text>
    {dataItems.map((item) => <View key={item.title} style={styles.card}><View style={styles.icon}><MaterialIcons name={item.icon} size={20} color={COLORS.blue} /></View><View style={styles.copy}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.cardText}>{item.body}</Text></View></View>)}
    <Text style={styles.section}>{english ? "About the closed beta" : "クローズドベータについて"}</Text>
    <TouchableOpacity accessibilityRole="button" onPress={() => router.push("/support" as never)} activeOpacity={0.76} style={styles.card}><View style={styles.icon}><MaterialIcons name="bug-report" size={20} color={COLORS.forest} /></View><View style={styles.copy}><Text style={styles.cardTitle}>{english ? "Share a bug or improvement" : "不具合・改善案の共有"}</Text><Text style={styles.cardText}>{english ? "Open FAQ & support for a copyable report template with device and permission details. Report an incorrect restriction or a state you cannot exit as soon as possible." : "FAQ・サポートから、端末と権限情報を含むコピー用テンプレートを開けます。解除できない状態や誤った制限は最優先で報告してください。"}</Text></View><MaterialIcons name="chevron-right" size={22} color={COLORS.muted} /></TouchableOpacity>
    <View style={styles.english}><Text style={styles.englishTitle}>{english ? "Accessibility notice" : "English beta notice"}</Text><Text style={styles.englishText}>{english ? "Focus Flow's optional AccessibilityService only detects when a selected app comes to the foreground to apply your rule. It does not read screen text, messages, typed content, or screenshots, and it does not send your task or app activity data off-device in this beta." : "Focus Flow stores your tasks, notes, schedules, and display settings on your device. Its optional AccessibilityService only detects when a selected app comes to the foreground to apply your rule. It does not read screen text, messages, typed content, or screenshots, and it does not send your task or app activity data off-device in this beta."}</Text></View>
  </ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { paddingTop: 14, paddingBottom: 38 }, back: { minHeight: 40, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 2 }, backText: { color: COLORS.forest, fontSize: 13, fontWeight: "800" }, hero: { flexDirection: "row", gap: 12, borderRadius: 20, padding: 16, backgroundColor: "#E9F3FA", borderWidth: 1, borderColor: "#B8D5E7", marginTop: 7 }, heroCopy: { flex: 1 }, heroTitle: { color: "#173B59", fontSize: 16, fontWeight: "800" }, heroText: { color: "#3C617A", fontSize: 12, lineHeight: 18, marginTop: 4 }, section: { color: COLORS.text, fontSize: 17, fontWeight: "800", marginTop: 25, marginBottom: 9 }, card: { flexDirection: "row", gap: 11, padding: 14, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, marginBottom: 9 }, icon: { width: 36, height: 36, alignItems: "center", justifyContent: "center", backgroundColor: "#EAF0F7", borderRadius: 12 }, copy: { flex: 1 }, cardTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800" }, cardText: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 4 }, english: { borderRadius: 18, backgroundColor: "#F0F5F3", padding: 15, marginTop: 4 }, englishTitle: { color: COLORS.forest, fontSize: 13, fontWeight: "800" }, englishText: { color: "#416A5D", fontSize: 11, lineHeight: 17, marginTop: 5 },
});
