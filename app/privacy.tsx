import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useState } from "react";

import { ScaledText as Text } from "@/components/focus-flow/scaled-text";
import { COLORS, ScreenHeading } from "@/components/focus-flow/ui";
import { ScreenContainer } from "@/components/screen-container";
import { isEnglish } from "@/lib/focus-flow/i18n";
import { useFocusFlow } from "@/lib/focus-flow/provider";

const JAPANESE_DATA_ITEMS = [
  { icon: "storage" as const, title: "端末内に保存する情報", body: "Todo、習慣、メモ、日課ルール、表示設定は、この端末のアプリ保存領域に保管されます。" },
  { icon: "accessibility-new" as const, title: "アクセシビリティサービス", body: "選択したアプリが前面に開いたことだけを検知し、あなたが設定した集中ルールを適用します。画面の文字や入力内容は読み取りません。" },
  { icon: "cloud-off" as const, title: "端末外への送信", body: "Todo本文・メモ本文・利用状況を端末外へ送信しません。広告SDKや行動追跡SDKも利用しません。" },
];

const ENGLISH_DATA_ITEMS = [
  { icon: "storage" as const, title: "Information stored on your device", body: "Your To-dos, habits, notes, routine rules, and display settings stay in the app storage on this device." },
  { icon: "accessibility-new" as const, title: "AccessibilityService", body: "Focus Flow only detects when a selected app comes to the foreground to apply the rule you set. It does not read screen text or typed content." },
  { icon: "cloud-off" as const, title: "Off-device transfer", body: "Focus Flow does not send your To-dos, notes, or app activity off your device. It does not use advertising or behavioral-tracking SDKs." },
];

