import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { ActivityIndicator, Alert, BackHandler, FlatList, Modal, PanResponder, Platform, ScrollView, StyleSheet, Switch, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScaledText } from "@/components/focus-flow/scaled-text";
import { COLORS, LoadingScreen, ScreenHeading, useFocusPalette } from "@/components/focus-flow/ui";
import { ScreenContainer } from "@/components/screen-container";
import { getAccessibilityStatus, getGateDiagnostics, getLaunchableApps, isNativeGateAvailable, openAccessibilitySettings, openAppDetailsSettings, type GateDiagnostics, type LaunchableApp } from "@/lib/focus-flow/android-gate";
import { APP_FONT_OPTIONS, getAppFontStyle } from "@/lib/focus-flow/app-fonts";
import { APPEARANCE_OPTIONS, APP_THEMES, resolvedAppTheme, type AppPalette } from "@/lib/focus-flow/app-themes";
import { isEnglish } from "@/lib/focus-flow/i18n";
import { useFocusFlow } from "@/lib/focus-flow/provider";
import { cancelDailyReminder, getReminderPermissionGranted, requestReminderPermission, scheduleDailyReminder, sendReminderTest } from "@/lib/focus-flow/reminders";
import type { AppThemeId, DisplaySettings, GateSchedule, SavedThemeSet } from "@/lib/focus-flow/types";
import { getGateRuleSummaries, getGateSummary } from "@/lib/focus-flow/utils";

const Text = ScaledText;
type SettingsPanel = "home" | "limits" | "appearance" | "reminders" | "plus";

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { todos, habits, memos, focusSessions, gateConfig, displaySettings, isReady, setGateConfig, canSelectBlockedApp, setDisplaySettings, plusStatus, purchasePlus, restorePlus, refreshPlusStatus, managePlus } = useFocusFlow();
  const palette = useFocusPalette();
  const [panel, setPanel] = useState<SettingsPanel>("home");
  const [apps, setApps] = useState<LaunchableApp[]>([]);
  const [nativeReady, setNativeReady] = useState(false);
  const [accessibilityEnabled, setAccessibilityEnabled] = useState(false);
  const [diagnostics, setDiagnostics] = useState<GateDiagnostics>();
  const [loadingApps, setLoadingApps] = useState(false);
  const [appPickerOpen, setAppPickerOpen] = useState(false);
  const [routineOpenId, setRoutineOpenId] = useState<string>();
  const [disclosureOpen, setDisclosureOpen] = useState(false);
  const [reminderPermission, setReminderPermission] = useState(false);
  const [reminderBusy, setReminderBusy] = useState(false);
  const [themeSetName, setThemeSetName] = useState("");
  const homeScrollRef = useRef<ScrollView>(null);

  const english = isEnglish(displaySettings);
  const t = (ja: string, en: string) => english ? en : ja;
  const isIOS = Platform.OS === "ios";
  const isPlus = Boolean(displaySettings.plusEntitlement && plusStatus.active);
  const summary = useMemo(() => getGateSummary({ todos, habits, memos, focusSessions, gateConfig, displaySettings }, new Date(), english ? "en" : "ja"), [todos, habits, memos, focusSessions, gateConfig, displaySettings, english]);
  const scheduleActive = useMemo(() => getGateRuleSummaries({ todos, habits, memos, focusSessions, gateConfig, displaySettings }, new Date(), english ? "en" : "ja").some((rule) => Boolean(rule.schedule) && rule.isActive), [todos, habits, memos, focusSessions, gateConfig, displaySettings, english]);

  const loadAndroidStatus = useCallback(async () => {
    const available = Platform.OS === "android" && isNativeGateAvailable();
    setNativeReady(available);
    if (!available) return;
    setLoadingApps(true);
    try {
      const [status, installed, currentDiagnostics] = await Promise.all([getAccessibilityStatus(), getLaunchableApps(), getGateDiagnostics()]);
      setAccessibilityEnabled(status);
      setApps(installed);
      setDiagnostics(currentDiagnostics);
    } finally {
      setLoadingApps(false);
    }
  }, []);

  useEffect(() => { void loadAndroidStatus(); }, [loadAndroidStatus]);
  useEffect(() => { void getReminderPermissionGranted().then(setReminderPermission).catch(() => setReminderPermission(false)); }, []);
  useFocusEffect(useCallback(() => {
    setPanel("home");
    setAppPickerOpen(false);
    setRoutineOpenId(undefined);
    requestAnimationFrame(() => homeScrollRef.current?.scrollTo({ y: 0, animated: false }));
    return undefined;
  }, []));
  useEffect(() => {
    if (Platform.OS !== "android" || panel === "home") return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      setPanel("home");
      return true;
    });
    return () => subscription.remove();
  }, [panel]);

  if (!isReady) return <ScreenContainer><LoadingScreen /></ScreenContainer>;

  const setGateEnabled = (enabled: boolean) => {
    if (!enabled && gateConfig.strictMode && gateConfig.enabled && summary.pendingCount > 0) {
      Alert.alert(t("厳格モードで保護中です", "Strict mode is protecting your limits"), t("必須項目が残る間は、ここから集中制限をオフにできません。終了する場合は、厳格モードのスイッチから明示的に確認してください。", "You can't turn off App limits here while must-dos remain. To end it, use the Strict mode switch and confirm explicitly."));
      return;
    }
    if (isIOS || !enabled) { setGateConfig({ enabled }); return; }
    if (!gateConfig.accessibilityDisclosureAcceptedAt) { setDisclosureOpen(true); return; }
    setGateConfig({ enabled: true });
  };
  const setStrictMode = (strictMode: boolean) => {
    if (strictMode) {
      if (!gateConfig.enabled) {
        Alert.alert(t("先に集中制限を有効にしてください", "Turn on App limits first"), t("厳格モードは、集中制限とAndroidのアクセシビリティ許可がある状態で使えます。", "Strict mode works after App limits and Android Accessibility are enabled."));
        return;
      }
      setGateConfig({ strictMode: true });
      return;
    }
    Alert.alert(t("厳格モードを終了しますか？", "End Strict mode?"), t("終了すると、必須項目が残っていてもFocus Flow内から集中制限をオフにできます。本当に保護を終了する場合だけ選んでください。Androidのシステム設定・強制停止・アプリ削除を防ぐ機能ではありません。", "Ending this lets you turn off App limits in Focus Flow even while must-dos remain. Choose this only if you really want to end protection. Strict mode cannot control Android system settings, force stop, or app removal."), [
      { text: t("保護を続ける", "Keep protection"), style: "cancel" },
      { text: t("今すぐ終了", "End now"), style: "destructive", onPress: () => setGateConfig({ strictMode: false }) },
    ]);
  };
  const enableAndOpenAccessibility = async () => {
    if (!gateConfig.accessibilityDisclosureAcceptedAt) setGateConfig({ accessibilityDisclosureAcceptedAt: new Date().toISOString() });
    await openAccessibilitySettings();
    setTimeout(() => void loadAndroidStatus(), 900);
  };
  const acceptDisclosure = () => {
    setGateConfig({ enabled: true, accessibilityDisclosureAcceptedAt: new Date().toISOString() });
    setDisclosureOpen(false);
    void openAccessibilitySettings();
  };
  const selectGlobalApp = (packageName: string) => {
    const selected = gateConfig.blockedPackages.includes(packageName);
    if (!selected && !canSelectBlockedApp(packageName)) {
      Alert.alert(t("無料版の上限です", "Free plan limit"), t("無料版では制限対象アプリを5件まで選べます。Plusでは無制限です。", "The free plan allows 5 limited apps. Plus removes this limit."));
      return;
    }
    setGateConfig({ blockedPackages: selected ? gateConfig.blockedPackages.filter((item) => item !== packageName) : [...gateConfig.blockedPackages, packageName] });
  };
  const addSchedule = () => setGateConfig({ schedules: [...gateConfig.schedules, { id: `schedule-${Date.now()}`, label: t(`時間帯 ${gateConfig.schedules.length + 1}`, `Time window ${gateConfig.schedules.length + 1}`), enabled: true, days: [1, 2, 3, 4, 5], startTime: "09:00", endTime: "18:00", requiredTodoIds: [], requiredHabitIds: [], blockedPackages: [] }] });
  const updateSchedule = (id: string, input: Partial<GateSchedule>) => setGateConfig({ schedules: gateConfig.schedules.map((item) => item.id === id ? { ...item, ...input } : item) });
  const removeSchedule = (id: string) => {
    const schedule = gateConfig.schedules.find((item) => item.id === id);
    if (!schedule) return;
    const affectedTodos = todos.filter((todo) => todo.requiredWindowMode === "scheduled" && todo.requiredScheduleIds?.includes(id)).length;
    const affectedHabits = habits.filter((habit) => habit.requiredWindowMode === "scheduled" && habit.requiredScheduleIds?.includes(id)).length;
    const affectedCount = affectedTodos + affectedHabits;
    const remove = () => setGateConfig({ schedules: gateConfig.schedules.filter((item) => item.id !== id) });
    if (!affectedCount) { remove(); return; }
    Alert.alert(t("時間帯を削除しますか？", "Remove this time window?"), t(`「${schedule.label}」を使う必須項目が${affectedCount}件あります。削除後、それらは「いつでも必須」に変わります。`, `${affectedCount} must-dos use “${schedule.label}”. After removal, they will become required anytime.`), [{ text: t("戻る", "Cancel"), style: "cancel" }, { text: t("削除する", "Remove"), style: "destructive", onPress: remove }]);
  };
  const toggleReminder = async (enabled: boolean) => {
    if (Platform.OS === "web") return;
    setReminderBusy(true);
    try {
      if (!enabled) { await cancelDailyReminder(); setDisplaySettings({ dailyReminderEnabled: false }); return; }
      const permitted = await requestReminderPermission();
      setReminderPermission(permitted);
      if (permitted) setDisplaySettings({ dailyReminderEnabled: await scheduleDailyReminder({ english, time: displaySettings.dailyReminderTime ?? "19:00" }) });
    } finally { setReminderBusy(false); }
  };
  const updateReminderTime = async (time: string) => {
    setDisplaySettings({ dailyReminderTime: time });
    if (!displaySettings.dailyReminderEnabled) return;
    setReminderBusy(true);
    try { setReminderPermission(await scheduleDailyReminder({ english, time })); } finally { setReminderBusy(false); }
  };
  const saveThemeSet = () => {
    const name = themeSetName.trim();
    if (!isPlus || !name) return;
    const set: SavedThemeSet = { id: `theme-set-${Date.now()}`, name: name.slice(0, 32), appTheme: resolvedAppTheme(displaySettings), appearance: displaySettings.appearance ?? "system", fontFamily: displaySettings.fontFamily ?? "system", widgetThemes: displaySettings.widgetThemes ?? {}, widgetTextSizes: displaySettings.widgetTextSizes ?? {}, widgetOpacity: displaySettings.widgetOpacity ?? 86, widgetBackgroundOpacity: displaySettings.widgetBackgroundOpacity ?? displaySettings.widgetOpacity ?? 86, widgetCardOpacity: displaySettings.widgetCardOpacity ?? 100 };
    setDisplaySettings({ savedThemeSets: [...(displaySettings.savedThemeSets ?? []), set] });
    setThemeSetName("");
  };

  const body = panel === "home" ? (
    <SettingsHome scrollRef={homeScrollRef} english={english} gateEnabled={gateConfig.enabled} pendingCount={summary.pendingCount} accessibilityEnabled={accessibilityEnabled} themeLabel={english ? APP_THEMES[resolvedAppTheme(displaySettings)].label.en : APP_THEMES[resolvedAppTheme(displaySettings)].label.ja} languageLabel={displaySettings.language === "en" ? "English" : displaySettings.language === "ja" ? "日本語" : t("端末に連動", "Automatic")} reminderEnabled={Boolean(displaySettings.dailyReminderEnabled)} isPlus={isPlus} onOpen={setPanel} onLegal={(path) => router.push(path as never)} />
  ) : (
    <ScrollView key={panel} contentContainerStyle={[styles.detailContent, { paddingBottom: Math.max(88, insets.bottom + 44) }]} showsVerticalScrollIndicator={false}>
      <PanelHeader title={panel === "limits" ? t("集中制限", "App limits") : panel === "appearance" ? t("表示と言語", "Appearance & language") : panel === "reminders" ? t("毎日のリマインダー", "Daily reminder") : t("Plusとサブスクリプション", "Plus & subscription")} onBack={() => setPanel("home")} />
      {panel === "limits" ? <LimitsPanel english={english} isIOS={isIOS} nativeReady={nativeReady} loadingApps={loadingApps} apps={apps} appPickerOpen={appPickerOpen} onToggleAppPicker={() => setAppPickerOpen((value) => !value)} selectedApps={gateConfig.blockedPackages} onSelectApp={selectGlobalApp} enabled={gateConfig.enabled} strictMode={Boolean(gateConfig.strictMode)} pendingCount={summary.pendingCount} scheduleActive={scheduleActive} accessibilityEnabled={accessibilityEnabled} diagnostics={diagnostics} schedules={gateConfig.schedules} routineOpenId={routineOpenId} onToggleEnabled={setGateEnabled} onToggleStrictMode={setStrictMode} onOpenAccessibility={() => void enableAndOpenAccessibility()} onRefresh={() => void loadAndroidStatus()} onOpenAppInfo={() => void openAppDetailsSettings()} onAddSchedule={addSchedule} onToggleRoutine={setRoutineOpenId} onUpdateSchedule={updateSchedule} onRemoveSchedule={removeSchedule} canSelectBlockedApp={canSelectBlockedApp} /> : null}
      {panel === "appearance" ? <><AppearancePanel english={english} displaySettings={displaySettings} onChange={setDisplaySettings} /><WidgetsPanel english={english} displaySettings={displaySettings} onBackgroundOpacity={(widgetBackgroundOpacity) => setDisplaySettings({ widgetBackgroundOpacity })} onCardOpacity={(widgetCardOpacity) => setDisplaySettings({ widgetCardOpacity })} /></> : null}
      {panel === "reminders" ? <ReminderPanel english={english} enabled={Boolean(displaySettings.dailyReminderEnabled)} permission={reminderPermission} time={displaySettings.dailyReminderTime ?? "19:00"} busy={reminderBusy} onToggle={(enabled) => void toggleReminder(enabled)} onChangeTime={(time) => void updateReminderTime(time)} onTest={() => void (async () => { setReminderBusy(true); try { setReminderPermission((await sendReminderTest(english)) || reminderPermission); } finally { setReminderBusy(false); } })()} /> : null}
      {panel === "plus" ? <PlusPanel english={english} isIOS={isIOS} isPlus={isPlus} price={plusStatus.price} status={plusStatus.status} reason={plusStatus.reason} themeSetName={themeSetName} themeSets={displaySettings.savedThemeSets ?? []} onNameChange={setThemeSetName} onSaveSet={saveThemeSet} onApplySet={(set) => setDisplaySettings({ appTheme: set.appTheme, appearance: set.appearance, fontFamily: set.fontFamily ?? "system", widgetThemes: set.widgetThemes, widgetTextSizes: set.widgetTextSizes, widgetOpacity: set.widgetOpacity ?? 86, widgetBackgroundOpacity: set.widgetBackgroundOpacity ?? set.widgetOpacity ?? 86, widgetCardOpacity: set.widgetCardOpacity ?? 100 })} onRemoveSet={(id) => setDisplaySettings({ savedThemeSets: (displaySettings.savedThemeSets ?? []).filter((set) => set.id !== id) })} onPurchase={() => void purchasePlus()} onRestore={() => void restorePlus()} onRefresh={() => void refreshPlusStatus()} onManage={() => void managePlus()} /> : null}
    </ScrollView>
  );

  return <ScreenContainer className="px-5" containerClassName="bg-background">
    <Modal visible={disclosureOpen} transparent animationType="fade" onRequestClose={() => setDisclosureOpen(false)}><View style={styles.modalBackdrop}><View style={[styles.modalCard, { backgroundColor: palette.surface, borderColor: palette.border }]}><MaterialIcons name="privacy-tip" size={25} color={COLORS.blue} /><Text style={[styles.modalTitle, { color: palette.text }]}>{t("集中制限を有効にする前に", "Before turning on App limits")}</Text><Text style={[styles.modalText, { color: palette.muted }]}>{t("Focus Flowは選択したアプリが前面に開いたことだけを確認し、未完了の必須項目がある間に集中ルールを適用します。画面の内容・メッセージ・入力内容・スクリーンショットは読み取りません。", "Focus Flow only checks when a selected app comes to the foreground and applies your rule while must-dos remain. It does not read screen content, messages, typed text, or screenshots.")}</Text><TouchableOpacity onPress={acceptDisclosure} style={[styles.primaryButton, { backgroundColor: palette.primary }]}><Text style={[styles.primaryButtonText, { color: palette.isDark ? palette.background : COLORS.white }]}>{t("内容を理解してAndroidの設定を開く", "I understand — open Android settings")}</Text></TouchableOpacity><TouchableOpacity onPress={() => setDisclosureOpen(false)} style={styles.textButton}><Text style={[styles.textButtonLabel, { color: palette.muted }]}>{t("今は設定しない", "Not now")}</Text></TouchableOpacity></View></View></Modal>
    {body}
  </ScreenContainer>;
}

