import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, Platform, ScrollView, StyleSheet, Switch, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScaledText } from "@/components/focus-flow/scaled-text";
import { COLORS, LoadingScreen, ScreenHeading } from "@/components/focus-flow/ui";
import { ScreenContainer } from "@/components/screen-container";
import { getAccessibilityStatus, getGateDiagnostics, getLaunchableApps, isNativeGateAvailable, openAccessibilitySettings, openAppDetailsSettings, type GateDiagnostics, type LaunchableApp } from "@/lib/focus-flow/android-gate";
import { isEnglish } from "@/lib/focus-flow/i18n";
import { useFocusFlow } from "@/lib/focus-flow/provider";
import { cancelDailyReminder, getReminderPermissionGranted, requestReminderPermission, scheduleDailyReminder, sendReminderTest } from "@/lib/focus-flow/reminders";
import type { AppFontId, AppThemeId, DisplaySettings, GateSchedule, SavedThemeSet, WidgetAccentTheme, WidgetBackgroundTheme, WidgetTextSize, WidgetThemeKind } from "@/lib/focus-flow/types";
import { getGateSummary, isGateTimeActive } from "@/lib/focus-flow/utils";
import { getWidgetTheme, WIDGET_ACCENT_OPTIONS, WIDGET_ACCENT_SWATCH, WIDGET_BACKGROUND_OPTIONS, WIDGET_BACKGROUND_SWATCH, WIDGET_THEME_KINDS } from "@/lib/focus-flow/widget-themes";
import { APPEARANCE_OPTIONS, APP_THEMES, resolvedAppTheme } from "@/lib/focus-flow/app-themes";
import { APP_FONT_OPTIONS, getAppFontStyle } from "@/lib/focus-flow/app-fonts";

const Text = ScaledText;