export default function PrivacyScreen() {
  const router = useRouter();
  const { displaySettings, clearAllData } = useFocusFlow();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const english = isEnglish(displaySettings);
  const dataItems = english ? ENGLISH_DATA_ITEMS : JAPANESE_DATA_ITEMS;
  const deleteAllData = () => { clearAllData(); setDeleteDialogOpen(false); router.replace("/(tabs)" as never); };
  return <ScreenContainer className="px-5" containerClassName="bg-background"><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Modal visible={deleteDialogOpen} transparent animationType="fade" onRequestClose={() => setDeleteDialogOpen(false)}><View style={styles.modalBackdrop}><View style={styles.modalCard}><View style={styles.modalIcon}><MaterialIcons name="delete-forever" size={23} color={COLORS.error} /></View><Text style={styles.modalTitle}>{english ? "Delete all Focus Flow data?" : "Focus Flowのデータをすべて削除しますか？"}</Text><Text style={styles.modalText}>{english ? "This permanently removes your To-dos, habits, notes, routines, progress, and display settings from this device. App limits will be turned off. This cannot be undone." : "この端末のTodo、習慣、メモ、日課、進捗、表示設定を完全に削除し、アプリ制限もオフにします。この操作は取り消せません。"}</Text><TouchableOpacity accessibilityRole="button" onPress={deleteAllData} style={styles.deleteConfirm}><Text style={styles.deleteConfirmText}>{english ? "Delete everything" : "すべて削除する"}</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" onPress={() => setDeleteDialogOpen(false)} style={styles.cancelButton}><Text style={styles.cancelText}>{english ? "Cancel" : "キャンセル"}</Text></TouchableOpacity></View></View></Modal>
    <TouchableOpacity accessibilityRole="button" onPress={() => router.back()} style={styles.back}><MaterialIcons name="arrow-back" size={20} color={COLORS.forest} /><Text style={styles.backText}>{english ? "Back to Manage" : "管理へ戻る"}</Text></TouchableOpacity>
    <ScreenHeading eyebrow={english ? "Trust & data" : "信頼とデータ"} title={english ? "Privacy & data" : "プライバシーとデータ"} />
    <View style={styles.hero}><MaterialIcons name="verified-user" size={25} color="#215B83" /><View style={styles.heroCopy}><Text style={styles.heroTitle}>{english ? "Protect your focus on your device" : "あなたの集中を、あなたの端末で守る"}</Text><Text style={styles.heroText}>{english ? "Focus Flow's app-limit feature is optional and can be turned off anytime in Android settings." : "Focus Flowの制限機能は任意です。Androidの設定からいつでも無効にできます。"}</Text></View></View>
    <Text style={styles.section}>{english ? "How your data is handled" : "データの取り扱い"}</Text>
    {dataItems.map((item) => <View key={item.title} style={styles.card}><View style={styles.icon}><MaterialIcons name={item.icon} size={20} color={COLORS.blue} /></View><View style={styles.copy}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.cardText}>{item.body}</Text></View></View>)}
    <Text style={styles.section}>{english ? "Your controls" : "あなたが管理できること"}</Text>
    <TouchableOpacity accessibilityRole="button" onPress={() => setDeleteDialogOpen(true)} activeOpacity={0.76} style={[styles.card, styles.deleteCard]}><View style={[styles.icon, styles.deleteIcon]}><MaterialIcons name="delete-outline" size={20} color={COLORS.error} /></View><View style={styles.copy}><Text style={styles.cardTitle}>{english ? "Delete all data from this device" : "この端末のデータをすべて削除"}</Text><Text style={styles.cardText}>{english ? "Permanently remove planning data and turn off App limits. This cannot be undone." : "計画データを完全に削除し、アプリ制限をオフにします。元に戻せません。"}</Text></View><MaterialIcons name="chevron-right" size={22} color={COLORS.error} /></TouchableOpacity>
    <Text style={styles.section}>{english ? "Help and feedback" : "ヘルプとフィードバック"}</Text>
    <TouchableOpacity accessibilityRole="button" onPress={() => router.push("/support" as never)} activeOpacity={0.76} style={styles.card}><View style={styles.icon}><MaterialIcons name="bug-report" size={20} color={COLORS.forest} /></View><View style={styles.copy}><Text style={styles.cardTitle}>{english ? "Share a bug or improvement" : "不具合・改善案の共有"}</Text><Text style={styles.cardText}>{english ? "Open FAQ & support for a copyable report template with device and permission details. Report an incorrect restriction or a state you cannot exit as soon as possible." : "FAQ・サポートから、端末と権限情報を含むコピー用テンプレートを開けます。解除できない状態や誤った制限は最優先で報告してください。"}</Text></View><MaterialIcons name="chevron-right" size={22} color={COLORS.muted} /></TouchableOpacity>
    <View style={styles.english}><Text style={styles.englishTitle}>{english ? "Accessibility notice" : "アクセシビリティに関する案内"}</Text><Text style={styles.englishText}>{english ? "Focus Flow's optional AccessibilityService only detects when a selected app comes to the foreground to apply your rule. It does not read screen text, messages, typed content, or screenshots, and it does not send your task or app activity data off-device." : "Focus Flowは、Todo、メモ、日課、表示設定をこの端末に保存します。任意のAccessibilityServiceは、選択したアプリが前面に開いたことだけを検知して設定したルールを適用します。画面の文字、メッセージ、入力内容、スクリーンショットは読み取らず、Todoやアプリ利用状況を端末外へ送信しません。"}</Text></View>
  </ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { paddingTop: 14, paddingBottom: 38 }, back: { minHeight: 40, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 2 }, backText: { color: COLORS.forest, fontSize: 13, fontWeight: "800" }, hero: { flexDirection: "row", gap: 12, borderRadius: 20, padding: 16, backgroundColor: "#E9F3FA", borderWidth: 1, borderColor: "#B8D5E7", marginTop: 7 }, heroCopy: { flex: 1 }, heroTitle: { color: "#173B59", fontSize: 16, fontWeight: "800" }, heroText: { color: "#3C617A", fontSize: 12, lineHeight: 18, marginTop: 4 }, section: { color: COLORS.text, fontSize: 17, fontWeight: "800", marginTop: 25, marginBottom: 9 }, card: { flexDirection: "row", gap: 11, padding: 14, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, marginBottom: 9 }, deleteCard: { borderColor: "#F1C8C8", backgroundColor: "#FFF8F8" }, icon: { width: 36, height: 36, alignItems: "center", justifyContent: "center", backgroundColor: "#EAF0F7", borderRadius: 12 }, deleteIcon: { backgroundColor: "#FDEBEC" }, copy: { flex: 1 }, cardTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800" }, cardText: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 4 }, english: { borderRadius: 18, backgroundColor: "#F0F5F3", padding: 15, marginTop: 4 }, englishTitle: { color: COLORS.forest, fontSize: 13, fontWeight: "800" }, englishText: { color: "#416A5D", fontSize: 11, lineHeight: 17, marginTop: 5 }, modalBackdrop: { flex: 1, justifyContent: "center", paddingHorizontal: 20, backgroundColor: "rgba(16, 34, 42, 0.55)" }, modalCard: { backgroundColor: COLORS.white, borderRadius: 24, padding: 20 }, modalIcon: { width: 46, height: 46, alignItems: "center", justifyContent: "center", borderRadius: 15, backgroundColor: "#FDEBEC" }, modalTitle: { color: COLORS.text, fontSize: 20, lineHeight: 27, fontWeight: "800", marginTop: 14 }, modalText: { color: COLORS.muted, fontSize: 13, lineHeight: 20, marginTop: 9 }, deleteConfirm: { minHeight: 49, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: COLORS.error, marginTop: 18 }, deleteConfirmText: { color: COLORS.white, fontSize: 14, fontWeight: "800" }, cancelButton: { minHeight: 44, alignItems: "center", justifyContent: "center", marginTop: 4 }, cancelText: { color: COLORS.muted, fontSize: 13, fontWeight: "800" },
});