function SettingsHome({ scrollRef, english, gateEnabled, pendingCount, accessibilityEnabled, themeLabel, languageLabel, reminderEnabled, isPlus, onOpen, onLegal }: { scrollRef: RefObject<ScrollView | null>; english: boolean; gateEnabled: boolean; pendingCount: number; accessibilityEnabled: boolean; themeLabel: string; languageLabel: string; reminderEnabled: boolean; isPlus: boolean; onOpen: (panel: SettingsPanel) => void; onLegal: (path: string) => void }) {
  const t = (ja: string, en: string) => english ? en : ja;
  const palette = useFocusPalette();
  const limitDetail = !gateEnabled ? t("オフ", "Off") : pendingCount ? t(`制限中・未完了 ${pendingCount}件`, `On · ${pendingCount} open`) : t("有効・解除条件を完了", "On · all clear");
  return <ScrollView ref={scrollRef} contentContainerStyle={styles.homeContent} showsVerticalScrollIndicator={false}>
    <ScreenHeading eyebrow={t("自分に合わせる", "Make it yours")} title={t("設定", "Settings")} />
    <Text style={styles.homeLead}>{t("変更はすぐに保存されます。目的に合わせて選んでください。", "Changes are saved right away. Choose what you want to adjust.")}</Text>
    <SectionTitle title={t("集中を整える", "Focus")} detail={t("制限するアプリと、必須項目を取り組む時間帯を設定します。", "Set the apps to limit and when must-dos become active.")} />
    <SettingsEntry icon="lock-outline" tint={palette.isDark ? palette.elevated : "#FFF4E3"} color="#A56812" title={t("集中制限と実行時間帯", "App limits & time windows")} detail={limitDetail} badge={!accessibilityEnabled && gateEnabled ? t("許可が必要", "Permission needed") : undefined} onPress={() => onOpen("limits")} />
    <SectionTitle title={t("見やすさと通知", "Display & reminders")} detail={t("外観、文字、言語、Widget、毎日の確認を調整します。", "Adjust appearance, type, language, widgets, and a daily check-in.")} />
    <SettingsEntry icon="palette" tint="#E4F3EF" color={COLORS.forest} title={t("表示・文字・Widget", "Appearance, type & widget")} detail={`${themeLabel} · ${languageLabel}`} onPress={() => onOpen("appearance")} />
    <SettingsEntry icon="notifications-none" tint="#E9F3FA" color={COLORS.blue} title={t("毎日のリマインダー", "Daily reminder")} detail={reminderEnabled ? t("オン", "On") : t("オフ", "Off")} onPress={() => onOpen("reminders")} />
    <SectionTitle title={t("アカウントとデータ", "Plan & data")} detail={t("無料版とPlus、端末内のデータとプライバシーを確認します。", "Review Free and Plus, plus your on-device data and privacy.")} />
    <SettingsEntry icon="workspace-premium" tint="#F5ECFB" color="#74509B" title={t("Plusとサブスクリプション", "Plus & subscription")} detail={isPlus ? t("Plusを利用中", "Plus is active") : t("無料版の範囲とPlusを確認", "Review Free and Plus")} onPress={() => onOpen("plus")} />
    <SettingsEntry icon="privacy-tip" tint="#E8F0FC" color="#3D67A8" title={t("データとプライバシー", "Data & privacy")} detail={t("端末内データ、権限、削除について確認します。", "Review on-device data, permissions, and deletion.")} onPress={() => onLegal("/privacy")} />
    <SectionTitle title={t("困ったとき", "Help")} />
    <SettingsEntry icon="support-agent" tint="#F2F3F6" color="#596778" title={t("ヘルプとサポート", "Help & support")} detail={t("よくある質問、問い合わせ、動作確認の方法です。", "Find answers, contact support, and check app status.")} onPress={() => onLegal("/support")} />
    <View style={styles.supportLinks}><TouchableOpacity onPress={() => onLegal("/legal")}><Text style={styles.supportLink}>{t("利用条件", "Terms")}</Text></TouchableOpacity><TouchableOpacity onPress={() => onLegal("/policy")}><Text style={styles.supportLink}>{t("ポリシー", "Policy")}</Text></TouchableOpacity><TouchableOpacity onPress={() => onLegal("/help")}><Text style={styles.supportLink}>{t("使い方", "Help")}</Text></TouchableOpacity></View>
  </ScrollView>;
}

