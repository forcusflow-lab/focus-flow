import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

import { ScaledText as Text } from "@/components/focus-flow/scaled-text";
import { COLORS, ScreenHeading } from "@/components/focus-flow/ui";
import { ScreenContainer } from "@/components/screen-container";

const DATA_ITEMS = [
  { icon: "storage" as const, title: "端末内に保存する情報", body: "Todo、習慣、メモ、日課ルール、表示設定は、この端末のアプリ保存領域に保管されます。" },
  { icon: "accessibility-new" as const, title: "アクセシビリティサービス", body: "選択したアプリが前面に開いたことだけを検知し、あなたが設定した集中ルールを適用します。画面の文字や入力内容は読み取りません。" },
  { icon: "cloud-off" as const, title: "端末外への送信", body: "現在のベータ版は、Todo本文・メモ本文・利用状況を端末外へ送信しません。広告SDKや行動追跡SDKも利用しません。" },
];

export default function PrivacyScreen() {
  const router = useRouter();
  return <ScreenContainer className="px-5" containerClassName="bg-background"><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <TouchableOpacity accessibilityRole="button" onPress={() => router.back()} style={styles.back}><MaterialIcons name="arrow-back" size={20} color={COLORS.forest} /><Text style={styles.backText}>管理へ戻る</Text></TouchableOpacity>
    <ScreenHeading eyebrow="Trust & Beta" title="プライバシーとベータ案内" />
    <View style={styles.hero}><MaterialIcons name="verified-user" size={25} color="#215B83" /><View style={styles.heroCopy}><Text style={styles.heroTitle}>あなたの集中を、あなたの端末で守る</Text><Text style={styles.heroText}>Focus Flowの制限機能は任意です。Androidの設定からいつでも無効にできます。</Text></View></View>
    <Text style={styles.section}>データの取り扱い</Text>
    {DATA_ITEMS.map((item) => <View key={item.title} style={styles.card}><View style={styles.icon}><MaterialIcons name={item.icon} size={20} color={COLORS.blue} /></View><View style={styles.copy}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.cardText}>{item.body}</Text></View></View>)}
    <Text style={styles.section}>クローズドベータについて</Text>
    <View style={styles.card}><View style={styles.icon}><MaterialIcons name="bug-report" size={20} color={COLORS.forest} /></View><View style={styles.copy}><Text style={styles.cardTitle}>不具合・改善案の共有</Text><Text style={styles.cardText}>Google Playのテスト用フィードバック、または案内されたベータ窓口から、端末名・Androidバージョン・再現手順を添えてお知らせください。解除できない状態や誤った制限は最優先で報告してください。</Text></View></View>
    <View style={styles.english}><Text style={styles.englishTitle}>English beta notice</Text><Text style={styles.englishText}>Focus Flow stores your tasks, notes, schedules, and display settings on your device. Its optional AccessibilityService only detects when a selected app comes to the foreground to apply your rule. It does not read screen text, messages, typed content, or screenshots, and it does not send your task or app activity data off-device in this beta.</Text></View>
  </ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { paddingTop: 14, paddingBottom: 38 }, back: { minHeight: 40, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 2 }, backText: { color: COLORS.forest, fontSize: 13, fontWeight: "800" }, hero: { flexDirection: "row", gap: 12, borderRadius: 20, padding: 16, backgroundColor: "#E9F3FA", borderWidth: 1, borderColor: "#B8D5E7", marginTop: 7 }, heroCopy: { flex: 1 }, heroTitle: { color: "#173B59", fontSize: 16, fontWeight: "800" }, heroText: { color: "#3C617A", fontSize: 12, lineHeight: 18, marginTop: 4 }, section: { color: COLORS.text, fontSize: 17, fontWeight: "800", marginTop: 25, marginBottom: 9 }, card: { flexDirection: "row", gap: 11, padding: 14, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, marginBottom: 9 }, icon: { width: 36, height: 36, alignItems: "center", justifyContent: "center", backgroundColor: "#EAF0F7", borderRadius: 12 }, copy: { flex: 1 }, cardTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800" }, cardText: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 4 }, english: { borderRadius: 18, backgroundColor: "#F0F5F3", padding: 15, marginTop: 4 }, englishTitle: { color: COLORS.forest, fontSize: 13, fontWeight: "800" }, englishText: { color: "#416A5D", fontSize: 11, lineHeight: 17, marginTop: 5 },
});
