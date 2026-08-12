import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Platform, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";

import { ScaledText } from "@/components/focus-flow/scaled-text";
import { COLORS, LoadingScreen, ScreenHeading } from "@/components/focus-flow/ui";
import { ScreenContainer } from "@/components/screen-container";
import { getAccessibilityStatus, getLaunchableApps, isNativeGateAvailable, openAccessibilitySettings, type LaunchableApp } from "@/lib/focus-flow/android-gate";
import { useFocusFlow } from "@/lib/focus-flow/provider";
import type { DisplaySettings } from "@/lib/focus-flow/types";
import { getGateSummary } from "@/lib/focus-flow/utils";

const opacityMap = { solid: 1, soft: 0.84, glass: 0.67 } as const;

export default function SettingsScreen() {
  const { todos, habits, focusSessions, gateConfig, displaySettings, isReady, setGateConfig, setDisplaySettings } = useFocusFlow();
  const [apps, setApps] = useState<LaunchableApp[]>([]);
  const [nativeReady, setNativeReady] = useState(false);
  const [accessibilityEnabled, setAccessibilityEnabled] = useState(false);
  const [loadingApps, setLoadingApps] = useState(false);
  const summary = useMemo(() => getGateSummary({ todos, habits, focusSessions, gateConfig, displaySettings }), [todos, habits, focusSessions, gateConfig, displaySettings]);

  useEffect(() => {
    const load = async () => {
      const available = Platform.OS === "android" && isNativeGateAvailable();
      setNativeReady(available);
      if (!available) return;
      setLoadingApps(true);
      const [status, installed] = await Promise.all([getAccessibilityStatus(), getLaunchableApps()]);
      setAccessibilityEnabled(status);
      setApps(installed);
      setLoadingApps(false);
    };
    void load();
  }, []);

  if (!isReady) return <ScreenContainer><LoadingScreen /></ScreenContainer>;

  const selectedTodo = (id: string) => setGateConfig({ requiredTodoIds: toggleId(gateConfig.requiredTodoIds, id) });
  const selectedHabit = (id: string) => setGateConfig({ requiredHabitIds: toggleId(gateConfig.requiredHabitIds, id) });
  const selectedApp = (packageName: string) => setGateConfig({ blockedPackages: toggleId(gateConfig.blockedPackages, packageName) });
  const refreshAccessibility = async () => setAccessibilityEnabled(await getAccessibilityStatus());

  return (
    <ScreenContainer className="px-5" containerClassName="bg-background">
      <FlatList
        data={[]}
        renderItem={() => null}
        keyExtractor={() => "settings"}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <ScreenHeading eyebrow="自分に合わせる" title="設定" />

            <SectionLabel title="集中ルール" />
            <View style={styles.card}>
              <View style={styles.row}><View style={styles.rowCopy}><Text style={styles.rowTitle}>必須項目を終えるまで制限</Text><Text style={styles.rowDescription}>{gateConfig.enabled ? summary.message : "集中ルールはオフです"}</Text></View><Switch value={gateConfig.enabled} onValueChange={(enabled) => setGateConfig({ enabled })} trackColor={{ false: "#CCD7D1", true: "#91C3B3" }} thumbColor={gateConfig.enabled ? COLORS.forest : "#F7F8F5"} /></View>
              <View style={[styles.status, gateConfig.enabled && summary.pendingCount ? styles.statusLocked : styles.statusOpen]}><MaterialIcons name={gateConfig.enabled && summary.pendingCount ? "lock-outline" : "lock-open"} size={17} color={gateConfig.enabled && summary.pendingCount ? COLORS.warning : COLORS.success} /><Text style={[styles.statusText, { color: gateConfig.enabled && summary.pendingCount ? "#8A5A13" : "#2A7552" }]}>{gateConfig.enabled && summary.pendingCount ? `現在 ${summary.pendingCount}件の必須項目が未完了です` : "必須項目が完了すると、制限は自動的に解除されます"}</Text></View>
            </View>

            <View style={styles.permissionCard}>
              <View style={styles.permissionIcon}><MaterialIcons name="accessibility-new" size={23} color={COLORS.blue} /></View>
              <View style={styles.permissionCopy}><Text style={styles.permissionTitle}>Androidのアクセシビリティ権限</Text><Text style={styles.permissionDescription}>{nativeReady ? accessibilityEnabled ? "有効です。選択したアプリの前面化を検出できます。" : "有効化すると、選択したアプリを開いた際に集中ルールを適用できます。" : "この機能は、ネイティブAndroidビルドで利用できます。"}</Text></View>
              {nativeReady ? <TouchableOpacity onPress={async () => { await openAccessibilitySettings(); setTimeout(() => void refreshAccessibility(), 750); }} style={styles.permissionButton}><Text style={styles.permissionButtonText}>{accessibilityEnabled ? "確認" : "有効化"}</Text></TouchableOpacity> : null}
            </View>

            <SectionLabel title="制限するアプリ" detail="選択したアプリが前面に出ると、Focus Flowへ戻します" />
            <View style={styles.card}>
              {!nativeReady ? <Notice icon="android" text="ネイティブAndroidビルドを端末へ入れると、インストール済みアプリをここで選択できます。" /> : loadingApps ? <View style={styles.loadingRow}><ActivityIndicator color={COLORS.forest} /><Text style={styles.loadingText}>アプリ一覧を読み込んでいます</Text></View> : apps.length ? apps.slice(0, 36).map((app) => <ChoiceRow key={app.packageName} title={app.label} detail={app.packageName} selected={gateConfig.blockedPackages.includes(app.packageName)} onPress={() => selectedApp(app.packageName)} />) : <Notice icon="apps" text="選択できるアプリを取得できませんでした。権限状態を確認してから再度開いてください。" />}
            </View>

            <SectionLabel title="必須Todo" detail="未選択の場合は、未完了のTodoすべてを必須として扱います" />
            <View style={styles.card}>{todos.length ? todos.map((todo) => <ChoiceRow key={todo.id} title={todo.title} detail={todo.completed ? "完了済み" : "未完了"} selected={gateConfig.requiredTodoIds.includes(todo.id)} onPress={() => selectedTodo(todo.id)} />) : <Notice icon="playlist-add" text="Todoを追加すると、ここで必須項目を選べます。" />}</View>

            <SectionLabel title="必須習慣" detail="未選択の場合は、登録済みの習慣すべてを必須として扱います" />
            <View style={styles.card}>{habits.length ? habits.map((habit) => <ChoiceRow key={habit.id} title={habit.title} detail={`週${habit.goalPerWeek}日を目標`} selected={gateConfig.requiredHabitIds.includes(habit.id)} onPress={() => selectedHabit(habit.id)} accent={habit.color} />) : <Notice icon="repeat" text="習慣を追加すると、ここで必須項目を選べます。" />}</View>

            <SectionLabel title="ホーム画面ウィジェット" />
            <View style={styles.widgetCard}><View style={styles.widgetPreview}><Text style={styles.widgetCount}>{summary.pendingCount ? `${summary.pendingCount}件` : "完了"}</Text><View style={styles.widgetCopy}><Text style={styles.widgetBrand}>Focus Flow</Text><Text style={styles.widgetStatus}>{gateConfig.enabled && summary.pendingCount ? "集中制限中：タップして必須項目を確認" : "今日の集中ルールは解除されています"}</Text></View></View><Text style={styles.widgetDescription}>Androidのホーム画面を長押しして「ウィジェット」から Focus Flow を追加してください。Todo・習慣の完了に合わせて状態が更新されます。</Text></View>

            <SectionLabel title="表示" />
            <View style={[styles.card, { backgroundColor: displaySettings.theme === "slate" ? "#263934" : COLORS.white, opacity: opacityMap[displaySettings.cardOpacity] }]}>
              <Text style={[styles.preferenceLabel, displaySettings.theme === "slate" && { color: "#F1F8F4" }]}>文字サイズ</Text>
              <Segmented options={[{ key: "compact", label: "小" }, { key: "standard", label: "標準" }, { key: "large", label: "大" }]} selected={displaySettings.fontScale} onSelect={(fontScale) => setDisplaySettings({ fontScale: fontScale as DisplaySettings["fontScale"] })} />
              <Text style={[styles.preferenceLabel, displaySettings.theme === "slate" && { color: "#F1F8F4" }]}>配色</Text>
              <Segmented options={[{ key: "mist", label: "ミスト" }, { key: "slate", label: "スレート" }]} selected={displaySettings.theme} onSelect={(theme) => setDisplaySettings({ theme: theme as DisplaySettings["theme"] })} />
              <Text style={[styles.preferenceLabel, displaySettings.theme === "slate" && { color: "#F1F8F4" }]}>カードの透過率</Text>
              <Segmented options={[{ key: "solid", label: "不透明" }, { key: "soft", label: "やわらかく" }, { key: "glass", label: "ガラス" }]} selected={displaySettings.cardOpacity} onSelect={(cardOpacity) => setDisplaySettings({ cardOpacity: cardOpacity as DisplaySettings["cardOpacity"] })} />
              <View style={[styles.preview, { backgroundColor: displaySettings.theme === "slate" ? "#315B8C" : "#E8F0EC", opacity: opacityMap[displaySettings.cardOpacity] }]}><ScaledText style={[styles.previewTitle, displaySettings.theme === "slate" && { color: COLORS.white }]}>表示プレビュー</ScaledText><ScaledText style={[styles.previewText, displaySettings.theme === "slate" && { color: "#E7F0F9" }]}>自分に合う、落ち着いた読みやすさに調整できます。</ScaledText></View>
            </View>
          </>
        }
      />
    </ScreenContainer>
  );
}