function LimitsPanel({ english, isIOS, nativeReady, loadingApps, apps, appPickerOpen, onToggleAppPicker, selectedApps, onSelectApp, enabled, strictMode, pendingCount, scheduleActive, accessibilityEnabled, diagnostics, schedules, routineOpenId, onToggleEnabled, onToggleStrictMode, onOpenAccessibility, onRefresh, onOpenAppInfo, onAddSchedule, onToggleRoutine, onUpdateSchedule, onRemoveSchedule, canSelectBlockedApp }: { english: boolean; isIOS: boolean; nativeReady: boolean; loadingApps: boolean; apps: LaunchableApp[]; appPickerOpen: boolean; onToggleAppPicker: () => void; selectedApps: string[]; onSelectApp: (value: string) => void; enabled: boolean; strictMode: boolean; pendingCount: number; scheduleActive: boolean; accessibilityEnabled: boolean; diagnostics?: GateDiagnostics; schedules: GateSchedule[]; routineOpenId?: string; onToggleEnabled: (value: boolean) => void; onToggleStrictMode: (value: boolean) => void; onOpenAccessibility: () => void; onRefresh: () => void; onOpenAppInfo: () => void; onAddSchedule: () => void; onToggleRoutine: (id?: string) => void; onUpdateSchedule: (id: string, input: Partial<GateSchedule>) => void; onRemoveSchedule: (id: string) => void; canSelectBlockedApp: (packageName: string) => boolean }) {
  const t = (ja: string, en: string) => english ? en : ja;
  const runtimeState = diagnostics?.lastGateStateUpdatedAt ? t(`同期済み：${diagnostics.configuredRuleCount}ルール・${diagnostics.configuredBlockedPackageCount}アプリ`, `Synced: ${diagnostics.configuredRuleCount} rule(s), ${diagnostics.configuredBlockedPackageCount} app(s)`) : t("同期情報を取得できません。状態を再確認してください。", "Sync details are unavailable. Refresh status.");
  const eventState = diagnostics?.lastGateEventAt ? t(`前面アプリを検出済み：${diagnostics.lastGateEventPackage || "不明"}`, `Foreground app detected: ${diagnostics.lastGateEventPackage || "Unknown"}`) : t("まだ前面アプリを検出していません。制限対象を一度開いて確認してください。", "No foreground app event yet. Open a selected app to verify.");
  const palette = useFocusPalette();
  if (isIOS) return <InfoCard icon="phone-iphone" title={t("iPhoneではアプリ制限を使いません", "App limits are not available on iPhone")} detail={t("Todo・習慣・時間管理・通知は追加権限なしで利用できます。", "Tasks, habits, timed items, and reminders work without extra device permission.")} />;
  return <>
    <InfoCard icon={enabled && pendingCount ? "lock" : "lock-open"} title={enabled ? pendingCount ? t(`現在 ${pendingCount}件の必須項目が未完了です`, `${pendingCount} must-do item(s) are open`) : t("集中制限は有効です", "App limits are on") : t("集中制限はオフです", "App limits are off")} detail={enabled ? scheduleActive ? t("選択したアプリは、必須項目を完了するまで制限されます。", "Selected apps stay limited until must-dos are complete.") : t("現在は設定した時間帯の外です。", "The current time is outside your schedule.") : t("オンにすると、選択したアプリを必須項目の完了まで制限します。", "Turn this on to limit selected apps until must-dos are complete.")} />
    <InfoCard icon="format-list-numbered" title={t("設定は3つの順番で進めます", "Set up in three steps")} detail={t("1. Androidの許可を確認　2. 制限するアプリを選ぶ　3. 実行時間帯を決める。時間帯を選ばない場合はいつでも有効です。", "1. Check Android permission. 2. Choose apps. 3. Set time windows. Without a window, limits apply anytime.")} />
    <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}><SettingRow title={t("必須項目を終えるまで制限", "Limit apps until must-dos are done")} detail={t("オンにする前に、Androidのアクセシビリティ許可を確認します。", "Android Accessibility permission is checked before enabling.")} control={<Switch value={enabled} onValueChange={onToggleEnabled} trackColor={{ false: "#CCD7D1", true: "#91C3B3" }} thumbColor={enabled ? COLORS.forest : "#F7F8F5"} />} /><SettingRow title={t("厳格モード", "Strict mode")} detail={strictMode ? t("未完了の必須項目がある間は、ここから集中制限をオフにできません。遮断画面からアプリ情報も開きません。", "While must-dos remain, App limits can't be turned off here and the gate doesn't link to app info.") : t("うっかり解除を防ぎ、遮断画面からの設定導線を減らします。Androidのシステム設定やアプリ削除を防ぎません。", "Prevents accidental in-app unlocks and removes the app-info link from the gate. It does not manage Android system settings or app removal.")} control={<Switch value={strictMode} onValueChange={onToggleStrictMode} trackColor={{ false: "#CCD7D1", true: "#BE94E1" }} thumbColor={strictMode ? "#74509B" : "#F7F8F5"} />} /></View>
    <SectionTitle title={t("1. Androidの許可と動作確認", "1. Android permission & status")} />
    <View style={styles.card}><SettingRow title={accessibilityEnabled ? t("アクセシビリティは有効です", "Accessibility is enabled") : t("アクセシビリティを許可する", "Allow Accessibility")} detail={accessibilityEnabled ? t("選択アプリの前面化を検出できます。", "Focus Flow can detect selected apps in the foreground.") : t("許可されない限り、アプリ制限は動作しません。", "App limits cannot run until this is enabled.")} control={<TouchableOpacity onPress={onOpenAccessibility} style={styles.smallButton}><Text style={styles.smallButtonText}>{accessibilityEnabled ? t("開く", "Open") : t("許可", "Allow")}</Text></TouchableOpacity>} /><View style={styles.compactStatus}><MaterialIcons name={diagnostics?.backgroundRestricted ? "warning-amber" : "check-circle"} size={16} color={diagnostics?.backgroundRestricted ? COLORS.warning : COLORS.success} /><Text style={styles.compactStatusText}>{diagnostics?.backgroundRestricted ? t("バックグラウンド実行が制限されています。端末のアプリ情報で許可してください。", "Background activity is restricted. Allow it in app info.") : t("バックグラウンド実行に大きな制限は検出されませんでした。", "No major background restriction was detected.")}</Text></View><View style={styles.compactStatus}><MaterialIcons name={diagnostics?.lastGateEventAt ? "visibility" : "sync-problem"} size={16} color={diagnostics?.lastGateEventAt ? COLORS.success : COLORS.warning} /><Text style={styles.compactStatusText}>{runtimeState}{"\n"}{eventState}</Text></View><View style={styles.inlineActions}><TouchableOpacity onPress={onRefresh} style={styles.textAction}><Text style={styles.textActionLabel}>{t("状態を再確認", "Refresh status")}</Text></TouchableOpacity><TouchableOpacity onPress={onOpenAppInfo} style={styles.textAction}><Text style={styles.textActionLabel}>{t("アプリ情報", "App info")}</Text></TouchableOpacity></View></View>
    <SectionTitle title={t("2. 制限するアプリ", "2. Apps to limit")} detail={t("ここで選んだアプリは、設定した時間帯のすべてで制限対象になります。", "Apps selected here are limited in every active schedule.")} />
    <View style={styles.card}><TouchableOpacity onPress={onToggleAppPicker} style={styles.selectorRow}><View style={styles.selectorIcon}><MaterialIcons name="apps" size={20} color={COLORS.forest} /></View><View style={styles.selectorCopy}><Text style={styles.selectorTitle}>{selectedApps.length ? t(`${selectedApps.length}件を選択中`, `${selectedApps.length} selected`) : t("アプリを選ぶ", "Choose apps")}</Text><Text style={styles.selectorDetail}>{t("銀行・決済・連絡・地図アプリは選ばないでください。", "Do not select banking, payment, messaging, or navigation apps.")}</Text></View><MaterialIcons name={appPickerOpen ? "expand-less" : "chevron-right"} size={22} color={COLORS.muted} /></TouchableOpacity>{appPickerOpen ? <AppPicker apps={apps} loading={loadingApps} selected={selectedApps} onSelect={onSelectApp} canSelect={canSelectBlockedApp} english={english} /> : null}</View>
    {selectedApps.length ? <SelectedApps apps={apps} selected={selectedApps} english={english} /> : null}
    <SectionTitle title={t("3. 実行時間帯", "3. Time windows")} detail={t("Todo・習慣で選んだ時間帯に、必須項目とアプリ制限を有効にします。時間帯を設定しない場合は常時適用です。", "A selected time window activates must-dos and app limits. Without one, limits apply anytime.")} />
    <View style={styles.card}>{schedules.map((schedule) => <RoutineEditor key={schedule.id} schedule={schedule} expanded={routineOpenId === schedule.id} apps={apps} loading={loadingApps} english={english} onToggle={() => onToggleRoutine(routineOpenId === schedule.id ? undefined : schedule.id)} onChange={(input) => onUpdateSchedule(schedule.id, input)} onRemove={() => onRemoveSchedule(schedule.id)} />)}<TouchableOpacity onPress={onAddSchedule} style={styles.addButton}><MaterialIcons name="add" size={18} color={COLORS.forest} /><Text style={styles.addButtonText}>{t("時間帯を追加", "Add a schedule")}</Text></TouchableOpacity></View>
  </>;
}