export default function SettingsScreen() {
  const router = useRouter();
  const { todos, habits, memos, focusSessions, gateConfig, displaySettings, isReady, setGateConfig, canSelectBlockedApp, setDisplaySettings, plusStatus, purchasePlus, restorePlus, refreshPlusStatus, managePlus } = useFocusFlow();
  const [apps, setApps] = useState<LaunchableApp[]>([]);
  const [nativeReady, setNativeReady] = useState(false);
  const [accessibilityEnabled, setAccessibilityEnabled] = useState(false);
  const [diagnostics, setDiagnostics] = useState<GateDiagnostics>();
  const [loadingApps, setLoadingApps] = useState(false);
  const [disclosureOpen, setDisclosureOpen] = useState(false);
  const [reminderPermission, setReminderPermission] = useState(false);
  const [reminderBusy, setReminderBusy] = useState(false);
  const [themeSetName, setThemeSetName] = useState("");
  const english = isEnglish(displaySettings);
  const t = (ja: string, en: string) => english ? en : ja;
  const isIOS = Platform.OS === "ios";
  const summary = useMemo(() => getGateSummary({ todos, habits, memos, focusSessions, gateConfig, displaySettings }, new Date(), english ? "en" : "ja"), [todos, habits, memos, focusSessions, gateConfig, displaySettings, english]);
  const scheduleActive = useMemo(() => isGateTimeActive(gateConfig), [gateConfig]);
  const isPlus = Boolean(displaySettings.plusEntitlement && plusStatus.active);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const load = async () => {
      const available = Platform.OS === "android" && isNativeGateAvailable();
      setNativeReady(available);
      if (!available) return;
      setLoadingApps(true);
      const [status, installed, currentDiagnostics] = await Promise.all([getAccessibilityStatus(), getLaunchableApps(), getGateDiagnostics()]);
      setAccessibilityEnabled(status);
      setApps(installed);
      setDiagnostics(currentDiagnostics);
      setLoadingApps(false);
    };
    void load();
  }, []);

  useEffect(() => {
    void getReminderPermissionGranted().then(setReminderPermission).catch(() => setReminderPermission(false));
  }, []);

  if (!isReady) return <ScreenContainer><LoadingScreen /></ScreenContainer>;

  const selectedApp = (packageName: string) => {
    if (!gateConfig.blockedPackages.includes(packageName) && !canSelectBlockedApp(packageName)) { Alert.alert(t("無料版の上限です", "Free plan limit"), t("制限対象アプリは無料版では5件までです。Plusでは無制限に選べます。", "The free plan allows up to 5 limited apps. Plus removes this limit.")); return; }
    setGateConfig({ blockedPackages: toggleId(gateConfig.blockedPackages, packageName) });
  };
  const refreshAccessibility = async () => { const [status, currentDiagnostics] = await Promise.all([getAccessibilityStatus(), getGateDiagnostics()]); setAccessibilityEnabled(status); setDiagnostics(currentDiagnostics); };
  const acknowledgeAndOpenAccessibility = async () => {
    if (!gateConfig.accessibilityDisclosureAcceptedAt) setGateConfig({ accessibilityDisclosureAcceptedAt: new Date().toISOString() });
    await openAccessibilitySettings();
    setTimeout(() => void refreshAccessibility(), 750);
  };
  const updateSchedule = (id: string, input: Partial<GateSchedule>) => setGateConfig({ schedules: gateConfig.schedules.map((schedule) => schedule.id === id ? { ...schedule, ...input } : schedule) });
  const addSchedule = () => setGateConfig({ schedules: [...gateConfig.schedules, { id: `schedule-${Date.now()}`, label: english ? `New daily rule ${gateConfig.schedules.length + 1}` : `新しい日課ルール ${gateConfig.schedules.length + 1}`, enabled: true, days: [1, 2, 3, 4, 5], startTime: "09:00", endTime: "18:00", requiredTodoIds: [], requiredHabitIds: [], blockedPackages: [] }] });
  const removeSchedule = (id: string) => setGateConfig({ schedules: gateConfig.schedules.filter((schedule) => schedule.id !== id) });
  const setGateEnabled = (enabled: boolean) => {
    if (enabled && isIOS) return;
    if (enabled && !gateConfig.accessibilityDisclosureAcceptedAt) {
      setDisclosureOpen(true);
      return;
    }
    setGateConfig({ enabled });
  };
  const acceptDisclosureAndEnableGate = () => {
    setGateConfig({ enabled: true, accessibilityDisclosureAcceptedAt: new Date().toISOString() });
    setDisclosureOpen(false);
  };
  const updateReminderTime = async (time: string) => {
    setDisplaySettings({ dailyReminderTime: time });
    if (!displaySettings.dailyReminderEnabled) return;
    setReminderBusy(true);
    const scheduled = await scheduleDailyReminder({ english, time });
    setReminderPermission(scheduled);
    setReminderBusy(false);
  };
  const toggleReminder = async (enabled: boolean) => {
    if (Platform.OS === "web") return;
    setReminderBusy(true);
    if (!enabled) {
      await cancelDailyReminder();
      setDisplaySettings({ dailyReminderEnabled: false });
      setReminderBusy(false);
      return;
    }
    const permitted = await requestReminderPermission();
    setReminderPermission(permitted);
    if (permitted) {
      const scheduled = await scheduleDailyReminder({ english, time: displaySettings.dailyReminderTime ?? "19:00" });
      setDisplaySettings({ dailyReminderEnabled: scheduled });
    }
    setReminderBusy(false);
  };
  const testReminder = async () => {
    setReminderBusy(true);
    const sent = await sendReminderTest(english);
    setReminderPermission(sent || reminderPermission);
    setReminderBusy(false);
  };
  const setWidgetTheme = (kind: WidgetThemeKind, input: Partial<{ background: WidgetBackgroundTheme; accent: WidgetAccentTheme }>) => {
    const current = getWidgetTheme(displaySettings, kind);
    setDisplaySettings({ widgetThemes: { ...(displaySettings.widgetThemes ?? {}), [kind]: { ...current, ...input } } });
  };
  const resetWidgetTheme = (kind: WidgetThemeKind) => {
    const themes = { ...(displaySettings.widgetThemes ?? {}) };
    delete themes[kind];
    setDisplaySettings({ widgetThemes: themes });
  };
  const setWidgetTextSize = (kind: WidgetThemeKind, textSize: WidgetTextSize) => setDisplaySettings({ widgetTextSizes: { ...(displaySettings.widgetTextSizes ?? {}), [kind]: textSize } });
  const saveThemeSet = () => {
    if (!isPlus) return;
    const name = themeSetName.trim();
    if (!name) return;
    const set: SavedThemeSet = { id: `theme-set-${Date.now()}`, name: name.slice(0, 32), appTheme: resolvedAppTheme(displaySettings), appearance: displaySettings.appearance ?? "system", fontFamily: displaySettings.fontFamily ?? "system", widgetThemes: displaySettings.widgetThemes ?? {}, widgetTextSizes: displaySettings.widgetTextSizes ?? {} };
    setDisplaySettings({ savedThemeSets: [...(displaySettings.savedThemeSets ?? []), set] });
    setThemeSetName("");
  };
  const applyThemeSet = (set: SavedThemeSet) => {
    if (!isPlus) return;
    setDisplaySettings({ appTheme: set.appTheme, appearance: set.appearance, fontFamily: set.fontFamily ?? "system", widgetThemes: set.widgetThemes, widgetTextSizes: set.widgetTextSizes });
  };
  const removeThemeSet = (id: string) => setDisplaySettings({ savedThemeSets: (displaySettings.savedThemeSets ?? []).filter((set) => set.id !== id) });

  return (
    <ScreenContainer className="px-5" containerClassName="bg-background">
      <Modal visible={disclosureOpen} transparent animationType="fade" onRequestClose={() => setDisclosureOpen(false)}>
        <View style={styles.modalBackdrop}><View style={styles.modalCard}><ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.modalIcon}><MaterialIcons name="privacy-tip" size={23} color="#215B83" /></View>
          <Text style={styles.modalTitle}>{english ? "Before you turn on a focus rule" : "集中ルールを有効にする前に"}</Text>
          <Text style={styles.modalText}>{english ? "Focus Flow only detects when a selected app comes to the foreground and applies your chosen rule when must-dos remain. It does not read screen text, messages, typed content, or screenshots, and it does not send your tasks, notes, or app activity off this device." : "Focus Flowは、選択したアプリが前面に開いたことだけを検知し、未完了の必須項目がある場合に集中ルールを適用します。画面の文字、メッセージ、入力内容、スクリーンショットは読み取りません。Todo、メモ、アプリの利用状況を端末外へ送信しません。"}</Text>
          <Text style={styles.modalText}>{english ? "This optional feature can be turned off anytime in Android settings." : "この機能は任意です。Androidの設定からいつでも無効にできます。"}</Text>
          {!english ? <Text style={styles.modalEnglish}>Focus Flow only detects when a selected app comes to the foreground to apply your chosen rule. It does not read screen text, messages, typed content, or screenshots, and does not send your tasks, notes, or app activity off-device. You can turn it off anytime in Android settings.</Text> : null}
          <TouchableOpacity accessibilityRole="button" onPress={acceptDisclosureAndEnableGate} style={styles.modalPrimary}><Text style={styles.modalPrimaryText}>{english ? "I understand — turn on App limits" : "内容を理解して集中ルールをオンにする"}</Text></TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={() => setDisclosureOpen(false)} style={styles.modalSecondary}><Text style={styles.modalSecondaryText}>{english ? "Not now" : "今は設定しない"}</Text></TouchableOpacity>
        </ScrollView></View></View>
      </Modal>
      <FlatList
        data={[]}
        renderItem={() => null}
        keyExtractor={() => "settings"}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(88, insets.bottom + 48) }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <ScreenHeading eyebrow={t("自分に合わせる", "Make it yours")} title={t("設定", "Settings")} />

            {isIOS ? <View style={styles.iosInfoCard}><View style={styles.iosInfoIcon}><MaterialIcons name="phone-iphone" size={23} color="#215B83" /></View><View style={styles.iosInfoCopy}><Text style={styles.iosInfoTitle}>{t("iPhoneでは計画機能をそのまま使えます", "Focus Flow on iPhone")}</Text><Text style={styles.iosInfoText}>{t("Todo・習慣・時間管理・日課・通知・振り返り・外観設定は、追加の端末権限なしで使えます。アプリ制限とアクセシビリティ設定はAndroid版だけの機能です。", "Tasks, habits, timed items, routines, reminders, reviews, and appearance settings work without extra device permission. App limits and Accessibility are Android-only features.")}</Text></View></View> : null}

            {!isIOS ? <>
            <SectionLabel title={t("集中ルール", "App limits")} detail={isPlus ? t("Plusでは制限対象アプリを無制限に選べます。", "Plus allows unlimited limited apps.") : t("無料版では制限対象アプリを5件まで選べます。Plusでは無制限です。", "The free plan allows 5 limited apps. Plus removes this limit.")} />
            <View style={styles.card}>
              <View style={styles.row}><View style={styles.rowCopy}><Text style={styles.rowTitle}>{isIOS ? (english ? "iPhone app limits" : "iPhoneのアプリ制限") : (english ? "Limit apps until must-dos are done" : "必須項目を終えるまで制限")}</Text><Text style={styles.rowDescription}>{isIOS ? (english ? "App limits are not available in this iPhone build. Tasks, habits, and schedules still work normally." : "このiPhoneビルドではアプリ制限を利用できません。Todo・習慣・日課は通常どおり使えます。") : gateConfig.enabled ? summary.message : (english ? "App limits are off." : "集中ルールはオフです")}</Text></View><Switch value={isIOS ? false : gateConfig.enabled} disabled={isIOS} onValueChange={setGateEnabled} trackColor={{ false: "#CCD7D1", true: "#91C3B3" }} thumbColor={gateConfig.enabled ? COLORS.forest : "#F7F8F5"} /></View>
              <View style={styles.row}><View style={styles.rowCopy}><Text style={styles.rowTitle}>{t("期限当日のTodoを自動で必須にする", "Make due-today tasks must-dos")}</Text><Text style={styles.rowDescription}>{t("未完了の期限当日Todoを、日課ルールに追加しなくても解除条件にします。", "An unfinished task due today becomes a must-do without adding it to a routine.")}</Text></View><Switch value={gateConfig.autoRequireDueToday} onValueChange={(autoRequireDueToday) => setGateConfig({ autoRequireDueToday })} trackColor={{ false: "#CCD7D1", true: "#91C3B3" }} thumbColor={gateConfig.autoRequireDueToday ? COLORS.forest : "#F7F8F5"} /></View>
              <View style={[styles.status, !isIOS && gateConfig.enabled && summary.pendingCount ? styles.statusLocked : styles.statusOpen]}><MaterialIcons name={isIOS ? "info-outline" : gateConfig.enabled && summary.pendingCount ? "lock-outline" : "lock-open"} size={17} color={!isIOS && gateConfig.enabled && summary.pendingCount ? COLORS.warning : COLORS.success} /><Text style={[styles.statusText, { color: !isIOS && gateConfig.enabled && summary.pendingCount ? "#8A5A13" : "#2A7552" }]}>{isIOS ? (english ? "No device permission is required for Focus Flow's core planning features on iPhone." : "iPhoneでは、Focus Flowの基本的な計画機能に端末権限は必要ありません。") : gateConfig.enabled && summary.pendingCount ? english ? `${summary.pendingCount} must-do item(s) are still open.` : `現在 ${summary.pendingCount}件の必須項目が未完了です` : english ? "Limits lift automatically when all must-dos are complete." : "必須項目が完了すると、制限は自動的に解除されます"}</Text></View>
            </View>

            <SectionLabel title={t("日課ルールと有効時間帯", "Routines & active hours")} detail={t("必須項目はいつでも解除条件です。ここでは制限する時間帯とアプリだけを決めます。", "Must-dos always control unlocking. Here, choose when limits apply and which apps they affect.")} />
            <View style={styles.card}>
              <View style={[styles.scheduleState, scheduleActive ? styles.scheduleStateOn : styles.scheduleStateOff]}><MaterialIcons name={scheduleActive ? "schedule" : "schedule-send"} size={17} color={scheduleActive ? COLORS.forest : COLORS.muted} /><Text style={[styles.scheduleStateText, { color: scheduleActive ? COLORS.forest : COLORS.muted }]}>{gateConfig.schedules.length === 0 ? t("常時適用", "Always active") : scheduleActive ? t("現在は時間帯の範囲内です", "A routine is active now") : t("現在は時間帯の範囲外です", "No routine is active now")}</Text></View>
              {gateConfig.schedules.map((schedule) => <SimpleScheduleCard key={schedule.id} schedule={schedule} apps={apps} nativeReady={nativeReady} loadingApps={loadingApps} fallbackPackages={gateConfig.blockedPackages} onChange={(input) => updateSchedule(schedule.id, input)} onRemove={() => removeSchedule(schedule.id)} />)}
              <TouchableOpacity onPress={addSchedule} activeOpacity={0.75} style={styles.addSchedule}><MaterialIcons name="add" size={18} color={COLORS.forest} /><Text style={styles.addScheduleText}>{t("時間帯を追加", "Add a routine")}</Text></TouchableOpacity>
            </View>

            <SectionLabel title={t("毎日のリマインダー", "Daily reminders")} detail={t("通知は1日1回だけです。時間になったら、今日の必須Todoと習慣を確認するようやさしくお知らせします。", "One gentle notification a day helps you review today’s must-dos and habits. It never creates a task or changes App limits.")} />
            <View style={styles.card}>
              <View style={styles.row}><View style={styles.rowCopy}><Text style={styles.rowTitle}>{t("日課を確認する", "Daily check-in")}</Text><Text style={styles.rowDescription}>{Platform.OS === "web" ? t("通知はインストールしたAndroidまたはiPhoneのアプリで設定できます。", "Set notifications in the installed Android or iPhone app.") : reminderPermission ? t("通知は許可されています。", "Notifications are allowed.") : t("オンにすると端末の通知許可を確認します。", "Turning this on asks for notification permission.")}</Text></View><Switch value={Boolean(displaySettings.dailyReminderEnabled)} disabled={Platform.OS === "web" || reminderBusy} onValueChange={(enabled) => void toggleReminder(enabled)} trackColor={{ false: "#CCD7D1", true: "#91C3B3" }} thumbColor={displaySettings.dailyReminderEnabled ? COLORS.forest : "#F7F8F5"} /></View>
              {displaySettings.dailyReminderEnabled ? <><View style={styles.timeRow}><TimeControl label={t("通知時刻", "Reminder time")} value={displaySettings.dailyReminderTime ?? "19:00"} onChange={(time) => void updateReminderTime(time)} /></View><View style={styles.status}><MaterialIcons name="notifications-active" size={17} color={COLORS.success} /><Text style={[styles.statusText, { color: "#2A7552" }]}>{t(`${displaySettings.dailyReminderTime ?? "19:00"} に毎日1回通知します。完了状況を問わない中立的な確認通知です。`, `One neutral daily check-in is scheduled for ${displaySettings.dailyReminderTime ?? "19:00"}, whether or not you have finished your list.`)}</Text></View><TouchableOpacity accessibilityRole="button" disabled={reminderBusy} onPress={() => void testReminder()} style={[styles.permissionButton, { alignSelf: "flex-start", marginTop: 4 }]}><Text style={styles.permissionButtonText}>{reminderBusy ? t("準備中…", "Preparing…") : t("今すぐ試す", "Send a test")}</Text></TouchableOpacity></> : null}
            </View>

            <View style={styles.disclosureCard}>
              <View style={styles.disclosureHeading}><View style={styles.disclosureIcon}><MaterialIcons name="privacy-tip" size={20} color="#215B83" /></View><View style={{ flex: 1 }}><Text style={styles.disclosureEyebrow}>{t("重要：アプリ制限に必要なアクセス", "Important: access needed for App limits")}</Text><Text style={styles.disclosureTitle}>{t("アクセシビリティの利用について", "About Accessibility")}</Text></View></View>
              <Text style={styles.disclosureText}>{t("Focus Flowは、あなたが選択したアプリを前面に開いたことだけを検知し、未完了の必須項目がある場合に集中ルールを適用します。画面上の文字・メッセージ・入力内容・スクリーンショットは読み取りません。Todo・メモ・アプリの利用状況を端末外へ送信しません。この機能は任意で、Androidの設定からいつでも無効にできます。", "Focus Flow only detects when a selected app comes to the foreground and applies your rule while must-dos remain. It does not read screen text, messages, typed content, or screenshots, and it does not send your tasks, notes, or app activity off your device. This optional feature can be turned off anytime in Android settings.")}</Text>
              <Text style={styles.disclosureEnglish}>Focus Flow uses AccessibilityService only to detect when a selected app comes to the foreground and apply your chosen rule. It does not read screen text, messages, typed content, or screenshots, and it does not send your tasks, notes, or app activity off your device. This feature is optional and can be turned off anytime in Android settings.</Text>
              <View style={styles.disclosureStatus}><MaterialIcons name={gateConfig.accessibilityDisclosureAcceptedAt ? "check-circle" : "info-outline"} size={16} color={gateConfig.accessibilityDisclosureAcceptedAt ? COLORS.success : "#215B83"} /><Text style={styles.disclosureStatusText}>{gateConfig.accessibilityDisclosureAcceptedAt ? t("内容を確認済みです。Androidの設定で有効化できます。", "Notice reviewed. You can enable it in Android settings.") : t("内容を確認後に、Androidの設定を開いて有効化できます。", "Review this notice before opening Android settings to enable it.")}</Text></View>
              {!accessibilityEnabled ? <TouchableOpacity accessibilityRole="button" onPress={() => void acknowledgeAndOpenAccessibility()} activeOpacity={0.78} style={styles.disclosureButton}><MaterialIcons name="open-in-new" size={17} color={COLORS.white} /><Text style={styles.disclosureButtonText}>{gateConfig.accessibilityDisclosureAcceptedAt ? t("Androidの設定を開く", "Open Android settings") : t("内容を理解して設定を開く", "I understand — open settings")}</Text></TouchableOpacity> : null}
            </View>

            <View style={styles.permissionCard}>
              <View style={styles.permissionIcon}><MaterialIcons name="accessibility-new" size={23} color={COLORS.blue} /></View>
              <View style={styles.permissionCopy}><Text style={styles.permissionTitle}>{t("Androidのアクセシビリティ権限", "Android Accessibility")}</Text><Text style={styles.permissionDescription}>{nativeReady ? accessibilityEnabled ? t("有効です。選択したアプリの前面化を検出できます。", "On. Focus Flow can detect when a selected app comes to the foreground.") : t("有効化すると、選択したアプリを開いた際に集中ルールを適用できます。", "Enable it to apply App limits when you open a selected app.") : t("この機能は、ネイティブAndroidビルドで利用できます。", "This feature is available in the installed Android build.")}</Text></View>
              {nativeReady ? <TouchableOpacity onPress={() => void acknowledgeAndOpenAccessibility()} style={styles.permissionButton}><Text style={styles.permissionButtonText}>{accessibilityEnabled ? t("確認", "Check") : t("設定を開く", "Open settings")}</Text></TouchableOpacity> : null}
            </View>

            <SectionLabel title={t("端末の動作確認", "Device checks")} detail={t("端末の省電力設定で制限されると、アプリ制限が不安定になる場合があります。標準設定のままで問題がなければ変更は不要です。", "Battery restrictions can make App limits less reliable. Leave your device settings unchanged unless you notice a problem.")} />
            <View style={styles.card}>
              {!nativeReady ? <Notice icon={isIOS ? "phone-iphone" : "android"} text={isIOS ? (english ? "This iPhone build does not use Accessibility or app-limit diagnostics. Your tasks, habits, routines, and notes remain available without extra device permission." : "このiPhoneビルドではアクセシビリティやアプリ制限の診断を使いません。Todo・習慣・日課・メモは追加の端末権限なしで利用できます。") : (english ? "Device diagnostics are available in the installed Android build." : "この診断はネイティブAndroidビルドで利用できます。")} /> : <>
                <DiagnosticRow icon="accessibility-new" title={t("アクセシビリティ", "Accessibility")} detail={accessibilityEnabled ? t("有効です。選択アプリの前面化を確認できます。", "On. Focus Flow can detect selected apps in the foreground.") : t("無効です。集中ルールは適用されません。", "Off. App limits cannot apply.")} good={accessibilityEnabled} />
                <DiagnosticRow icon="battery-charging-full" title={t("バッテリー最適化", "Battery optimization")} detail={diagnostics?.batteryOptimizationIgnored ? t("制限なしです。", "No battery restriction detected.") : t("最適化中です。制限が不安定なときだけアプリ情報で確認してください。", "Optimized. Check app settings only if App limits are unreliable.")} good={Boolean(diagnostics?.batteryOptimizationIgnored)} />
                <DiagnosticRow icon="settings" title={t("バックグラウンド実行", "Background activity")} detail={diagnostics?.backgroundRestricted ? t("制限ありです。端末のバッテリー設定で許可してください。", "Restricted. Allow background activity in your device's battery settings.") : t("大きな制限は検出されませんでした。", "No major restriction detected.")} good={!diagnostics?.backgroundRestricted} />
                <TouchableOpacity onPress={() => void refreshAccessibility()} style={styles.disclosureButton}><Text style={styles.disclosureButtonText}>{t("状態を再確認", "Check status again")}</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => void openAppDetailsSettings()} style={[styles.permissionButton, { alignSelf: "center", marginVertical: 10 }]}><Text style={styles.permissionButtonText}>{t("アプリ情報を開く", "Open app info")}</Text></TouchableOpacity>
                <Text style={styles.permissionDescription}>{t("時間管理の必須項目を設定時間より早く完了する場合は、項目画面から1回限りの早期完了を購入できます。端末やOSの都合で常時の動作は保証できません。", "To finish a timed must-do before its scheduled time, buy one early completion from that item. Continuous behavior cannot be guaranteed across every device and OS configuration.")}</Text>
              </>}
            </View>

            {gateConfig.schedules.length === 0 ? <><SectionLabel title={isIOS ? (english ? "App limits on iPhone" : "iPhoneのアプリ制限") : t("常時ルールの制限アプリ", "Apps limited by the always-on rule")} detail={isIOS ? (english ? "App limits are not active in this iPhone build." : "このiPhoneビルドではアプリ制限は有効になりません。") : t("時間帯ルールを登録しない場合に使います。無料版では合計5件、Plusでは無制限です。", "Use this when you do not have routines. The free plan allows 5 apps in total; Plus is unlimited.")} /><View style={styles.card}>{!nativeReady ? <Notice icon={isIOS ? "phone-iphone" : "android"} text={isIOS ? (english ? "You do not need to choose apps or enable Android Accessibility on iPhone. Focus Flow's planning features are ready to use." : "iPhoneではアプリ選択やAndroidアクセシビリティの有効化は必要ありません。Focus Flowの計画機能をそのまま使えます。") : (english ? "Install the native Android build to choose apps already on your device." : "ネイティブAndroidビルドを端末へ入れると、インストール済みアプリをここで選択できます。")} /> : loadingApps ? <View style={styles.loadingRow}><ActivityIndicator color={COLORS.forest} /><Text style={styles.loadingText}>{t("アプリ一覧を読み込んでいます", "Loading apps")}</Text></View> : apps.length ? apps.slice(0, 36).map((app) => <ChoiceRow key={app.packageName} title={app.label} detail={app.packageName} selected={gateConfig.blockedPackages.includes(app.packageName)} onPress={() => selectedApp(app.packageName)} />) : <Notice icon="apps" text={t("選択できるアプリを取得できませんでした。", "Could not load apps to choose from.")} />}</View></> : null}

            </> : null}
            <SectionLabel title={t("外観", "Appearance")} detail={t("アプリ・文字・ホーム画面ウィジェットの見た目を一つの場所で整えます。", "Keep your app, type, and home screen widgets in one consistent look.")} />
            <View style={styles.card}>
              <PlanComparison english={english} isIOS={isIOS} isPlus={isPlus} price={plusStatus.price} />
              <View style={styles.themePlanRow}><View style={styles.rowCopy}><Text style={styles.rowTitle}>{isPlus ? t("Plusは無制限で利用できます", "Plus is unlimited") : t("無料版は必要な機能を2件ずつ利用できます", "Free includes 2 of each core item")}</Text><Text style={styles.rowDescription}>{isPlus ? t("Todo・習慣・メモ・制限対象アプリを無制限に使え、保存済みテーマセットも利用できます。", "Use unlimited tasks, habits, notes, limited apps, and saved theme sets.") : t("無料版はTodo・習慣・メモを各2件、制限対象アプリを5件まで利用できます。言語・外観・文字・ウィジェット設定は無料です。", "Free includes 2 tasks, habits, and notes each plus 5 limited apps. Language, appearance, type, and widgets remain free.")}</Text></View><View style={[styles.plusPill, isPlus && styles.plusPillActive]}><Text style={styles.plusPillText}>{isPlus ? t("有効", "Active") : t("Plus", "Plus")}</Text></View></View>
              {!isPlus ? <View style={styles.plusActionArea}>{plusStatus.status === "eligible" ? <TouchableOpacity accessibilityRole="button" onPress={() => void purchasePlus()} style={styles.plusPrimary}><Text style={styles.plusPrimaryText}>{plusStatus.price ? t(`${plusStatus.price} で Plus を開始`, `Get Plus for ${plusStatus.price}`) : t("Plus を開始", "Get Plus")}</Text></TouchableOpacity> : plusStatus.status === "loading" || plusStatus.status === "pending" ? <View style={styles.plusBusy}><ActivityIndicator color={COLORS.forest} /><Text style={styles.plusBusyText}>{plusStatus.status === "pending" ? t("ストアで購入を完了し、アプリへ戻ってください。", "Finish the purchase in your store, then return here.") : t("ストアの商品を確認しています…", "Checking store products…")}</Text></View> : <Text style={styles.plusUnavailable}>{plusStatus.status === "error" ? t("ストアに接続できません。ネットワークを確認して再試行してください。", "The store could not be reached. Check your connection and try again.") : plusStatus.reason === "NATIVE_BUILD_REQUIRED" ? t("Plusの購入・復元は、Expo Goではなくストア用のAndroidまたはiPhoneビルドで利用できます。", "Plus purchase and restore are available in an Android or iPhone store build, not Expo Go.") : t("このビルドではPlusの商品が未設定です。App Store ConnectまたはPlay Consoleにテスト商品を設定すると、ここに実際の価格が表示されます。", "Plus is not configured for this build. Set up a test product in App Store Connect or Play Console to show its live price here.")}</Text>}<View style={styles.plusSecondaryRow}><TouchableOpacity accessibilityRole="button" onPress={() => void restorePlus()} style={styles.plusSecondary}><Text style={styles.plusSecondaryText}>{t("購入を復元", "Restore purchases")}</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" onPress={() => void refreshPlusStatus()} style={styles.plusSecondary}><Text style={styles.plusSecondaryText}>{t("再確認", "Check again")}</Text></TouchableOpacity></View></View> : <View style={styles.plusSecondaryRow}><TouchableOpacity accessibilityRole="button" onPress={() => void managePlus()} style={styles.plusSecondary}><Text style={styles.plusSecondaryText}>{t("サブスクリプションを管理", "Manage subscription")}</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" onPress={() => void restorePlus()} style={styles.plusSecondary}><Text style={styles.plusSecondaryText}>{t("購入を復元", "Restore purchases")}</Text></TouchableOpacity></View>}
              <View style={styles.plusLegalLinks}><TouchableOpacity accessibilityRole="link" onPress={() => router.push("/legal" as never)} style={styles.plusLegalLink}><Text style={styles.plusLegalLinkText}>{t("利用条件とサブスクリプション", "Terms & subscriptions")}</Text></TouchableOpacity><TouchableOpacity accessibilityRole="link" onPress={() => router.push("/privacy" as never)} style={styles.plusLegalLink}><Text style={styles.plusLegalLinkText}>{t("プライバシーとデータ", "Privacy & data")}</Text></TouchableOpacity></View>
              <PreferenceHeader title={t("アプリの配色", "App color")} detail={t("画面全体の背景・カード・主要操作の色を選びます。", "Choose the colors for screens, cards, and primary actions.")} />
              <View style={styles.appThemeChoices}>{(Object.keys(APP_THEMES) as AppThemeId[]).map((theme) => <AppThemeChoice key={theme} theme={theme} selected={resolvedAppTheme(displaySettings) === theme} english={english} locked={false} onPress={() => setDisplaySettings({ appTheme: theme })} />)}</View>
              <PreferenceHeader title={t("外観モード", "Appearance mode")} detail={t("ライト・ダーク、または端末設定に合わせた表示を選びます。", "Use light, dark, or follow your device setting.")} />
              <View style={styles.segmented}>{APPEARANCE_OPTIONS.map((appearance) => <TouchableOpacity key={appearance} accessibilityRole="button" accessibilityState={{ selected: (displaySettings.appearance ?? "system") === appearance }} onPress={() => setDisplaySettings({ appearance })} style={[styles.segment, (displaySettings.appearance ?? "system") === appearance && styles.segmentSelected]}><Text style={[styles.segmentText, (displaySettings.appearance ?? "system") === appearance && styles.segmentTextSelected]}>{appearance === "system" ? (english ? "System" : "端末に連動") : appearance === "light" ? (english ? "Light" : "ライト") : (english ? "Dark" : "ダーク")}</Text></TouchableOpacity>)}</View>
              <PreferenceHeader title={t("フォント", "Font")} detail={t("日本語と英語のどちらにも対応する端末標準フォールバックを使います。すべてのフォントを無料で選べます。", "Each choice keeps a safe device fallback for Japanese and English. Every font is free to use.")} />
              <View style={styles.fontChoices}>{APP_FONT_OPTIONS.map((font) => <FontChoice key={font.id} font={font.id} selected={(displaySettings.fontFamily ?? "system") === font.id} english={english} locked={false} onPress={() => setDisplaySettings({ fontFamily: font.id })} />)}</View>
              <PreferenceHeader title={t("文字サイズ", "Text size")} detail={t("情報を多く見たいときは「情報量優先」を選べます。", "Choose Compact when you want more information on screen.")} />
              <Segmented options={english ? [{ key: "compact", label: "Compact" }, { key: "standard", label: "Standard" }, { key: "large", label: "Large" }] : [{ key: "compact", label: "小さめ" }, { key: "standard", label: "標準" }, { key: "large", label: "大きめ" }]} selected={displaySettings.fontScale} onSelect={(fontScale) => setDisplaySettings({ fontScale: fontScale as DisplaySettings["fontScale"] })} />
              <PreferenceHeader title={t("カードの見え方", "Card surface")} detail={t("読みやすさを保ちながら、カードの透け感を調整します。", "Adjust card translucency while keeping text easy to read.")} />
              <Segmented options={english ? [{ key: "solid", label: "Solid" }, { key: "soft", label: "Soft" }, { key: "glass", label: "Glass" }] : [{ key: "solid", label: "不透明" }, { key: "soft", label: "やわらかく" }, { key: "glass", label: "ガラス" }]} selected={displaySettings.cardOpacity} onSelect={(cardOpacity) => setDisplaySettings({ cardOpacity: cardOpacity as DisplaySettings["cardOpacity"] })} />
              <PreferenceHeader title={t("言語 / Language", "Language")} detail={t("自動では端末の言語を使います。", "Automatic follows your device language.")} />
              <Segmented options={[{ key: "auto", label: "自動" }, { key: "ja", label: "日本語" }, { key: "en", label: "English" }]} selected={displaySettings.language ?? "auto"} onSelect={(language) => setDisplaySettings({ language: language as NonNullable<DisplaySettings["language"]> })} />
              <View style={styles.appearanceDivider} />
              <PreferenceHeader title={t("ホーム画面ウィジェット", "Home screen widgets")} detail={t("アプリテーマに合わせつつ、必要なウィジェットだけ背景とアクセントを個別に調整できます。", "Keep widgets aligned with your app theme, then fine-tune only the ones that need it.")} />
              <View style={styles.widgetCard}><View style={styles.widgetPreview}><Text style={styles.widgetCount}>{summary.pendingCount ? english ? `${summary.pendingCount} open` : `${summary.pendingCount}件` : t("完了", "Done")}</Text><View style={styles.widgetCopy}><Text style={styles.widgetBrand}>Focus Flow</Text><Text style={styles.widgetStatus}>{gateConfig.enabled && summary.pendingCount ? t("集中制限中：タップして必須項目を確認", "App limits on: tap to review must-dos") : t("今日の集中ルールは解除されています", "Today's App limits are open")}</Text></View></View><Text style={styles.widgetDescription}>{t("Androidのホーム画面を長押しして「ウィジェット」から、概要・解除の進捗・次の必須項目・習慣の記録・日課の状態の5種類から選んで追加できます。", "Long-press your Android home screen, open Widgets, then choose Overview, Unlock progress, Next must-do, Habit pulse, or Routine status.")}</Text></View>
              {WIDGET_THEME_KINDS.map((kind) => { const theme = getWidgetTheme(displaySettings, kind); return <WidgetThemeEditor key={kind} kind={kind} background={theme.background} accent={theme.accent} textSize={displaySettings.widgetTextSizes?.[kind] ?? "standard"} english={english} onBackground={(background) => setWidgetTheme(kind, { background })} onAccent={(accent) => setWidgetTheme(kind, { accent })} onTextSize={(textSize) => setWidgetTextSize(kind, textSize)} onReset={() => resetWidgetTheme(kind)} />; })}
              {isPlus ? <><PreferenceHeader title={t("テーマセット", "Theme sets")} detail={t("今の配色・文字・ウィジェット設定をまとめて保存します。", "Save your current colors, type, and widget styling as one set.")} /><View style={styles.themeSetComposer}><TextInput value={themeSetName} onChangeText={setThemeSetName} placeholder={t("例：平日の集中", "e.g., Weekday focus")} placeholderTextColor="#8B9992" maxLength={32} style={styles.themeSetInput} /><TouchableOpacity accessibilityRole="button" onPress={saveThemeSet} style={styles.themeSetSave}><Text style={styles.themeSetSaveText}>{t("保存", "Save")}</Text></TouchableOpacity></View>{(displaySettings.savedThemeSets ?? []).map((set) => <View key={set.id} style={styles.themeSetRow}><TouchableOpacity accessibilityRole="button" onPress={() => applyThemeSet(set)} style={styles.themeSetApply}><Text style={styles.themeSetName}>{set.name}</Text><Text style={styles.themeSetMeta}>{english ? APP_THEMES[set.appTheme].label.en : APP_THEMES[set.appTheme].label.ja} · {set.appearance === "system" ? (english ? "System" : "端末に連動") : set.appearance === "light" ? (english ? "Light" : "ライト") : (english ? "Dark" : "ダーク")}</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" onPress={() => removeThemeSet(set.id)} style={styles.themeSetRemove}><MaterialIcons name="close" size={18} color={COLORS.error} /></TouchableOpacity></View>)}</> : <Text style={styles.plusNote}>{t("Plusの商品設定が完了したストアビルドでは、ここから実際の価格を確認して購入・復元できます。", "In a store build with a configured Plus product, this area shows live prices, purchase, and restore options.")}</Text>}
            </View>
          </>
        }
      />
    </ScreenContainer>
  );
}