function SectionLabel({ title, detail }: { title: string; detail?: string }) { return <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>{title}</Text>{detail ? <Text style={styles.sectionDetail}>{detail}</Text> : null}</View>; }
function Notice({ icon, text }: { icon: React.ComponentProps<typeof MaterialIcons>["name"]; text: string }) { return <View style={styles.notice}><MaterialIcons name={icon} size={20} color={COLORS.muted} /><Text style={styles.noticeText}>{text}</Text></View>; }
function ChoiceRow({ title, detail, selected, onPress, accent }: { title: string; detail: string; selected: boolean; onPress: () => void; accent?: string }) { return <TouchableOpacity onPress={onPress} activeOpacity={0.72} style={styles.choiceRow}><View style={[styles.choiceMark, selected && { backgroundColor: accent ?? COLORS.forest, borderColor: accent ?? COLORS.forest }]}>{selected ? <MaterialIcons name="check" size={15} color={COLORS.white} /> : null}</View><View style={styles.choiceCopy}><Text style={styles.choiceTitle} numberOfLines={1}>{title}</Text><Text style={styles.choiceDetail} numberOfLines={1}>{detail}</Text></View></TouchableOpacity>; }
function Segmented({ options, selected, onSelect }: { options: { key: string; label: string }[]; selected: string; onSelect: (key: string) => void }) { return <View style={styles.segmented}>{options.map((option) => <TouchableOpacity key={option.key} onPress={() => onSelect(option.key)} style={[styles.segment, selected === option.key && styles.segmentSelected]}><Text style={[styles.segmentText, selected === option.key && styles.segmentTextSelected]}>{option.label}</Text></TouchableOpacity>)}</View>; }
function toggleId(items: string[], id: string) { return items.includes(id) ? items.filter((item) => item !== id) : [...items, id]; }