function AppearancePanel({ english, displaySettings, onChange }: { english: boolean; displaySettings: DisplaySettings; onChange: (input: Partial<DisplaySettings>) => void }) {
  const t = (ja: string, en: string) => english ? en : ja;
  const palette = useFocusPalette();
  return <>
    <AppearancePreview english={english} displaySettings={displaySettings} />
    <SectionTitle title={t("テーマ", "Theme")} detail={t("アプリとホーム画面ウィジェットに共通で反映されます。", "Used by both the app and home-screen widget.")} />
    <View style={styles.choiceGrid}>{(Object.keys(APP_THEMES) as AppThemeId[]).map((theme) => <ThemeChoice key={theme} theme={theme} selected={resolvedAppTheme(displaySettings) === theme} english={english} palette={palette} onPress={() => onChange({ appTheme: theme, cardOpacity: "soft" })} />)}</View>
    <SectionTitle title={t("明るさ", "Appearance")} />
    <Segmented options={APPEARANCE_OPTIONS.map((item) => ({ key: item, label: item === "system" ? t("端末に連動", "System") : item === "light" ? t("ライト", "Light") : t("ダーク", "Dark") }))} selected={displaySettings.appearance ?? "system"} onSelect={(appearance) => onChange({ appearance: appearance as DisplaySettings["appearance"] })} />
    <SectionTitle title={t("文字", "Type")} detail={t("同じ見本で読みやすさを比べます。", "Compare readability with one consistent sample.")} />
    <View style={appearanceStyles.fontList}>{APP_FONT_OPTIONS.map((item) => <FontChoice key={item.id} item={item} selected={(displaySettings.fontFamily ?? "system") === item.id} english={english} palette={palette} onPress={() => onChange({ fontFamily: item.id })} />)}</View>
    <SectionTitle title={t("文字サイズ", "Text size")} /><Segmented options={[{ key: "compact", label: t("小さめ", "Compact") }, { key: "standard", label: t("標準", "Standard") }, { key: "large", label: t("大きめ", "Large") }]} selected={displaySettings.fontScale} onSelect={(fontScale) => onChange({ fontScale: fontScale as DisplaySettings["fontScale"] })} />
    <SectionTitle title={t("言語 / Language", "Language")} detail={t("自動では端末の言語を使います。日本語端末では日本語で表示されます。", "Automatic follows your device language.")} /><Segmented options={[{ key: "auto", label: t("自動", "Automatic") }, { key: "ja", label: "日本語" }, { key: "en", label: "English" }]} selected={displaySettings.language ?? "auto"} onSelect={(language) => onChange({ language: language as DisplaySettings["language"] })} />
  </>;
}

function ReminderPanel({ english, enabled, permission, time, busy, onToggle, onChangeTime, onTest }: { english: boolean; enabled: boolean; permission: boolean; time: string; busy: boolean; onToggle: (value: boolean) => void; onChangeTime: (value: string) => void; onTest: () => void }) {
  const t = (ja: string, en: string) => english ? en : ja;
  return <><InfoCard icon="notifications-none" title={t("1日1回だけの確認", "One gentle daily check-in")} detail={t("完了状況を問わず、今日の予定を確認するための中立的な通知です。", "A neutral reminder to review today, regardless of completion.")} /><View style={styles.card}><SettingRow title={t("日課を確認する", "Daily check-in")} detail={permission ? t("通知は許可されています。", "Notifications are allowed.") : t("オンにすると端末の通知許可を確認します。", "Turning this on requests notification permission.")} control={<Switch value={enabled} disabled={busy} onValueChange={onToggle} trackColor={{ false: "#CCD7D1", true: "#91C3B3" }} thumbColor={enabled ? COLORS.forest : "#F7F8F5"} />}/>{enabled ? <><TimeStepper value={time} english={english} onChange={onChangeTime} /><TouchableOpacity disabled={busy} onPress={onTest} style={styles.primaryButton}><Text style={styles.primaryButtonText}>{busy ? t("準備中…", "Preparing…") : t("今すぐ試す", "Send a test")}</Text></TouchableOpacity></> : null}</View></>;
}

function OpacitySlider({ english, label, detail, value, onChange }: { english: boolean; label: string; detail: string; value: number; onChange: (value: number) => void }) {
  const palette = useFocusPalette();
  const [trackWidth, setTrackWidth] = useState(0);
  const trackRef = useRef<View>(null);
  const trackLeft = useRef(0);
  const normalized = Math.max(0, Math.min(100, Math.round(value / 10) * 10));
  const measureTrack = useCallback(() => {
    trackRef.current?.measureInWindow((left, _top, width) => {
      trackLeft.current = left;
      if (width > 0) setTrackWidth(width);
    });
  }, []);
  const setFromPageX = useCallback((pageX: number) => {
    if (!trackWidth) return;
    const raw = ((pageX - trackLeft.current) / trackWidth) * 100;
    const next = Math.max(0, Math.min(100, Math.round(raw / 10) * 10));
    if (next !== normalized) onChange(next);
  }, [normalized, onChange, trackWidth]);
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => {
      const left = event.nativeEvent.pageX - event.nativeEvent.locationX;
      if (Number.isFinite(left)) trackLeft.current = left;
      measureTrack();
      setFromPageX(event.nativeEvent.pageX);
    },
    onPanResponderMove: (_event, gesture) => setFromPageX(gesture.moveX),
  }), [measureTrack, setFromPageX]);
  const t = (ja: string, en: string) => english ? en : ja;
  return <View style={appearanceStyles.sliderWrap}><View style={appearanceStyles.sliderHeading}><View style={styles.selectorCopy}><Text style={[styles.settingTitle, { color: palette.text }]}>{label}</Text><Text style={[styles.settingDetail, { color: palette.muted }]}>{detail}</Text></View><Text style={[appearanceStyles.sliderValue, { color: palette.primary }]}>{normalized}%</Text></View><View ref={trackRef} accessibilityRole="adjustable" accessibilityLabel={`${label}: ${normalized}%`} accessibilityValue={{ min: 0, max: 100, now: normalized, text: `${normalized}%` }} onLayout={measureTrack} {...responder.panHandlers} style={[appearanceStyles.sliderTrack, { backgroundColor: palette.elevated }]}><View pointerEvents="none" style={[appearanceStyles.sliderFill, { width: `${normalized}%`, backgroundColor: palette.primary }]} /><View pointerEvents="none" style={[appearanceStyles.sliderThumb, { left: `${normalized}%`, transform: [{ translateX: -11 }], backgroundColor: palette.surface, borderColor: palette.primary }]} /></View><View style={appearanceStyles.sliderMarks}>{[0, 25, 50, 75, 100].map((mark) => <Text key={mark} style={[appearanceStyles.sliderMark, { color: palette.muted }]}>{mark}%</Text>)}</View><Text style={[appearanceStyles.sliderHint, { color: palette.muted }]}>{t("タップ・スライドとも10%単位で反映されます", "Tap or slide to apply in 10% steps")}</Text></View>;
}