function SectionLabel({ title, detail }: { title: string; detail?: string }) { return <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>{title}</Text>{detail ? <Text style={styles.sectionDetail}>{detail}</Text> : null}</View>; }
function PlanComparison({ english, isIOS, isPlus, price }: { english: boolean; isIOS: boolean; isPlus: boolean; price?: string }) {
  const t = (ja: string, en: string) => english ? en : ja;
  return <View style={styles.planComparison}>
    <View style={styles.planComparisonHeader}><View style={styles.planHeaderCopy}><Text style={styles.planComparisonEyebrow}>{t("プランを比較", "COMPARE PLANS")}</Text><Text style={styles.planComparisonTitle}>{isPlus ? t("Plusを利用中です", "Plus is active") : t("必要になったら、Plusへ", "Start free. Upgrade when ready.")}</Text></View>{isPlus ? <View style={styles.planActiveBadge}><MaterialIcons name="verified" size={14} color={COLORS.success} /><Text style={styles.planActiveBadgeText}>{t("有効", "Active")}</Text></View> : null}</View>
    <View style={styles.planGrid}>
      <View style={styles.planCard}><Text style={styles.planName}>{t("無料", "Free")}</Text><Text style={styles.planCaption}>{t("毎日の集中に必要なこと", "Everything for daily focus")}</Text><PlanFeature icon="check" text={t("Todo・習慣・メモ 各2件", "2 tasks, habits & notes each")} /><PlanFeature icon="check" text={t("制限対象アプリ 合計5件", "5 limited apps total")} /><PlanFeature icon="check" text={t("言語・外観・文字・ウィジェット", "Language, appearance, type & widgets")} /></View>
      <View style={[styles.planCard, styles.planCardPlus]}><Text style={styles.planName}>{t("Plus", "Plus")}</Text><Text style={styles.planCaption}>{price ? t(`${price} · いつでも管理`, `${price} · manage anytime`) : t("ストアで価格を確認", "Live price in your store")}</Text><PlanFeature icon="all-inclusive" text={t("Todo・習慣・メモ 無制限", "Unlimited tasks, habits & notes")} highlighted /><PlanFeature icon="all-inclusive" text={t("制限対象アプリ 無制限", "Unlimited limited apps")} highlighted /><PlanFeature icon="palette" text={t("テーマセットを保存・呼び出し", "Save and reuse theme sets")} highlighted /></View>
    </View>
    <Text style={styles.planFootnote}>{t("時間管理の項目は、設定した時間を過ぎると完了します。時間前に完了する場合は、対象1件だけに使うストア商品が表示されます。", "Timed items finish after their set time. An optional one-time store item can finish one item early.")}</Text>
    <View style={styles.planPlatformNote}><MaterialIcons name={isIOS ? "phone-iphone" : "android"} size={15} color="#46647D" /><Text style={styles.planPlatformNoteText}>{isIOS ? t("iPhoneでは、App Store版で購入・復元・サブスクリプション管理を利用できます。", "On iPhone, purchase, restore, and subscription management are available in the App Store build.") : t("Androidでは、Google Play版で購入・復元・サブスクリプション管理を利用できます。", "On Android, purchase, restore, and subscription management are available in the Google Play build.")}</Text></View>
  </View>;
}
function PlanFeature({ icon, text, highlighted = false }: { icon: React.ComponentProps<typeof MaterialIcons>["name"]; text: string; highlighted?: boolean }) { return <View style={styles.planFeature}><MaterialIcons name={icon} size={15} color={highlighted ? COLORS.forest : "#557067"} /><Text style={[styles.planFeatureText, highlighted && styles.planFeatureTextPlus]}>{text}</Text></View>; }
function PreferenceHeader({ title, detail }: { title: string; detail: string }) { return <View style={styles.preferenceHeader}><Text style={styles.preferenceLabel}>{title}</Text><Text style={styles.preferenceHint}>{detail}</Text></View>; }
function DiagnosticRow({ icon, title, detail, good }: { icon: React.ComponentProps<typeof MaterialIcons>["name"]; title: string; detail: string; good: boolean }) { return <View style={styles.permissionCard}><View style={[styles.permissionIcon, { backgroundColor: good ? "#E7F3ED" : "#FFF2DD" }]}><MaterialIcons name={icon} size={20} color={good ? COLORS.success : COLORS.warning} /></View><View style={styles.permissionCopy}><Text style={styles.permissionTitle}>{title}</Text><Text style={styles.permissionDescription}>{detail}</Text></View></View>; }
function Notice({ icon, text }: { icon: React.ComponentProps<typeof MaterialIcons>["name"]; text: string }) { return <View style={styles.notice}><MaterialIcons name={icon} size={20} color={COLORS.muted} /><Text style={styles.noticeText}>{text}</Text></View>; }
function ChoiceRow({ title, detail, selected, onPress, accent }: { title: string; detail: string; selected: boolean; onPress: () => void; accent?: string }) { return <TouchableOpacity onPress={onPress} activeOpacity={0.72} style={styles.choiceRow}><View style={[styles.choiceMark, selected && { backgroundColor: accent ?? COLORS.forest, borderColor: accent ?? COLORS.forest }]}>{selected ? <MaterialIcons name="check" size={15} color={COLORS.white} /> : null}</View><View style={styles.choiceCopy}><Text style={styles.choiceTitle} numberOfLines={1}>{title}</Text><Text style={styles.choiceDetail} numberOfLines={1}>{detail}</Text></View></TouchableOpacity>; }
function Segmented({ options, selected, onSelect }: { options: { key: string; label: string }[]; selected: string; onSelect: (key: string) => void }) { return <View style={styles.segmented}>{options.map((option) => <TouchableOpacity key={option.key} onPress={() => onSelect(option.key)} style={[styles.segment, selected === option.key && styles.segmentSelected]}><Text style={[styles.segmentText, selected === option.key && styles.segmentTextSelected]}>{option.label}</Text></TouchableOpacity>)}</View>; }
function WidgetThemeEditor({ kind, background, accent, textSize, english, onBackground, onAccent, onTextSize, onReset }: { kind: WidgetThemeKind; background: WidgetBackgroundTheme; accent: WidgetAccentTheme; textSize: WidgetTextSize; english: boolean; onBackground: (value: WidgetBackgroundTheme) => void; onAccent: (value: WidgetAccentTheme) => void; onTextSize: (value: WidgetTextSize) => void; onReset: () => void }) {
  const names: Record<WidgetThemeKind, [string, string]> = { overview: ["概要", "Overview"], progress: ["解除の進捗", "Unlock progress"], next: ["次の必須項目", "Next must-do"], habit: ["習慣の記録", "Habit pulse"], routine: ["日課の状態", "Routine status"] };
  const backgroundNames: Record<WidgetBackgroundTheme, [string, string]> = { default: ["標準", "Default"], forest: ["フォレスト", "Forest"], ocean: ["オーシャン", "Ocean"], violet: ["バイオレット", "Violet"], amber: ["アンバー", "Amber"], blush: ["ブラッシュ", "Blush"], ink: ["インク", "Ink"] };
  const accentNames: Record<WidgetAccentTheme, [string, string]> = { auto: ["自動", "Auto"], mint: ["ミント", "Mint"], sky: ["スカイ", "Sky"], violet: ["バイオレット", "Violet"], coral: ["コーラル", "Coral"], gold: ["ゴールド", "Gold"], ink: ["インク", "Ink"] };
  return <View style={styles.widgetThemeEditor}><View style={styles.widgetThemeHeader}><View style={styles.widgetThemeTitleWrap}><View style={[styles.widgetThemePreview, { backgroundColor: WIDGET_BACKGROUND_SWATCH[background] }]}><View style={[styles.widgetThemePreviewAccent, { backgroundColor: WIDGET_ACCENT_SWATCH[accent] }]} /></View><Text style={styles.widgetThemeTitle}>{english ? names[kind][1] : names[kind][0]}</Text></View><TouchableOpacity accessibilityRole="button" onPress={onReset} style={styles.widgetThemeReset}><Text style={styles.widgetThemeResetText}>{english ? "Reset" : "リセット"}</Text></TouchableOpacity></View><Text style={styles.widgetThemeLabel}>{english ? "Background" : "背景色"}</Text><View style={styles.widgetThemeChoices}>{WIDGET_BACKGROUND_OPTIONS.map((option) => <ColorChoice key={option} color={WIDGET_BACKGROUND_SWATCH[option]} label={english ? backgroundNames[option][1] : backgroundNames[option][0]} selected={background === option} onPress={() => onBackground(option)} />)}</View><Text style={styles.widgetThemeLabel}>{english ? "Accent" : "アクセント"}</Text><View style={styles.widgetThemeChoices}>{WIDGET_ACCENT_OPTIONS.map((option) => <ColorChoice key={option} color={WIDGET_ACCENT_SWATCH[option]} label={english ? accentNames[option][1] : accentNames[option][0]} selected={accent === option} onPress={() => onAccent(option)} />)}</View><Text style={styles.widgetThemeLabel}>{english ? "Text size" : "文字サイズ"}</Text><View style={styles.segmented}>{(["compact", "standard", "large"] as WidgetTextSize[]).map((size) => <TouchableOpacity key={size} accessibilityRole="button" accessibilityState={{ selected: textSize === size }} onPress={() => onTextSize(size)} style={[styles.segment, textSize === size && styles.segmentSelected]}><Text style={[styles.segmentText, textSize === size && styles.segmentTextSelected]}>{size === "compact" ? (english ? "Compact" : "小さめ") : size === "standard" ? (english ? "Standard" : "標準") : (english ? "Large" : "大きめ")}</Text></TouchableOpacity>)}</View></View>;
}
function AppThemeChoice({ theme, selected, english, locked, onPress }: { theme: AppThemeId; selected: boolean; english: boolean; locked: boolean; onPress: () => void }) { const definition = APP_THEMES[theme]; return <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected, disabled: locked }} onPress={onPress} style={[styles.appThemeChoice, selected && styles.appThemeChoiceSelected, locked && styles.appThemeChoiceLocked]}><View style={[styles.appThemeSwatch, { backgroundColor: definition.light.background, borderColor: definition.light.border }]}><View style={[styles.appThemeSwatchAccent, { backgroundColor: definition.light.primary }]} /></View><Text style={[styles.appThemeChoiceText, selected && styles.appThemeChoiceTextSelected]} numberOfLines={1}>{english ? definition.label.en : definition.label.ja}</Text>{locked ? <MaterialIcons name="lock-outline" size={12} color={COLORS.muted} /> : null}</TouchableOpacity>; }
function FontChoice({ font, selected, english, locked, onPress }: { font: AppFontId; selected: boolean; english: boolean; locked: boolean; onPress: () => void }) { const definition = APP_FONT_OPTIONS.find((option) => option.id === font)!; return <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected, disabled: locked }} onPress={onPress} style={[styles.fontChoice, selected && styles.appThemeChoiceSelected, locked && styles.appThemeChoiceLocked]}><Text style={[styles.fontChoiceSample, getAppFontStyle(font)]} numberOfLines={1}>{english ? definition.sample.en : definition.sample.ja}</Text><Text style={[styles.appThemeChoiceText, selected && styles.appThemeChoiceTextSelected]} numberOfLines={1}>{english ? definition.label.en : definition.label.ja}</Text>{locked ? <MaterialIcons name="lock-outline" size={12} color={COLORS.muted} /> : null}</TouchableOpacity>; }
function ColorChoice({ color, label, selected, onPress }: { color: string; label: string; selected: boolean; onPress: () => void }) { return <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected }} onPress={onPress} style={[styles.colorChoice, selected && styles.colorChoiceSelected]}><View style={[styles.colorSwatch, { backgroundColor: color }]}>{selected ? <MaterialIcons name="check" size={13} color="#FFFFFF" /> : null}</View><Text style={[styles.colorChoiceText, selected && styles.colorChoiceTextSelected]} numberOfLines={1}>{label}</Text></TouchableOpacity>; }
function SimpleScheduleCard({ schedule, apps, nativeReady, loadingApps, fallbackPackages, onChange, onRemove }: { schedule: GateSchedule; apps: LaunchableApp[]; nativeReady: boolean; loadingApps: boolean; fallbackPackages: string[]; onChange: (input: Partial<GateSchedule>) => void; onRemove: () => void }) {
  const { displaySettings, canSelectBlockedApp } = useFocusFlow();
  const english = isEnglish(displaySettings);
  const t = (ja: string, en: string) => english ? en : ja;
  const [appsOpen, setAppsOpen] = useState(false);
  const packages = schedule.blockedPackages ?? fallbackPackages;
  const toggleApp = (packageName: string) => { if (!packages.includes(packageName) && !canSelectBlockedApp(packageName)) { Alert.alert(t("無料版の上限です", "Free plan limit"), t("制限対象アプリは無料版では合計5件までです。Plusでは無制限に選べます。", "The free plan allows 5 limited apps in total. Plus removes this limit.")); return; } onChange({ blockedPackages: toggleId(packages, packageName) }); };
  const dayLabels = english ? ["S", "M", "T", "W", "T", "F", "S"] : ["日", "月", "火", "水", "木", "金", "土"];
  return <View style={styles.scheduleCard}>
    <View style={styles.scheduleHeader}><View style={{ flex: 1, paddingRight: 10 }}><TextInput value={schedule.label} onChangeText={(label) => onChange({ label })} placeholder={t("例：朝の準備", "e.g., Morning routine")} placeholderTextColor="#94A19A" style={{ color: COLORS.text, fontSize: 15, fontWeight: "800", paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: "#DCE4DF" }} /><Text style={styles.scheduleDetail}>{formatDays(schedule.days, english)} · {schedule.startTime}–{schedule.endTime} · {t("制限アプリ", "Apps")} {packages.length}</Text></View><Switch accessibilityLabel={t("日課ルールをオン・オフ", "Turn routine on or off")} value={schedule.enabled} onValueChange={(enabled) => onChange({ enabled })} trackColor={{ false: "#CCD7D1", true: "#91C3B3" }} thumbColor={schedule.enabled ? COLORS.forest : "#F7F8F5"} /></View>
    <View style={styles.dayPicker}>{dayLabels.map((label, day) => <TouchableOpacity key={`${label}-${day}`} accessibilityRole="button" accessibilityState={{ selected: schedule.days.includes(day) }} accessibilityLabel={t(`${label}曜日を切り替え`, `Toggle ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day]}`)} onPress={() => onChange({ days: toggleNumber(schedule.days, day) })} style={[styles.dayChip, schedule.days.includes(day) && styles.dayChipSelected]}><Text style={[styles.dayChipText, schedule.days.includes(day) && styles.dayChipTextSelected]}>{label}</Text></TouchableOpacity>)}</View>
    <View style={styles.timeRow}><TimeControl label={t("開始", "Start")} value={schedule.startTime} onChange={(startTime) => onChange({ startTime })} /><MaterialIcons name="arrow-forward" size={18} color={COLORS.muted} /><TimeControl label={t("終了", "End")} value={schedule.endTime} onChange={(endTime) => onChange({ endTime })} /></View>
    <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: appsOpen }} onPress={() => setAppsOpen((value) => !value)} style={{ minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderRadius: 12, backgroundColor: "#E8F0EC", marginTop: 14 }}><MaterialIcons name={appsOpen ? "expand-less" : "apps"} size={18} color={COLORS.forest} /><Text style={{ color: COLORS.forest, fontSize: 13, fontWeight: "800" }}>{appsOpen ? t("対象アプリを閉じる", "Hide selected apps") : t("この時間帯に制限するアプリを選ぶ", "Choose apps to limit")}</Text></TouchableOpacity>
    {appsOpen ? <View style={{ marginTop: 10 }}><View style={styles.ruleHint}><MaterialIcons name="lock-outline" size={16} color={COLORS.blue} /><Text style={styles.ruleHintText}>{t("この時間帯は、必須Todo・必須習慣が未完了の間だけ、選択したアプリを制限します。無料版では全ルール合計5件、Plusでは無制限です。", "Selected apps are limited only while must-dos remain open. The free plan allows 5 apps across all routines; Plus is unlimited.")}</Text></View>{!nativeReady ? <Notice icon="android" text={t("ネイティブAndroidビルドでアプリを選択できます。", "Choose installed apps in a native Android build.")} /> : loadingApps ? <View style={styles.loadingRow}><ActivityIndicator color={COLORS.forest} /><Text style={styles.loadingText}>{t("アプリ一覧を読み込んでいます", "Loading apps")}</Text></View> : apps.slice(0, 36).map((app) => <ChoiceRow key={app.packageName} title={app.label} detail={app.packageName} selected={packages.includes(app.packageName)} onPress={() => toggleApp(app.packageName)} />)}</View> : null}
    <TouchableOpacity accessibilityRole="button" onPress={onRemove} style={styles.removeSchedule}><Text style={styles.removeScheduleText}>{t("この日課ルールを削除", "Delete this routine")}</Text></TouchableOpacity>
  </View>;
}
export function LegacyScheduleCard({ schedule, todos, habits, apps, nativeReady, loadingApps, fallbackTodoIds, fallbackHabitIds, fallbackPackages, onChange, onRemove }: { schedule: GateSchedule; todos: { id: string; title: string; completed: boolean }[]; habits: { id: string; title: string; goalPerWeek: number; color: string }[]; apps: LaunchableApp[]; nativeReady: boolean; loadingApps: boolean; fallbackTodoIds: string[]; fallbackHabitIds: string[]; fallbackPackages: string[]; onChange: (input: Partial<GateSchedule>) => void; onRemove: () => void }) { const [expanded, setExpanded] = useState(false); const extraTodoIds = schedule.requiredTodoIds ?? []; const extraHabitIds = schedule.requiredHabitIds ?? []; const packages = schedule.blockedPackages ?? fallbackPackages; const totalTodoCount = new Set([...fallbackTodoIds, ...extraTodoIds]).size; const totalHabitCount = new Set([...fallbackHabitIds, ...extraHabitIds]).size; const toggleRuleId = (key: "requiredTodoIds" | "requiredHabitIds" | "blockedPackages", value: string) => onChange({ [key]: toggleId(key === "requiredTodoIds" ? extraTodoIds : key === "requiredHabitIds" ? extraHabitIds : packages, value) }); return <View style={styles.scheduleCard}><View style={styles.scheduleHeader}><View style={{ flex: 1, paddingRight: 10 }}><TextInput value={schedule.label} onChangeText={(label) => onChange({ label })} placeholder="例：朝の準備" placeholderTextColor="#94A19A" style={{ color: COLORS.text, fontSize: 15, fontWeight: "800", paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: "#DCE4DF" }} /><Text style={styles.scheduleDetail}>{formatDays(schedule.days)} ・ {schedule.startTime}〜{schedule.endTime} ・ Todo {totalTodoCount} ・ 習慣 {totalHabitCount} ・ アプリ {packages.length}</Text></View><Switch value={schedule.enabled} onValueChange={(enabled) => onChange({ enabled })} trackColor={{ false: "#CCD7D1", true: "#91C3B3" }} thumbColor={schedule.enabled ? COLORS.forest : "#F7F8F5"} /></View><View style={styles.dayPicker}>{["日", "月", "火", "水", "木", "金", "土"].map((label, day) => <TouchableOpacity key={label} onPress={() => onChange({ days: toggleNumber(schedule.days, day) })} style={[styles.dayChip, schedule.days.includes(day) && styles.dayChipSelected]}><Text style={[styles.dayChipText, schedule.days.includes(day) && styles.dayChipTextSelected]}>{label}</Text></TouchableOpacity>)}</View><View style={styles.timeRow}><TimeControl label="開始" value={schedule.startTime} onChange={(startTime) => onChange({ startTime })} /><MaterialIcons name="arrow-forward" size={18} color={COLORS.muted} /><TimeControl label="終了" value={schedule.endTime} onChange={(endTime) => onChange({ endTime })} /></View><TouchableOpacity onPress={() => setExpanded((value) => !value)} style={{ minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderRadius: 12, backgroundColor: "#E8F0EC", marginTop: 14 }}><MaterialIcons name={expanded ? "expand-less" : "tune"} size={18} color={COLORS.forest} /><Text style={{ color: COLORS.forest, fontSize: 13, fontWeight: "800" }}>{expanded ? "個別条件を閉じる" : "このルールの解除条件を設定"}</Text></TouchableOpacity>{expanded ? <View style={{ marginTop: 10 }}><View style={styles.ruleHint}><MaterialIcons name="info-outline" size={16} color={COLORS.blue} /><Text style={styles.ruleHintText}>登録時に「必須」にした項目は、すべてのルールで適用されます。ここではこの時間帯だけに追加する項目を選びます。</Text></View><Text style={styles.preferenceLabel}>この時間帯に追加するTodo</Text>{todos.length ? todos.map((todo) => <ChoiceRow key={todo.id} title={todo.title} detail={todo.completed ? "完了済み" : "未完了"} selected={extraTodoIds.includes(todo.id)} onPress={() => toggleRuleId("requiredTodoIds", todo.id)} />) : <Notice icon="playlist-add" text="Todoを追加すると選択できます。" />}<Text style={styles.preferenceLabel}>この時間帯に追加する習慣</Text>{habits.length ? habits.map((habit) => <ChoiceRow key={habit.id} title={habit.title} detail={`週${habit.goalPerWeek}日を目標`} selected={extraHabitIds.includes(habit.id)} onPress={() => toggleRuleId("requiredHabitIds", habit.id)} accent={habit.color} />) : <Notice icon="repeat" text="習慣を追加すると選択できます。" />}<Text style={styles.preferenceLabel}>制限するアプリ</Text>{!nativeReady ? <Notice icon="android" text="ネイティブAndroidビルドでアプリを選択できます。" /> : loadingApps ? <View style={styles.loadingRow}><ActivityIndicator color={COLORS.forest} /><Text style={styles.loadingText}>アプリ一覧を読み込んでいます</Text></View> : apps.slice(0, 36).map((app) => <ChoiceRow key={app.packageName} title={app.label} detail={app.packageName} selected={packages.includes(app.packageName)} onPress={() => toggleRuleId("blockedPackages", app.packageName)} />)}</View> : null}<TouchableOpacity onPress={onRemove} style={styles.removeSchedule}><Text style={styles.removeScheduleText}>この日課ルールを削除</Text></TouchableOpacity></View>; }
function TimeControl({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { const english = label === "Start" || label === "End"; return <View style={styles.timeControl}><Text style={styles.timeLabel}>{label}</Text><View style={styles.timeButtons}><TouchableOpacity accessibilityLabel={english ? `Move ${label.toLowerCase()} time back 30 minutes` : `${label}を30分戻す`} onPress={() => onChange(stepTime(value, -30))} style={styles.timeStep}><MaterialIcons name="remove" size={17} color={COLORS.forest} /></TouchableOpacity><Text style={styles.timeValue}>{value}</Text><TouchableOpacity accessibilityLabel={english ? `Move ${label.toLowerCase()} time forward 30 minutes` : `${label}を30分進める`} onPress={() => onChange(stepTime(value, 30))} style={styles.timeStep}><MaterialIcons name="add" size={17} color={COLORS.forest} /></TouchableOpacity></View></View>; }
function toggleId(items: string[], id: string) { return items.includes(id) ? items.filter((item) => item !== id) : [...items, id]; }
function toggleNumber(items: number[], value: number) { return items.includes(value) ? items.filter((item) => item !== value) : [...items, value].sort(); }
function stepTime(value: string, step: number) { const [hours, minutes] = value.split(":").map(Number); const total = (((hours * 60 + minutes + step) % 1440) + 1440) % 1440; return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`; }
function formatDays(days: number[], english = false) { const labels = english ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] : ["日", "月", "火", "水", "木", "金", "土"]; if (days.length === 7) return english ? "Every day" : "毎日"; if ([1, 2, 3, 4, 5].every((day) => days.includes(day)) && days.length === 5) return english ? "Weekdays" : "平日"; return labels.filter((_, day) => days.includes(day)).join(english ? ", " : "・") || (english ? "Choose days" : "曜日を選択"); }

const styles: any = StyleSheet.create({
  content: { paddingTop: 16, paddingBottom: 34 }, modalBackdrop: { flex: 1, backgroundColor: "rgba(18, 35, 45, 0.52)", paddingHorizontal: 20, justifyContent: "center" }, modalCard: { backgroundColor: COLORS.white, borderRadius: 24, padding: 20, maxHeight: "88%" }, modalIcon: { width: 45, height: 45, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#E9F3FA" }, modalTitle: { color: COLORS.text, fontSize: 20, lineHeight: 27, fontWeight: "800", marginTop: 14 }, modalText: { color: "#3E596E", fontSize: 13, lineHeight: 20, marginTop: 10 }, modalEnglish: { color: "#5C7181", fontSize: 11, lineHeight: 16, marginTop: 11 }, modalPrimary: { minHeight: 48, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.forest, borderRadius: 13, marginTop: 17, paddingHorizontal: 10 }, modalPrimaryText: { color: COLORS.white, fontSize: 13, textAlign: "center", fontWeight: "800" }, modalSecondary: { minHeight: 44, alignItems: "center", justifyContent: "center", marginTop: 4 }, modalSecondaryText: { color: COLORS.muted, fontSize: 13, fontWeight: "800" }, sectionHeading: { marginTop: 22, marginBottom: 9 }, sectionTitle: { color: COLORS.text, fontSize: 17, fontWeight: "800" }, sectionDetail: { color: COLORS.muted, fontSize: 12, lineHeight: 17, marginTop: 3 }, card: { backgroundColor: COLORS.white, borderRadius: 19, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 15, overflow: "hidden" }, row: { minHeight: 71, flexDirection: "row", alignItems: "center", gap: 12 }, rowCopy: { flex: 1 }, rowTitle: { color: COLORS.text, fontSize: 15, fontWeight: "800" }, rowDescription: { color: COLORS.muted, fontSize: 12, lineHeight: 17, marginTop: 3 }, status: { flexDirection: "row", gap: 8, alignItems: "center", padding: 11, borderRadius: 13, marginBottom: 14 }, statusLocked: { backgroundColor: "#FFF2DD" }, statusOpen: { backgroundColor: "#E7F3ED" }, statusText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: "700" }, scheduleState: { flexDirection: "row", gap: 8, alignItems: "center", paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: "#EDF2EF" }, scheduleStateOn: { backgroundColor: "#F0F8F4" }, scheduleStateOff: { backgroundColor: "#F4F6F5" }, scheduleStateText: { fontSize: 12, fontWeight: "800" }, scheduleCard: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#EDF2EF" }, scheduleHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, scheduleTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800" }, scheduleDetail: { color: COLORS.muted, fontSize: 11, marginTop: 2 }, ruleHint: { flexDirection: "row", gap: 7, padding: 10, borderRadius: 11, backgroundColor: "#EEF4F8" }, ruleHintText: { color: "#46647D", flex: 1, fontSize: 11, lineHeight: 16, fontWeight: "600" }, dayPicker: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 }, dayChip: { width: 31, height: 31, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#EDF2EF" }, dayChipSelected: { backgroundColor: COLORS.forest }, dayChipText: { color: COLORS.muted, fontSize: 12, fontWeight: "800" }, dayChipTextSelected: { color: COLORS.white }, timeRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 13 }, timeControl: { flex: 1 }, timeLabel: { color: COLORS.muted, fontSize: 11, fontWeight: "700", marginBottom: 5 }, timeButtons: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F1F5F2", borderRadius: 12, padding: 4 }, timeStep: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.white }, timeValue: { color: COLORS.text, fontSize: 13, fontWeight: "800" }, removeSchedule: { alignSelf: "flex-end", paddingVertical: 10 }, removeScheduleText: { color: COLORS.error, fontSize: 12, fontWeight: "700" }, addSchedule: { minHeight: 49, flexDirection: "row", gap: 7, alignItems: "center", justifyContent: "center" }, addScheduleText: { color: COLORS.forest, fontSize: 13, fontWeight: "800" }, disclosureCard: { backgroundColor: "#E9F3FA", borderColor: "#B8D5E7", borderWidth: 1, borderRadius: 19, padding: 15, marginTop: 16 }, disclosureHeading: { flexDirection: "row", alignItems: "center", gap: 10 }, disclosureIcon: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#D5E9F5" }, disclosureEyebrow: { color: "#3B6683", fontSize: 11, fontWeight: "800" }, disclosureTitle: { color: "#173B59", fontSize: 16, lineHeight: 22, fontWeight: "800", marginTop: 1 }, disclosureText: { color: "#294C67", fontSize: 12, lineHeight: 18, marginTop: 13 }, disclosureEnglish: { color: "#4B6E86", fontSize: 11, lineHeight: 16, marginTop: 10 }, disclosureStatus: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 12 }, disclosureStatusText: { flex: 1, color: "#31576F", fontSize: 11, lineHeight: 16, fontWeight: "700" }, disclosureButton: { minHeight: 44, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 7, backgroundColor: COLORS.blue, borderRadius: 12, marginTop: 13 }, disclosureButtonText: { color: COLORS.white, fontSize: 13, fontWeight: "800" }, permissionCard: { flexDirection: "row", gap: 10, alignItems: "center", backgroundColor: "#EAF0F7", borderRadius: 19, padding: 14, marginTop: 11 }, permissionIcon: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#D8E5F2" }, permissionCopy: { flex: 1 }, permissionTitle: { color: COLORS.blue, fontSize: 13, fontWeight: "800" }, permissionDescription: { color: "#4B6681", fontSize: 11, lineHeight: 16, marginTop: 2 }, permissionButton: { minHeight: 36, paddingHorizontal: 10, borderRadius: 11, backgroundColor: COLORS.blue, justifyContent: "center" }, permissionButtonText: { color: COLORS.white, fontSize: 12, fontWeight: "800" }, loadingRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, paddingVertical: 20 }, loadingText: { color: COLORS.muted, fontSize: 13 }, notice: { flexDirection: "row", gap: 9, paddingVertical: 16, alignItems: "flex-start" }, noticeText: { color: COLORS.muted, flex: 1, fontSize: 13, lineHeight: 19 }, choiceRow: { flexDirection: "row", alignItems: "center", minHeight: 58, borderBottomColor: "#EEF2EF", borderBottomWidth: 1 }, choiceMark: { width: 25, height: 25, alignItems: "center", justifyContent: "center", borderRadius: 8, borderColor: "#B7C6BE", borderWidth: 1.4, marginRight: 11 }, choiceCopy: { flex: 1, minWidth: 0 }, choiceTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800" }, choiceDetail: { color: COLORS.muted, fontSize: 11, marginTop: 2 }, widgetCard: { backgroundColor: "#246B5A", borderRadius: 21, padding: 15 }, widgetPreview: { flexDirection: "row", alignItems: "center", backgroundColor: "#347A69", borderRadius: 16, padding: 14 }, widgetCount: { color: COLORS.white, fontSize: 25, fontWeight: "800" }, widgetCopy: { flex: 1, marginLeft: 13 }, widgetBrand: { color: "#DCEFE7", fontSize: 12, fontWeight: "800" }, widgetStatus: { color: COLORS.white, fontSize: 11, lineHeight: 16, marginTop: 3 }, widgetDescription: { color: "#D8EBE2", fontSize: 12, lineHeight: 18, marginTop: 12 }, widgetThemeEditor: { paddingVertical: 14, borderTopWidth: 1, borderTopColor: "#EAF0ED" }, widgetThemeHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, widgetThemeTitleWrap: { flexDirection: "row", alignItems: "center", gap: 9, flex: 1 }, widgetThemePreview: { width: 32, height: 32, borderRadius: 11, justifyContent: "flex-end", alignItems: "flex-end", padding: 4 }, widgetThemePreviewAccent: { width: 11, height: 11, borderRadius: 4, borderWidth: 1, borderColor: "rgba(255,255,255,0.74)" }, widgetThemeTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800" }, widgetThemeReset: { minHeight: 36, justifyContent: "center", paddingHorizontal: 9 }, widgetThemeResetText: { color: COLORS.forest, fontSize: 12, fontWeight: "800" }, widgetThemeLabel: { color: COLORS.muted, fontSize: 11, fontWeight: "800", marginTop: 11, marginBottom: 7 }, widgetThemeChoices: { flexDirection: "row", flexWrap: "wrap", gap: 6 }, colorChoice: { minHeight: 33, flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, borderWidth: 1, borderColor: "#D8E2DC", borderRadius: 10, backgroundColor: "#FBFCFB" }, colorChoiceSelected: { borderColor: COLORS.forest, backgroundColor: "#EEF7F2" }, colorSwatch: { width: 16, height: 16, borderRadius: 6, alignItems: "center", justifyContent: "center" }, colorChoiceText: { color: COLORS.muted, fontSize: 10, fontWeight: "800" }, colorChoiceTextSelected: { color: COLORS.forest }, preferenceLabel: { color: COLORS.text, fontSize: 13, fontWeight: "800", marginTop: 15, marginBottom: 8 }, preferenceHint: { color: COLORS.muted, fontSize: 11, lineHeight: 15, marginTop: -4, marginBottom: 8 }, segmented: { flexDirection: "row", gap: 6 }, segment: { flex: 1, minHeight: 39, justifyContent: "center", alignItems: "center", borderRadius: 11, backgroundColor: "#EDF2EF" }, segmentSelected: { backgroundColor: COLORS.forest }, segmentText: { color: COLORS.muted, fontSize: 12, fontWeight: "800" }, segmentTextSelected: { color: COLORS.white }, preview: { borderRadius: 14, padding: 14, marginTop: 18, marginBottom: 16 }, previewTitle: { color: COLORS.forest, fontSize: 18, fontWeight: "800" }, previewText: { color: "#416A5D", fontSize: 13, lineHeight: 19, marginTop: 3 },
});

Object.assign(styles, StyleSheet.create({
  planComparison: { paddingTop: 15, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: "#EAF0ED" },
  planComparisonHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 },
  planHeaderCopy: { flex: 1, minWidth: 0 },
  planComparisonEyebrow: { color: COLORS.forest, fontSize: 10, fontWeight: "900", letterSpacing: 0.6 },
  planComparisonTitle: { color: COLORS.text, fontSize: 17, lineHeight: 23, fontWeight: "900", marginTop: 2 },
  planActiveBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, minHeight: 28, borderRadius: 14, backgroundColor: "#E4F3E9" },
  planActiveBadgeText: { color: COLORS.success, fontSize: 11, fontWeight: "900" },
  planGrid: { flexDirection: "row", gap: 8, alignItems: "stretch" },
  planCard: { flex: 1, minWidth: 0, borderRadius: 15, padding: 11, borderWidth: 1, borderColor: "#DCE6E0", backgroundColor: "#F8FBF9" },
  planCardPlus: { borderColor: "#78A997", backgroundColor: "#EDF8F2" },
  planName: { color: COLORS.text, fontSize: 15, fontWeight: "900" },
  planCaption: { color: COLORS.muted, fontSize: 10, lineHeight: 14, minHeight: 30, marginTop: 2, marginBottom: 7 },
  planFeature: { flexDirection: "row", alignItems: "flex-start", gap: 5, marginTop: 6 },
  planFeatureText: { flex: 1, minWidth: 0, color: "#4F6860", fontSize: 10, lineHeight: 14, fontWeight: "700" },
  planFeatureTextPlus: { color: "#155B45" },
  planFootnote: { color: COLORS.muted, fontSize: 11, lineHeight: 16, marginTop: 10 },
  planPlatformNote: { flexDirection: "row", gap: 6, alignItems: "flex-start", marginTop: 9, padding: 9, borderRadius: 11, backgroundColor: "#EEF4F8" },
  planPlatformNoteText: { flex: 1, minWidth: 0, color: "#46647D", fontSize: 11, lineHeight: 16, fontWeight: "700" },
  iosInfoCard: { flexDirection: "row", gap: 11, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: "#B8D5E7", backgroundColor: "#EAF4FA", marginTop: 16 },
  iosInfoIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#D7EAF6" },
  iosInfoCopy: { flex: 1, minWidth: 0 },
  iosInfoTitle: { color: "#173B59", fontSize: 14, lineHeight: 20, fontWeight: "900" },
  iosInfoText: { color: "#3D6077", fontSize: 12, lineHeight: 18, marginTop: 3 },
  themePlanRow: { display: "none" },
  themePlanRowLegacy: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#EAF0ED" },
  plusPill: { minHeight: 28, paddingHorizontal: 9, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#E7EDF3" },
  plusPillActive: { backgroundColor: "#E4F3E9" },
  plusPillText: { color: COLORS.forest, fontSize: 11, fontWeight: "900" },
  appThemeChoices: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  fontChoices: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  appThemeChoice: { width: "31.5%", minHeight: 68, padding: 8, borderRadius: 13, borderWidth: 1, borderColor: "#D8E2DC", backgroundColor: "#FCFDFC" },
  fontChoice: { width: "48.5%", minHeight: 68, padding: 8, borderRadius: 13, borderWidth: 1, borderColor: "#D8E2DC", backgroundColor: "#FCFDFC" },
  appThemeChoiceSelected: { borderColor: COLORS.forest, backgroundColor: "#EFF8F3" },
  appThemeChoiceLocked: { opacity: 0.58 },
  appThemeSwatch: { height: 25, borderRadius: 8, borderWidth: 1, padding: 4, justifyContent: "flex-end", alignItems: "flex-end" },
  appThemeSwatchAccent: { width: 9, height: 9, borderRadius: 4 },
  appThemeChoiceText: { color: COLORS.muted, fontSize: 10, fontWeight: "800", marginTop: 5 },
  appThemeChoiceTextSelected: { color: COLORS.forest },
  fontChoiceSample: { color: COLORS.text, fontSize: 13, lineHeight: 19, fontWeight: "700", minHeight: 22 },
  segmentLocked: { opacity: 0.5 },
  themeSetComposer: { flexDirection: "row", gap: 8, alignItems: "center" },
  themeSetInput: { flex: 1, minHeight: 42, borderRadius: 12, borderWidth: 1, borderColor: "#D8E2DC", paddingHorizontal: 11, color: COLORS.text, fontSize: 13, backgroundColor: "#FBFCFB" },
  themeSetSave: { minHeight: 42, paddingHorizontal: 13, borderRadius: 12, backgroundColor: COLORS.forest, alignItems: "center", justifyContent: "center" },
  themeSetSaveText: { color: COLORS.white, fontSize: 12, fontWeight: "800" },
  themeSetRow: { flexDirection: "row", alignItems: "center", minHeight: 56, borderBottomWidth: 1, borderBottomColor: "#EAF0ED" },
  themeSetApply: { flex: 1, paddingVertical: 9 },
  themeSetName: { color: COLORS.text, fontSize: 13, fontWeight: "800" },
  themeSetMeta: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  themeSetRemove: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  plusNote: { color: COLORS.muted, fontSize: 11, lineHeight: 16, marginVertical: 12 },
  plusLegalLinks: { flexDirection: "row", flexWrap: "wrap", gap: 13, paddingTop: 12, paddingBottom: 2 },
  plusLegalLink: { minHeight: 30, justifyContent: "center" },
  plusLegalLinkText: { color: COLORS.blue, fontSize: 11, fontWeight: "800", textDecorationLine: "underline" },
  preferenceHeader: { marginTop: 18 },
  appearanceDivider: { height: 1, backgroundColor: "#EAF0ED", marginTop: 22, marginBottom: 2 },
}));

Object.assign(styles, StyleSheet.create({
  plusActionArea: { paddingTop: 14, gap: 10 },
  plusPrimary: { minHeight: 50, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: COLORS.forest, paddingHorizontal: 14 },
  plusPrimaryText: { color: COLORS.white, fontSize: 14, fontWeight: "900", textAlign: "center" },
  plusBusy: { flexDirection: "row", gap: 8, alignItems: "center", padding: 12, borderRadius: 12, backgroundColor: "#EEF4F8" },
  plusBusyText: { flex: 1, minWidth: 0, color: "#46647D", fontSize: 12, lineHeight: 17, fontWeight: "700" },
  plusUnavailable: { color: "#46647D", fontSize: 12, lineHeight: 18, padding: 12, borderRadius: 12, backgroundColor: "#EEF4F8" },
  plusSecondaryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  plusSecondary: { flexGrow: 1, minWidth: "44%", minHeight: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: "#B9CBC1", backgroundColor: COLORS.white },
  plusSecondaryText: { color: COLORS.forest, fontSize: 12, fontWeight: "900", textAlign: "center" },
  plusLegalLinks: { flexDirection: "column", gap: 2, paddingTop: 12, paddingBottom: 4 },
  plusLegalLink: { width: "100%", minHeight: 40, justifyContent: "center", paddingVertical: 5 },
  plusLegalLinkText: { color: COLORS.blue, fontSize: 12, lineHeight: 17, fontWeight: "800", textDecorationLine: "underline" },
  modalScrollContent: { paddingBottom: 2 },
}));