const styles = StyleSheet.create({
  content: { paddingTop: 16, paddingBottom: 34 }, sectionHeading: { marginTop: 22, marginBottom: 9 }, sectionTitle: { color: COLORS.text, fontSize: 17, fontWeight: "800" }, sectionDetail: { color: COLORS.muted, fontSize: 12, lineHeight: 17, marginTop: 3 }, card: { backgroundColor: COLORS.white, borderRadius: 19, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 15, overflow: "hidden" }, row: { minHeight: 71, flexDirection: "row", alignItems: "center", gap: 12 }, rowCopy: { flex: 1 }, rowTitle: { color: COLORS.text, fontSize: 15, fontWeight: "800" }, rowDescription: { color: COLORS.muted, fontSize: 12, lineHeight: 17, marginTop: 3 }, status: { flexDirection: "row", gap: 8, alignItems: "center", padding: 11, borderRadius: 13, marginBottom: 14 }, statusLocked: { backgroundColor: "#FFF2DD" }, statusOpen: { backgroundColor: "#E7F3ED" }, statusText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: "700" }, permissionCard: { flexDirection: "row", gap: 10, alignItems: "center", backgroundColor: "#EAF0F7", borderRadius: 19, padding: 14, marginTop: 11 }, permissionIcon: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#D8E5F2" }, permissionCopy: { flex: 1 }, permissionTitle: { color: COLORS.blue, fontSize: 13, fontWeight: "800" }, permissionDescription: { color: "#4B6681", fontSize: 11, lineHeight: 16, marginTop: 2 }, permissionButton: { minHeight: 36, paddingHorizontal: 10, borderRadius: 11, backgroundColor: COLORS.blue, justifyContent: "center" }, permissionButtonText: { color: COLORS.white, fontSize: 12, fontWeight: "800" }, loadingRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, paddingVertical: 20 }, loadingText: { color: COLORS.muted, fontSize: 13 }, notice: { flexDirection: "row", gap: 9, paddingVertical: 16, alignItems: "flex-start" }, noticeText: { color: COLORS.muted, flex: 1, fontSize: 13, lineHeight: 19 }, choiceRow: { flexDirection: "row", alignItems: "center", minHeight: 58, borderBottomColor: "#EEF2EF", borderBottomWidth: 1 }, choiceMark: { width: 25, height: 25, alignItems: "center", justifyContent: "center", borderRadius: 8, borderColor: "#B7C6BE", borderWidth: 1.4, marginRight: 11 }, choiceCopy: { flex: 1, minWidth: 0 }, choiceTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800" }, choiceDetail: { color: COLORS.muted, fontSize: 11, marginTop: 2 }, widgetCard: { backgroundColor: "#246B5A", borderRadius: 21, padding: 15 }, widgetPreview: { flexDirection: "row", alignItems: "center", backgroundColor: "#347A69", borderRadius: 16, padding: 14 }, widgetCount: { color: COLORS.white, fontSize: 25, fontWeight: "800" }, widgetCopy: { flex: 1, marginLeft: 13 }, widgetBrand: { color: "#DCEFE7", fontSize: 12, fontWeight: "800" }, widgetStatus: { color: COLORS.white, fontSize: 11, lineHeight: 16, marginTop: 3 }, widgetDescription: { color: "#D8EBE2", fontSize: 12, lineHeight: 18, marginTop: 12 }, preferenceLabel: { color: COLORS.text, fontSize: 13, fontWeight: "800", marginTop: 15, marginBottom: 8 }, segmented: { flexDirection: "row", gap: 6 }, segment: { flex: 1, minHeight: 39, justifyContent: "center", alignItems: "center", borderRadius: 11, backgroundColor: "#EDF2EF" }, segmentSelected: { backgroundColor: COLORS.forest }, segmentText: { color: COLORS.muted, fontSize: 12, fontWeight: "800" }, segmentTextSelected: { color: COLORS.white }, preview: { borderRadius: 14, padding: 14, marginTop: 18, marginBottom: 16 }, previewTitle: { color: COLORS.forest, fontSize: 18, fontWeight: "800" }, previewText: { color: "#416A5D", fontSize: 13, lineHeight: 19, marginTop: 3 },
});