function WidgetsPanel({ english, displaySettings, onBackgroundOpacity, onCardOpacity }: { english: boolean; displaySettings: DisplaySettings; onBackgroundOpacity: (value: number) => void; onCardOpacity: (value: number) => void }) {
  const t = (ja: string, en: string) => english ? en : ja;
  const palette = useFocusPalette();
  return <>
    <SectionTitle title={t("ホーム画面ウィジェット", "Home screen widget")} detail={t("テーマと文字はアプリ本体に連動します。透過率はWidgetだけで調整できます。", "Theme and type follow the app. Opacity can be adjusted for the widget.")} />
    <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}><View style={appearanceStyles.widgetFollowRow}><View style={[styles.selectorIcon, { backgroundColor: palette.primarySoft }]}><MaterialIcons name="palette" size={20} color={palette.primary} /></View><View style={styles.selectorCopy}><Text style={[styles.selectorTitle, { color: palette.text }]}>{t("本体のテーマを使用", "Follow app theme")}</Text><Text style={[styles.selectorDetail, { color: palette.muted }]}>{english ? APP_THEMES[resolvedAppTheme(displaySettings)].label.en : APP_THEMES[resolvedAppTheme(displaySettings)].label.ja}</Text></View><MaterialIcons name="link" size={20} color={palette.muted} /></View><View style={[styles.widgetEditor, { borderTopColor: palette.border }]}><OpacitySlider english={english} label={t("背景とタイトル", "Background & title")} detail={t("Widget全体とタイトル行に同じ透過率を使います", "Used by the whole widget and its title row")} value={displaySettings.widgetBackgroundOpacity ?? displaySettings.widgetOpacity ?? 86} onChange={onBackgroundOpacity} /><OpacitySlider english={english} label={t("項目の背景", "Item row background")} detail={t("Todo・習慣の行だけを独立して調整します", "Adjusts Todo and Habit rows separately")} value={displaySettings.widgetCardOpacity ?? 100} onChange={onCardOpacity} /></View></View>
  </>;
}


function PlusPanel({ english, isIOS, isPlus, price, status, reason, themeSetName, themeSets, onNameChange, onSaveSet, onApplySet, onRemoveSet, onPurchase, onRestore, onRefresh, onManage }: { english: boolean; isIOS: boolean; isPlus: boolean; price?: string; status: string; reason?: string; themeSetName: string; themeSets: SavedThemeSet[]; onNameChange: (value: string) => void; onSaveSet: () => void; onApplySet: (set: SavedThemeSet) => void; onRemoveSet: (id: string) => void; onPurchase: () => void; onRestore: () => void; onRefresh: () => void; onManage: () => void }) {
  const t = (ja: string, en: string) => english ? en : ja;
  const storeName = isIOS ? "App Store" : "Google Play";
  return <><InfoCard icon="workspace-premium" title={isPlus ? t("Plusを利用中です", "Plus is active") : t("必要になったらPlusへ", "Upgrade only when useful")} detail={isPlus ? t("件数の上限がなく、現在の見た目をテーマセットとして保存できます。", "Item limits are removed and you can save theme sets.") : t("無料版はTodo・習慣・メモを各2件、制限対象アプリを5件まで使えます。", "Free includes 2 tasks, habits, and notes each plus 5 limited apps.")} />
    <View style={styles.card}><View style={styles.planGrid}><PlanColumn title={t("無料", "Free")} features={[t("Todo・習慣・メモ 各2件", "2 tasks, habits & notes"), t("制限アプリ 5件", "5 limited apps"), t("言語・表示・文字", "Language, look & type")]} /><PlanColumn title="Plus" highlighted features={[t("すべて無制限", "Unlimited items"), t("テーマセットの保存", "Saved theme sets"), t("早期完了は別の商品", "Early completion is separate")]} /></View>{isPlus ? <View style={styles.inlineActions}><TouchableOpacity onPress={onManage} style={styles.smallButton}><Text style={styles.smallButtonText}>{t("管理", "Manage")}</Text></TouchableOpacity><TouchableOpacity onPress={onRestore} style={styles.textAction}><Text style={styles.textActionLabel}>{t("購入を復元", "Restore purchases")}</Text></TouchableOpacity></View> : status === "eligible" ? <><TouchableOpacity onPress={onPurchase} style={styles.primaryButton}><Text style={styles.primaryButtonText}>{price ? t(`${price} でPlusを開始`, `Get Plus for ${price}`) : t("Plusを開始", "Get Plus")}</Text></TouchableOpacity><TouchableOpacity onPress={onRestore} style={styles.textButton}><Text style={styles.textButtonLabel}>{t("以前の購入を復元", "Restore previous purchase")}</Text></TouchableOpacity></> : <><Text style={styles.mutedCopy}>{reason === "NATIVE_BUILD_REQUIRED" ? t(`${storeName}からインストールしたFocus Flowで購入できます。`, `Purchases are available in the Focus Flow build installed from ${storeName}.`) : t("ストアの商品情報を確認できません。商品登録後に再確認してください。", "Store product information is unavailable. Check again after product setup.")}</Text><TouchableOpacity onPress={onRefresh} style={styles.smallButton}><Text style={styles.smallButtonText}>{t("ストア情報を再確認", "Check store status")}</Text></TouchableOpacity></>}</View>
    {isPlus ? <><SectionTitle title={t("テーマセット", "Theme sets")} detail={t("今の配色・文字・ウィジェット設定を名前付きで保存します。", "Save the current colors, type, and widgets under a name.")} /><View style={styles.card}><View style={styles.composer}><TextInput value={themeSetName} onChangeText={onNameChange} placeholder={t("例：平日の集中", "e.g., Weekday focus")} placeholderTextColor="#8B9992" style={styles.themeInput} /><TouchableOpacity onPress={onSaveSet} style={styles.smallButton}><Text style={styles.smallButtonText}>{t("保存", "Save")}</Text></TouchableOpacity></View>{themeSets.map((set) => <View key={set.id} style={styles.savedSet}><TouchableOpacity onPress={() => onApplySet(set)} style={styles.savedSetCopy}><Text style={styles.savedSetName}>{set.name}</Text><Text style={styles.selectorDetail}>{english ? APP_THEMES[set.appTheme].label.en : APP_THEMES[set.appTheme].label.ja}</Text></TouchableOpacity><TouchableOpacity onPress={() => onRemoveSet(set.id)}><MaterialIcons name="close" size={19} color={COLORS.error} /></TouchableOpacity></View>)}</View></> : null}</>;
}

function PanelHeader({ title, onBack }: { title: string; onBack: () => void }) { const palette = useFocusPalette(); return <View style={styles.panelHeader}><TouchableOpacity onPress={onBack} accessibilityLabel="Back" style={[styles.backControl, { backgroundColor: palette.primarySoft }]}><MaterialIcons name="arrow-back" size={22} color={palette.primary} /></TouchableOpacity><Text style={[styles.panelTitle, { color: palette.text }]}>{title}</Text></View>; }
function SettingsEntry({ icon, tint, color, title, detail, badge, onPress }: { icon: React.ComponentProps<typeof MaterialIcons>["name"]; tint: string; color: string; title: string; detail: string; badge?: string; onPress: () => void }) { const palette = useFocusPalette(); return <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${title}: ${detail}`} onPress={onPress} style={[styles.entry, { backgroundColor: palette.surface, borderColor: palette.border }]}><View style={[styles.entryIcon, { backgroundColor: palette.isDark ? palette.elevated : tint }]}><MaterialIcons name={icon} size={22} color={color === COLORS.forest ? palette.primary : color} /></View><View style={styles.entryCopy}><View style={styles.entryTitleRow}><Text style={[styles.entryTitle, { color: palette.text }]}>{title}</Text>{badge ? <Text style={[styles.entryBadge, { color: COLORS.warning, backgroundColor: palette.primarySoft }]}>{badge}</Text> : null}</View><Text style={[styles.entryDetail, { color: palette.muted }]} numberOfLines={2}>{detail}</Text></View><MaterialIcons name="chevron-right" size={23} color={palette.muted} /></TouchableOpacity>; }
function SectionTitle({ title, detail }: { title: string; detail?: string }) { const palette = useFocusPalette(); return <View style={styles.sectionTitleWrap}><Text style={[styles.sectionTitle, { color: palette.text }]}>{title}</Text>{detail ? <Text style={[styles.sectionDetail, { color: palette.muted }]}>{detail}</Text> : null}</View>; }
function InfoCard({ icon, title, detail }: { icon: React.ComponentProps<typeof MaterialIcons>["name"]; title: string; detail: string }) { const palette = useFocusPalette(); return <View style={[styles.infoCard, { backgroundColor: palette.primarySoft, borderColor: palette.border }]}><View style={[styles.infoIcon, { backgroundColor: palette.elevated }]}><MaterialIcons name={icon} size={22} color={palette.primary} /></View><View style={styles.infoCopy}><Text style={[styles.infoTitle, { color: palette.text }]}>{title}</Text><Text style={[styles.infoDetail, { color: palette.muted }]}>{detail}</Text></View></View>; }
function SettingRow({ title, detail, control }: { title: string; detail: string; control: React.ReactNode }) { const palette = useFocusPalette(); return <View style={[styles.settingRow, { borderBottomColor: palette.border }]}><View style={styles.settingCopy}><Text style={[styles.settingTitle, { color: palette.text }]}>{title}</Text><Text style={[styles.settingDetail, { color: palette.muted }]}>{detail}</Text></View>{control}</View>; }
function appSelectionRowHeight(fontScale: DisplaySettings["fontScale"]) { return fontScale === "large" ? 92 : fontScale === "compact" ? 72 : 82; }
const AppSelectionRow = memo(function AppSelectionRow({ app, selected, onPress, selectable = true, blockedByLimit = false }: { app: LaunchableApp; selected: boolean; onPress?: () => void; selectable?: boolean; blockedByLimit?: boolean }) {
  const palette = useFocusPalette();
  const { displaySettings } = useFocusFlow();
  const rowHeight = appSelectionRowHeight(displaySettings.fontScale);
  const appInitial = (app.label.trim() || app.packageName.trim() || "?").slice(0, 1).toLocaleUpperCase();
  const content = <>
    <View style={[appSelectionStyles.appTile, { backgroundColor: selected ? palette.primary : palette.primarySoft }]}><Text style={[appSelectionStyles.appTileLabel, { color: selected ? (palette.isDark ? palette.background : COLORS.white) : palette.primary }]}>{appInitial}</Text></View>
    <View style={appSelectionStyles.copy}><Text style={[appSelectionStyles.name, { color: palette.text }]} numberOfLines={1}>{app.label}</Text><Text style={[appSelectionStyles.packageName, { color: palette.muted }]} numberOfLines={1}>{app.packageName}</Text></View>
    {selectable ? blockedByLimit ? <View style={appSelectionStyles.state}><MaterialIcons name="lock-outline" size={17} color={palette.muted} /><Text style={[appSelectionStyles.stateText, { color: palette.muted }]}>上限</Text></View> : <MaterialIcons name={selected ? "check-circle" : "radio-button-unchecked"} size={22} color={selected ? palette.primary : palette.muted} /> : <View style={appSelectionStyles.state}><MaterialIcons name="lock" size={17} color={palette.primary} /><Text style={[appSelectionStyles.stateText, { color: palette.primary }]}>制限中</Text></View>}
  </>;
  const rowStyle = [appSelectionStyles.row, { height: rowHeight, backgroundColor: selected ? palette.primarySoft : palette.surface, borderBottomColor: palette.border }];
  return selectable ? <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: selected, disabled: blockedByLimit }} accessibilityLabel={`${app.label} ${selected ? "選択中" : "未選択"}`} onPress={onPress} style={rowStyle}>{content}</TouchableOpacity> : <View style={rowStyle}>{content}</View>;
});
function AppPicker({ apps, loading, selected, onSelect, canSelect, english }: { apps: LaunchableApp[]; loading: boolean; selected: string[]; onSelect: (value: string) => void; canSelect: (value: string) => boolean; english: boolean }) {
  const t = (ja: string, en: string) => english ? en : ja;
  const palette = useFocusPalette();
  const { displaySettings } = useFocusFlow();
  const rowHeight = appSelectionRowHeight(displaySettings.fontScale);
  const [query, setQuery] = useState("");
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const visible = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    const matching = apps.filter((app) => !normalized || app.label.toLocaleLowerCase().includes(normalized) || app.packageName.toLocaleLowerCase().includes(normalized));
    return [...matching.filter((app) => selectedSet.has(app.packageName)), ...matching.filter((app) => !selectedSet.has(app.packageName))];
  }, [apps, query, selectedSet]);
  const renderItem = useCallback(({ item }: { item: LaunchableApp }) => {
    const active = selectedSet.has(item.packageName);
    return <AppSelectionRow app={item} selected={active} blockedByLimit={!active && !canSelect(item.packageName)} onPress={() => onSelect(item.packageName)} />;
  }, [canSelect, onSelect, selectedSet]);
  const getItemLayout = useCallback((_data: ArrayLike<LaunchableApp> | null | undefined, index: number) => ({ length: rowHeight, offset: rowHeight * index, index }), [rowHeight]);
  if (loading) return <View style={styles.loading}><ActivityIndicator color={palette.primary} /><Text style={[styles.mutedCopy, { color: palette.muted }]}>{t("アプリ一覧を読み込んでいます", "Loading apps")}</Text></View>;
  if (!apps.length) return <Text style={[styles.mutedCopy, { color: palette.muted }]}>{t("選択できるアプリを取得できませんでした。", "Available apps could not be loaded.")}</Text>;
  return <View style={[styles.appList, { borderTopColor: palette.border }]}>
    <TextInput value={query} onChangeText={setQuery} placeholder={t("アプリ名またはパッケージ名で検索", "Search apps or package names")} placeholderTextColor={palette.muted} style={[styles.nameInput, { color: palette.text, backgroundColor: palette.elevated, borderColor: palette.border }]} />
    {visible.length ? <FlatList data={visible} renderItem={renderItem} keyExtractor={(item) => item.packageName} style={[appSelectionStyles.list, { maxHeight: rowHeight * 5 }]} contentContainerStyle={appSelectionStyles.listContent} initialNumToRender={10} maxToRenderPerBatch={10} windowSize={5} removeClippedSubviews={Platform.OS === "android"} nestedScrollEnabled keyboardShouldPersistTaps="handled" getItemLayout={getItemLayout} /> : <Text style={[styles.mutedCopy, { color: palette.muted }]}>{t("一致するアプリがありません。", "No matching apps.")}</Text>}
  </View>;
}
function SelectedApps({ apps, selected, english }: { apps: LaunchableApp[]; selected: string[]; english: boolean }) { const t = (ja: string, en: string) => english ? en : ja; const palette = useFocusPalette(); return <><SectionTitle title={t("選択中のアプリ", "Selected apps")} detail={t("この一覧のアプリが制限対象です。", "These apps are included in your limits.")} /><View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>{selected.map((packageName) => <AppSelectionRow key={packageName} app={apps.find((candidate) => candidate.packageName === packageName) ?? { label: packageName, packageName }} selected selectable={false} />)}</View></>; }
function RoutineEditor({ schedule, expanded, apps, loading, english, onToggle, onChange, onRemove }: { schedule: GateSchedule; expanded: boolean; apps: LaunchableApp[]; loading: boolean; english: boolean; onToggle: () => void; onChange: (input: Partial<GateSchedule>) => void; onRemove: () => void }) { const t = (ja: string, en: string) => english ? en : ja; const [appsOpen, setAppsOpen] = useState(false); const packages = schedule.blockedPackages ?? []; return <View style={styles.routine}><TouchableOpacity onPress={onToggle} style={styles.selectorRow}><View style={styles.selectorIcon}><MaterialIcons name="schedule" size={20} color={COLORS.forest} /></View><View style={styles.selectorCopy}><Text style={styles.selectorTitle}>{schedule.label}</Text><Text style={styles.selectorDetail}>{formatDays(schedule.days, english)} · {schedule.startTime}–{schedule.endTime}</Text></View><Switch value={schedule.enabled} onValueChange={(enabled) => onChange({ enabled })} trackColor={{ false: "#CCD7D1", true: "#91C3B3" }} thumbColor={schedule.enabled ? COLORS.forest : "#F7F8F5"} /></TouchableOpacity>{expanded ? <View style={styles.routineEditor}><TextInput value={schedule.label} onChangeText={(label) => onChange({ label })} style={styles.nameInput} placeholder={t("日課の名前", "Routine name")} /><View style={styles.dayPicker}>{["日", "月", "火", "水", "木", "金", "土"].map((label, index) => <TouchableOpacity key={`${label}-${index}`} onPress={() => onChange({ days: toggleNumber(schedule.days, index) })} style={[styles.dayChip, schedule.days.includes(index) && styles.dayChipSelected]}><Text style={[styles.dayChipText, schedule.days.includes(index) && styles.dayChipTextSelected]}>{english ? ["S", "M", "T", "W", "T", "F", "S"][index] : label}</Text></TouchableOpacity>)}</View><View style={styles.timeRow}><TimeStepper value={schedule.startTime} english={english} label={t("開始", "Start")} onChange={(startTime) => onChange({ startTime })} /><TimeStepper value={schedule.endTime} english={english} label={t("終了", "End")} onChange={(endTime) => onChange({ endTime })} /></View><TouchableOpacity onPress={() => setAppsOpen((value) => !value)} style={styles.textAction}><Text style={styles.textActionLabel}>{appsOpen ? t("この時間帯のアプリ選択を閉じる", "Hide schedule app selection") : t("この時間帯だけに追加するアプリ", "Add apps for this schedule only")}</Text></TouchableOpacity>{appsOpen ? <RoutineAppPicker apps={apps} loading={loading} selected={packages} english={english} onChange={(blockedPackages) => onChange({ blockedPackages })} /> : null}<TouchableOpacity onPress={onRemove} style={styles.deleteAction}><Text style={styles.deleteActionLabel}>{t("この時間帯を削除", "Delete this schedule")}</Text></TouchableOpacity></View> : null}</View>; }
function RoutineAppPicker({ apps, loading, selected, onChange }: { apps: LaunchableApp[]; loading: boolean; selected: string[]; english: boolean; onChange: (value: string[]) => void }) { const palette = useFocusPalette(); const { displaySettings } = useFocusFlow(); const rowHeight = appSelectionRowHeight(displaySettings.fontScale); const selectedSet = useMemo(() => new Set(selected), [selected]); const toggleApp = useCallback((packageName: string) => onChange(selectedSet.has(packageName) ? selected.filter((item) => item !== packageName) : [...selected, packageName]), [onChange, selected, selectedSet]); const renderItem = useCallback(({ item }: { item: LaunchableApp }) => <AppSelectionRow app={item} selected={selectedSet.has(item.packageName)} onPress={() => toggleApp(item.packageName)} />, [selectedSet, toggleApp]); const getItemLayout = useCallback((_data: ArrayLike<LaunchableApp> | null | undefined, index: number) => ({ length: rowHeight, offset: rowHeight * index, index }), [rowHeight]); if (loading) return <View style={styles.loading}><ActivityIndicator color={palette.primary} /></View>; return <View style={[styles.appList, { borderTopColor: palette.border }]}><FlatList data={apps} renderItem={renderItem} keyExtractor={(item) => item.packageName} style={[appSelectionStyles.list, { maxHeight: rowHeight * 4 }]} initialNumToRender={8} maxToRenderPerBatch={8} windowSize={5} removeClippedSubviews={Platform.OS === "android"} nestedScrollEnabled keyboardShouldPersistTaps="handled" getItemLayout={getItemLayout} /></View>; }
function ThemeChoice({ theme, selected, english, palette, onPress }: { theme: AppThemeId; selected: boolean; english: boolean; palette: AppPalette; onPress: () => void }) { const definition = APP_THEMES[theme]; return <TouchableOpacity onPress={onPress} style={[styles.themeChoice, { backgroundColor: selected ? palette.primarySoft : palette.surface, borderColor: selected ? palette.primary : palette.border }]}><View style={[styles.themeSwatch, { backgroundColor: definition.light.background, borderColor: definition.light.border }]}><View style={[styles.themeAccent, { backgroundColor: definition.light.primary }]} /></View><Text style={[styles.choiceLabel, { color: palette.text }]}>{english ? definition.label.en : definition.label.ja}</Text></TouchableOpacity>; }
function AppearancePreview({ english, displaySettings }: { english: boolean; displaySettings: DisplaySettings }) { const palette = useFocusPalette(); return <View style={[appearanceStyles.appearancePreview, { backgroundColor: palette.elevated, borderColor: palette.border }]}><View style={appearanceStyles.previewTop}><View style={[appearanceStyles.previewIcon, { backgroundColor: palette.primarySoft }]}><MaterialIcons name="check" size={17} color={palette.primary} /></View><View><Text style={[appearanceStyles.previewTitle, { color: palette.text }]}>{english ? "Today" : "今日"}</Text><Text style={[appearanceStyles.previewDetail, { color: palette.muted }]}>{english ? "Theme preview" : "テーマの見本"}</Text></View></View><View style={[appearanceStyles.previewCard, { backgroundColor: palette.surface }]}><View style={[appearanceStyles.previewCheck, { borderColor: palette.primary }]} /><View style={[appearanceStyles.previewLine, { backgroundColor: palette.elevated }]} /></View></View>; }
function FontChoice({ item, selected, english, palette, onPress }: { item: (typeof APP_FONT_OPTIONS)[number]; selected: boolean; english: boolean; palette: AppPalette; onPress: () => void }) { return <TouchableOpacity onPress={onPress} style={[appearanceStyles.fontChoice, { backgroundColor: selected ? palette.primarySoft : palette.surface, borderColor: selected ? palette.primary : palette.border }]}><View style={appearanceStyles.fontChoiceCopy}><Text style={[styles.fontSample, { color: palette.text }, getAppFontStyle(item.id)]}>{english ? item.sample.en : item.sample.ja}</Text><Text style={[styles.choiceLabel, { color: palette.text }]}>{english ? item.label.en : item.label.ja}</Text></View>{selected ? <MaterialIcons name="check-circle" size={20} color={palette.primary} /> : <MaterialIcons name="radio-button-unchecked" size={20} color={palette.muted} />}</TouchableOpacity>; }
function Segmented({ options, selected, onSelect }: { options: { key: string; label: string }[]; selected: string; onSelect: (value: string) => void }) { const palette = useFocusPalette(); return <View style={styles.segmented}>{options.map((option) => { const active = selected === option.key; return <TouchableOpacity key={option.key} onPress={() => onSelect(option.key)} style={[styles.segment, { backgroundColor: active ? palette.primary : palette.elevated }]}><Text style={[styles.segmentText, { color: active ? (palette.isDark ? palette.background : COLORS.white) : palette.muted }]}>{option.label}</Text></TouchableOpacity>; })}</View>; }
function TimeStepper({ value, label, english, onChange }: { value: string; label?: string; english: boolean; onChange: (value: string) => void }) { return <View style={styles.timeStepWrap}>{label ? <Text style={styles.microLabel}>{label}</Text> : null}<View style={styles.timeStepper}><TouchableOpacity onPress={() => onChange(stepTime(value, -30))} style={styles.timeControl}><MaterialIcons name="remove" size={18} color={COLORS.forest} /></TouchableOpacity><Text style={styles.timeValue}>{value}</Text><TouchableOpacity onPress={() => onChange(stepTime(value, 30))} style={styles.timeControl}><MaterialIcons name="add" size={18} color={COLORS.forest} /></TouchableOpacity></View></View>; }
function PlanColumn({ title, features, highlighted = false }: { title: string; features: string[]; highlighted?: boolean }) { return <View style={[styles.planColumn, highlighted && styles.planColumnPlus]}><Text style={styles.planTitle}>{title}</Text>{features.map((feature) => <View key={feature} style={styles.planFeature}><MaterialIcons name={highlighted ? "all-inclusive" : "check"} size={14} color={highlighted ? COLORS.forest : "#547267"} /><Text style={styles.planFeatureText}>{feature}</Text></View>)}</View>; }
function stepTime(value: string, amount: number) { const [hours, minutes] = value.split(":").map(Number); const total = (((hours * 60 + minutes + amount) % 1440) + 1440) % 1440; return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`; }
function toggleNumber(values: number[], value: number) { return values.includes(value) ? values.filter((item) => item !== value) : [...values, value].sort(); }
function formatDays(days: number[], english: boolean) { const labels = english ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] : ["日", "月", "火", "水", "木", "金", "土"]; if (days.length === 7) return english ? "Every day" : "毎日"; if ([1, 2, 3, 4, 5].every((day) => days.includes(day)) && days.length === 5) return english ? "Weekdays" : "平日"; return labels.filter((_, index) => days.includes(index)).join(english ? ", " : "・") || (english ? "Choose days" : "曜日を選択"); }

const styles = StyleSheet.create({
  homeContent: { paddingTop: 16, paddingBottom: 34 }, detailContent: { paddingTop: 16 }, homeLead: { color: COLORS.muted, fontSize: 13, lineHeight: 19, marginTop: -8, marginBottom: 16 }, entry: { minHeight: 88, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, padding: 14, marginBottom: 10 }, entryIcon: { width: 46, height: 46, alignItems: "center", justifyContent: "center", borderRadius: 15 }, entryCopy: { flex: 1, minWidth: 0 }, entryTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 }, entryTitle: { color: COLORS.text, fontSize: 16, lineHeight: 22, fontWeight: "800" }, entryBadge: { color: "#9A6411", backgroundColor: "#FFF1D7", borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, fontSize: 10, fontWeight: "800" }, entryDetail: { color: COLORS.muted, fontSize: 12, lineHeight: 17, marginTop: 3 }, supportLinks: { flexDirection: "row", justifyContent: "center", gap: 18, paddingVertical: 17 }, supportLink: { color: COLORS.forest, fontSize: 12, fontWeight: "800" }, panelHeader: { minHeight: 43, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }, backControl: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#E5F2ED" }, panelTitle: { color: COLORS.text, fontSize: 23, lineHeight: 30, fontWeight: "900" }, infoCard: { flexDirection: "row", gap: 11, alignItems: "flex-start", backgroundColor: "#E8F4EF", borderWidth: 1, borderColor: "#C3E0D5", borderRadius: 19, padding: 14, marginBottom: 17 }, infoIcon: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: "#D5ECE2" }, infoCopy: { flex: 1, minWidth: 0 }, infoTitle: { color: "#18483D", fontSize: 15, lineHeight: 21, fontWeight: "900" }, infoDetail: { color: "#3D665B", fontSize: 12, lineHeight: 18, marginTop: 3 }, sectionTitleWrap: { marginTop: 20, marginBottom: 8 }, sectionTitle: { color: COLORS.text, fontSize: 17, lineHeight: 23, fontWeight: "900" }, sectionDetail: { color: COLORS.muted, fontSize: 12, lineHeight: 17, marginTop: 3 }, card: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 19, paddingHorizontal: 14 }, settingRow: { minHeight: 76, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, borderBottomColor: "#EEF2EF" }, settingCopy: { flex: 1, minWidth: 0 }, settingTitle: { color: COLORS.text, fontSize: 14, lineHeight: 20, fontWeight: "800" }, settingDetail: { color: COLORS.muted, fontSize: 11, lineHeight: 16, marginTop: 3 }, compactStatus: { flexDirection: "row", gap: 7, alignItems: "flex-start", borderRadius: 12, backgroundColor: "#F2F7F4", padding: 10, marginTop: 13 }, compactStatusText: { flex: 1, color: "#4F6860", fontSize: 11, lineHeight: 16, fontWeight: "700" }, inlineActions: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 }, primaryButton: { minHeight: 48, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.forest, borderRadius: 13, marginTop: 14, paddingHorizontal: 12 }, primaryButtonText: { color: COLORS.white, fontSize: 13, fontWeight: "900" }, smallButton: { minHeight: 36, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.blue, borderRadius: 11, paddingHorizontal: 11 }, smallButtonText: { color: COLORS.white, fontSize: 12, fontWeight: "800" }, textAction: { minHeight: 36, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 }, textActionLabel: { color: COLORS.forest, fontSize: 12, fontWeight: "800" }, selectorRow: { minHeight: 70, flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 11 }, selectorIcon: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: "#E5F2ED" }, selectorCopy: { flex: 1, minWidth: 0 }, selectorTitle: { color: COLORS.text, fontSize: 14, lineHeight: 19, fontWeight: "800" }, selectorDetail: { color: COLORS.muted, fontSize: 11, lineHeight: 16, marginTop: 2 }, loading: { minHeight: 76, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }, mutedCopy: { color: COLORS.muted, fontSize: 12, lineHeight: 18, paddingVertical: 12 }, appList: { borderTopWidth: 1, borderTopColor: "#EEF2EF", paddingBottom: 4 }, appRow: { minHeight: 54, flexDirection: "row", alignItems: "center", gap: 10, borderBottomWidth: 1, borderBottomColor: "#EEF2EF" }, check: { width: 23, height: 23, alignItems: "center", justifyContent: "center", borderRadius: 8, borderWidth: 1.4, borderColor: "#B6C5BD" }, checkSelected: { backgroundColor: COLORS.forest, borderColor: COLORS.forest }, appCopy: { flex: 1, minWidth: 0 }, appName: { color: COLORS.text, flex: 1, fontSize: 13, lineHeight: 18, fontWeight: "800" }, appPackage: { color: COLORS.muted, fontSize: 10, marginTop: 1 }, addButton: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }, addButtonText: { color: COLORS.forest, fontSize: 13, fontWeight: "900" }, routine: { borderBottomWidth: 1, borderBottomColor: "#EEF2EF" }, routineEditor: { borderTopWidth: 1, borderTopColor: "#EEF2EF", paddingTop: 12, paddingBottom: 5 }, nameInput: { minHeight: 40, color: COLORS.text, backgroundColor: "#F3F6F4", borderRadius: 11, paddingHorizontal: 11, fontSize: 13, fontWeight: "700" }, dayPicker: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 }, dayChip: { width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: "#EDF2EF" }, dayChipSelected: { backgroundColor: COLORS.forest }, dayChipText: { color: COLORS.muted, fontSize: 12, fontWeight: "800" }, dayChipTextSelected: { color: COLORS.white }, timeRow: { flexDirection: "row", gap: 9, marginTop: 12 }, timeStepWrap: { flex: 1 }, microLabel: { color: COLORS.muted, fontSize: 11, fontWeight: "800", marginTop: 10, marginBottom: 6 }, timeStepper: { minHeight: 39, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#EFF4F1", borderRadius: 11, paddingHorizontal: 4 }, timeControl: { width: 30, height: 30, alignItems: "center", justifyContent: "center", borderRadius: 9, backgroundColor: COLORS.white }, timeValue: { color: COLORS.text, fontSize: 13, fontWeight: "900" }, deleteAction: { minHeight: 42, alignItems: "flex-end", justifyContent: "center" }, deleteActionLabel: { color: COLORS.error, fontSize: 12, fontWeight: "800" }, choiceGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, themeChoice: { width: "31%", minHeight: 70, padding: 8, borderRadius: 13, borderWidth: 1, borderColor: "#D8E2DC", backgroundColor: COLORS.white }, selectedChoice: { borderColor: COLORS.forest, backgroundColor: "#EFF8F3" }, themeSwatch: { height: 25, borderRadius: 8, borderWidth: 1, padding: 4, alignItems: "flex-end", justifyContent: "flex-end" }, themeAccent: { width: 10, height: 10, borderRadius: 4 }, choiceLabel: { color: COLORS.text, fontSize: 11, fontWeight: "800", marginTop: 5 }, segmented: { flexDirection: "row", gap: 6 }, segment: { flex: 1, minHeight: 42, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "#EDF2EF", paddingHorizontal: 4 }, segmentSelected: { backgroundColor: COLORS.forest }, segmentText: { color: COLORS.muted, fontSize: 12, fontWeight: "800" }, segmentTextSelected: { color: COLORS.white }, fontGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, fontChoice: { width: "48.7%", minHeight: 74, borderRadius: 13, borderWidth: 1, borderColor: "#D8E2DC", backgroundColor: COLORS.white, padding: 9 }, fontSample: { color: COLORS.text, fontSize: 17, lineHeight: 24 }, widgetRow: { borderBottomWidth: 1, borderBottomColor: "#EEF2EF" }, widgetEditor: { paddingBottom: 13, borderTopWidth: 1, borderTopColor: "#EEF2EF" }, colorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, colorOption: { width: 37, height: 32, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 2, borderRadius: 10, borderWidth: 1, borderColor: "#D8E2DC" }, colorOptionSelected: { borderColor: COLORS.forest, backgroundColor: "#EFF8F3" }, colorDot: { width: 15, height: 15, borderRadius: 6 }, planGrid: { flexDirection: "row", gap: 8, paddingTop: 14, paddingBottom: 7 }, planColumn: { flex: 1, minWidth: 0, borderRadius: 14, backgroundColor: "#F6F9F7", borderWidth: 1, borderColor: "#DDE6E1", padding: 10 }, planColumnPlus: { backgroundColor: "#EAF6EF", borderColor: "#9FCBB8" }, planTitle: { color: COLORS.text, fontSize: 14, fontWeight: "900" }, planFeature: { flexDirection: "row", alignItems: "flex-start", gap: 4, marginTop: 7 }, planFeatureText: { flex: 1, color: "#4E6960", fontSize: 10, lineHeight: 14, fontWeight: "700" }, composer: { flexDirection: "row", gap: 8, alignItems: "center", paddingVertical: 12 }, themeInput: { flex: 1, minHeight: 40, color: COLORS.text, backgroundColor: "#F3F6F4", borderRadius: 11, paddingHorizontal: 10, fontSize: 13 }, savedSet: { minHeight: 55, flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: "#EEF2EF", gap: 10 }, savedSetCopy: { flex: 1 }, savedSetName: { color: COLORS.text, fontSize: 13, fontWeight: "800" }, modalBackdrop: { flex: 1, backgroundColor: "rgba(18,35,45,0.52)", justifyContent: "center", paddingHorizontal: 20 }, modalCard: { backgroundColor: COLORS.white, borderRadius: 23, padding: 20 }, modalTitle: { color: COLORS.text, fontSize: 20, lineHeight: 27, fontWeight: "900", marginTop: 12 }, modalText: { color: "#46647D", fontSize: 13, lineHeight: 20, marginTop: 9 }, textButton: { minHeight: 42, alignItems: "center", justifyContent: "center", marginTop: 5 }, textButtonLabel: { color: COLORS.muted, fontSize: 13, fontWeight: "800" },
});

const appSelectionStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12 },
  appTile: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 13 },
  appTileLabel: { fontSize: 19, lineHeight: 23, fontWeight: "900" },
  copy: { flex: 1, minWidth: 0, justifyContent: "center" },
  name: { fontSize: 17, lineHeight: 23, fontWeight: "900" },
  packageName: { fontSize: 12, lineHeight: 16, marginTop: 2 },
  list: { maxHeight: 360 },
  listContent: { paddingBottom: 4 },
  state: { width: 60, alignItems: "center", justifyContent: "center", gap: 2 },
  stateText: { fontSize: 10, lineHeight: 13, fontWeight: "800" },
});

const appearanceStyles = StyleSheet.create({
  appearancePreview: { borderWidth: 1, borderRadius: 20, padding: 15, marginBottom: 4 },
  previewTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  previewIcon: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 11 },
  previewTitle: { fontSize: 16, fontWeight: "900" },
  previewDetail: { fontSize: 11, fontWeight: "700", marginTop: 2 },
  previewCard: { height: 38, flexDirection: "row", alignItems: "center", gap: 9, borderRadius: 11, marginTop: 13, paddingHorizontal: 10 },
  previewCheck: { width: 17, height: 17, borderWidth: 1.5, borderRadius: 5 },
  previewLine: { height: 8, flex: 1, borderRadius: 4 },
  fontList: { gap: 8 },
  fontChoice: { width: "100%", minHeight: 66, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 },
  fontChoiceCopy: { flex: 1, minWidth: 0 },
  widgetFollowRow: { minHeight: 70, flexDirection: "row", alignItems: "center", gap: 10 },
  sliderWrap: { paddingTop: 13, paddingBottom: 4 }, sliderHeading: { minHeight: 38, flexDirection: "row", alignItems: "flex-start", gap: 10 }, sliderValue: { fontSize: 18, lineHeight: 23, fontWeight: "900" }, sliderTrack: { height: 8, borderRadius: 4, marginTop: 9, marginHorizontal: 2, justifyContent: "center" }, sliderFill: { position: "absolute", left: 0, height: 8, borderRadius: 4 }, sliderThumb: { position: "absolute", width: 22, height: 22, marginLeft: -11, borderRadius: 11, borderWidth: 2, top: -7 }, sliderMarks: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 }, sliderMark: { fontSize: 10, lineHeight: 13, fontWeight: "700" }, sliderHint: { fontSize: 10, lineHeight: 14, marginTop: 4 },
  completedToggleRow: { minHeight: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, borderBottomWidth: 0 }, completedToggleTitle: { fontSize: 14, lineHeight: 20, fontWeight: "800" }, completedToggleDetail: { fontSize: 11, lineHeight: 16, marginTop: 2, fontWeight: "700" }, opacitySummary: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }, opacityStep: { width: 44, height: 44, borderRadius: 13, borderWidth: 1, alignItems: "center", justifyContent: "center" }, opacityStepText: { fontSize: 21, lineHeight: 24, fontWeight: "700" }, opacityValue: { flex: 1, minWidth: 0, alignItems: "center" }, disabledControl: { opacity: 0.42 }, opacityPresets: { flexDirection: "row", gap: 7 }, opacityPreset: { flex: 1, minHeight: 40, alignItems: "center", justifyContent: "center", borderRadius: 12, borderWidth: 1 }, opacityPresetText: { fontSize: 12, fontWeight: "800" },
});
