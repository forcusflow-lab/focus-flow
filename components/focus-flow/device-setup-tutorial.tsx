import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Modal, Platform, StyleSheet, TouchableOpacity, View } from "react-native";

import { ScaledText as Text } from "@/components/focus-flow/scaled-text";
import { COLORS } from "@/components/focus-flow/ui";
import { getAccessibilityStatus, isNativeGateAvailable, openAccessibilitySettings } from "@/lib/focus-flow/android-gate";

type DeviceSetupTutorialProps = {
  visible: boolean;
  english: boolean;
  onComplete: () => void;
};

type SetupStep = {
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  eyebrow: string;
  title: string;
  body: string;
  note?: string;
};

export function DeviceSetupTutorial({ visible, english, onComplete }: DeviceSetupTutorialProps) {
  const [step, setStep] = useState(0);
  const [accessibilityEnabled, setAccessibilityEnabled] = useState(false);
  const [checking, setChecking] = useState(false);
  const nativeAndroid = Platform.OS === "android" && isNativeGateAvailable();
  const isIOS = Platform.OS === "ios";

  useEffect(() => {
    if (!visible) return;
    setStep(0);
    if (!nativeAndroid) return;
    void getAccessibilityStatus().then(setAccessibilityEnabled).catch(() => setAccessibilityEnabled(false));
  }, [visible, nativeAndroid]);

  const androidSteps = useMemo<SetupStep[]>(() => english ? [
    { icon: "flag", eyebrow: "STEP 1 OF 4", title: "Pick one must-do", body: "Create one small task or habit that matters today. Must-dos are the only items that can unlock your selected apps." },
    { icon: "apps", eyebrow: "STEP 2 OF 4", title: "Choose a safe test app", body: "In Settings, choose one non-essential app to limit. Avoid banking, payment, messaging, or navigation apps while testing." },
    { icon: "accessibility-new", eyebrow: "STEP 3 OF 4", title: "Allow App limits", body: nativeAndroid ? "Open Android Accessibility settings, select Focus Flow, and allow the service. Focus Flow only checks when a selected app comes to the foreground." : "App limits work only in the installed Android build. After installing it, return here and allow the Focus Flow accessibility service.", note: nativeAndroid ? "You can turn this off anytime in Android settings." : "This preview cannot request Android permissions." },
    { icon: "shield", eyebrow: "STEP 4 OF 4", title: "Test with a way back", body: "Open your selected test app before you complete the must-do. If you need to get out, the limit screen offers a 10-minute safety pause. You can always reopen this guide from Manage." },
  ] : [
    { icon: "flag", eyebrow: "ステップ 1 / 4", title: "必須項目を1つ決める", body: "今日大切なTodoまたは習慣を1つ作ります。選択したアプリの解除条件になるのは「必須」にした項目だけです。" },
    { icon: "apps", eyebrow: "ステップ 2 / 4", title: "テスト用アプリを選ぶ", body: "設定から、制限するアプリを1つだけ選びます。テスト中は銀行・決済・連絡・地図アプリを選ばないでください。" },
    { icon: "accessibility-new", eyebrow: "ステップ 3 / 4", title: "アプリ制限を許可する", body: nativeAndroid ? "Androidのアクセシビリティ設定を開き、Focus Flowを選んで許可します。Focus Flowは、選択アプリが前面に開いたことだけを確認します。" : "アプリ制限は、インストール済みのAndroidビルドで利用できます。インストール後にこの画面へ戻り、Focus Flowのアクセシビリティサービスを許可してください。", note: nativeAndroid ? "Androidの設定からいつでもオフにできます。" : "このプレビューではAndroid権限を要求できません。" },
    { icon: "shield", eyebrow: "ステップ 4 / 4", title: "安全な戻り方も確認する", body: "必須項目を完了する前にテスト用アプリを開きます。もし誤って制限されたら、制限画面の「10分だけ安全停止する」を使えます。管理画面からこの案内をいつでも開き直せます。" },
  ], [english, nativeAndroid]);

  const steps = useMemo<SetupStep[]>(() => isIOS ? (english ? [
    { icon: "flag", eyebrow: "STEP 1 OF 4", title: "Pick one must-do", body: "Create one small task or habit that matters today. Must-dos keep your daily priorities clear." },
    { icon: "phone-iphone", eyebrow: "STEP 2 OF 4", title: "Use the core workflow", body: "Tasks, habits, notes, schedules, and progress tracking work on your iPhone. Start with those before changing any system settings." },
    { icon: "screen-lock-portrait", eyebrow: "STEP 3 OF 4", title: "About iPhone app limits", body: "This build does not lock other iPhone apps. That feature requires Apple Screen Time authorization and a separate iPhone implementation. You do not need to enable Android Accessibility on iPhone.", note: "Focus Flow will clearly ask for any iPhone permission if app limits become available." },
    { icon: "shield", eyebrow: "STEP 4 OF 4", title: "Use it with confidence", body: "No other apps are restricted on iPhone in this build. You can safely explore your must-dos, habits, and routines, then reopen this guide any time from Manage." },
  ] : [
    { icon: "flag", eyebrow: "ステップ 1 / 4", title: "必須項目を1つ決める", body: "今日大切なTodoまたは習慣を1つ作ります。必須項目で、その日の優先順位を分かりやすく保てます。" },
    { icon: "phone-iphone", eyebrow: "ステップ 2 / 4", title: "基本の流れを使ってみる", body: "iPhoneでは、Todo・習慣・メモ・日課・進捗管理を使えます。まずは端末の設定を変えずに、これらの機能から始めてください。" },
    { icon: "screen-lock-portrait", eyebrow: "ステップ 3 / 4", title: "iPhoneのアプリ制限について", body: "このビルドでは、iPhone上の他アプリを制限しません。この機能にはAppleのScreen Timeに関する許可と、iPhone向けの別実装が必要です。iPhoneではAndroidのアクセシビリティを有効にする必要はありません。", note: "iPhoneのアプリ制限が利用可能になった場合は、必要な許可をアプリ内で分かりやすく案内します。" },
    { icon: "shield", eyebrow: "ステップ 4 / 4", title: "安心して使い始める", body: "このiPhoneビルドで他アプリが制限されることはありません。必須Todo・習慣・日課を試し、必要になったら管理画面からこの案内を開き直せます。" },
  ]) : androidSteps, [androidSteps, english, isIOS]);
  const current = steps[step];
  const refreshAccessibility = async () => {
    if (!nativeAndroid) return;
    setChecking(true);
    try { setAccessibilityEnabled(await getAccessibilityStatus()); } finally { setChecking(false); }
  };
  const openAndroidSettings = async () => {
    if (!nativeAndroid) return;
    await openAccessibilitySettings();
    setTimeout(() => void refreshAccessibility(), 900);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onComplete}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: steps.length, now: step + 1 }} style={styles.progressPanel}>
            <View style={styles.progressSummary}><Text style={styles.progressCount}>{english ? `Step ${step + 1} of ${steps.length}` : `${steps.length}ステップ中 ${step + 1}`}</Text><Text style={styles.progressRemaining}>{english ? `${steps.length - step - 1} left` : `残り ${steps.length - step - 1}`}</Text></View>
            <View style={styles.stepper}>{steps.map((_, index) => <View key={index} style={styles.stepperItem}>{index > 0 ? <View style={[styles.stepConnector, index <= step && styles.stepConnectorDone]} /> : null}<View accessibilityLabel={english ? `Step ${index + 1}: ${index < step ? "complete" : index === step ? "current" : "upcoming"}` : `ステップ ${index + 1}: ${index < step ? "完了" : index === step ? "現在" : "未着手"}`} style={[styles.stepBadge, index < step && styles.stepBadgeDone, index === step && styles.stepBadgeCurrent]}>{index < step ? <MaterialIcons name="check" size={15} color={COLORS.white} /> : <Text style={[styles.stepNumber, index === step && styles.stepNumberCurrent]}>{index + 1}</Text>}</View></View>)}</View>
          </View>
          <View style={styles.iconWrap}><MaterialIcons name={current.icon} size={30} color={COLORS.forest} /></View>
          <Text style={styles.eyebrow}>{current.eyebrow}</Text>
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.body}>{current.body}</Text>
          {current.note ? <View style={styles.note}><MaterialIcons name="info-outline" size={17} color="#215B83" /><Text style={styles.noteText}>{current.note}</Text></View> : null}
          {step === 2 && nativeAndroid ? <View style={[styles.permissionStatus, accessibilityEnabled ? styles.permissionOn : styles.permissionOff]}><MaterialIcons name={accessibilityEnabled ? "check-circle" : "warning-amber"} size={19} color={accessibilityEnabled ? COLORS.success : COLORS.warning} /><View style={styles.permissionCopy}><Text style={styles.permissionTitle}>{accessibilityEnabled ? (english ? "Accessibility is on" : "アクセシビリティは有効です") : (english ? "Accessibility is not on yet" : "アクセシビリティは未設定です")}</Text><Text style={styles.permissionText}>{accessibilityEnabled ? (english ? "You can continue to choose a test app in Settings." : "設定からテスト用アプリを選べます。") : (english ? "Allow Focus Flow in Android settings, then check again." : "Androidの設定でFocus Flowを許可してから、もう一度確認してください。")}</Text></View></View> : null}
          {step === 2 && nativeAndroid && !accessibilityEnabled ? <TouchableOpacity accessibilityRole="button" onPress={() => void openAndroidSettings()} style={styles.secondaryAction}><MaterialIcons name="open-in-new" size={18} color={COLORS.blue} /><Text style={styles.secondaryActionText}>{english ? "Open Android settings" : "Androidの設定を開く"}</Text></TouchableOpacity> : null}
          {step === 2 && nativeAndroid ? <TouchableOpacity accessibilityRole="button" onPress={() => void refreshAccessibility()} style={styles.checkAction}>{checking ? <ActivityIndicator size="small" color={COLORS.muted} /> : <MaterialIcons name="refresh" size={17} color={COLORS.muted} />}<Text style={styles.checkActionText}>{english ? "Check status again" : "状態をもう一度確認"}</Text></TouchableOpacity> : null}
          <View style={styles.actions}>
            {step > 0 ? <TouchableOpacity accessibilityRole="button" onPress={() => setStep((value) => value - 1)} style={styles.backButton}><Text style={styles.backText}>{english ? "Back" : "戻る"}</Text></TouchableOpacity> : <TouchableOpacity accessibilityRole="button" onPress={onComplete} style={styles.backButton}><Text style={styles.backText}>{english ? "Set up later" : "あとで設定する"}</Text></TouchableOpacity>}
            <TouchableOpacity accessibilityRole="button" onPress={() => step === steps.length - 1 ? onComplete() : setStep((value) => value + 1)} style={styles.nextButton}><Text style={styles.nextText}>{step === steps.length - 1 ? (english ? "Finish guide" : "案内を完了") : (english ? "Continue" : "次へ")}</Text><MaterialIcons name={step === steps.length - 1 ? "check" : "arrow-forward"} size={18} color={COLORS.white} /></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(14, 30, 37, 0.52)" },
  sheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 22, paddingBottom: 30 },
  handle: { alignSelf: "center", width: 38, height: 4, borderRadius: 2, backgroundColor: "#D6E0DB", marginBottom: 18 },
  progressPanel: { marginBottom: 21 }, progressSummary: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 11 }, progressCount: { color: COLORS.forest, fontSize: 13, fontWeight: "800" }, progressRemaining: { color: COLORS.muted, fontSize: 12, fontWeight: "700" }, stepper: { flexDirection: "row", alignItems: "center" }, stepperItem: { flex: 1, flexDirection: "row", alignItems: "center" }, stepConnector: { height: 3, flex: 1, backgroundColor: "#DDE7E2" }, stepConnectorDone: { backgroundColor: COLORS.forest }, stepBadge: { width: 30, height: 30, alignItems: "center", justifyContent: "center", borderRadius: 15, backgroundColor: "#EEF3F0", borderWidth: 1, borderColor: "#D6E2DC" }, stepBadgeDone: { backgroundColor: COLORS.forest, borderColor: COLORS.forest }, stepBadgeCurrent: { backgroundColor: "#E3F2ED", borderWidth: 2, borderColor: COLORS.forest }, stepNumber: { color: COLORS.muted, fontSize: 13, fontWeight: "800" }, stepNumberCurrent: { color: COLORS.forest },
  iconWrap: { width: 58, height: 58, alignItems: "center", justifyContent: "center", borderRadius: 19, backgroundColor: "#E4F2EE" }, eyebrow: { color: COLORS.forest, fontSize: 12, fontWeight: "800", letterSpacing: 0.45, marginTop: 18 }, title: { color: COLORS.text, fontSize: 24, lineHeight: 31, fontWeight: "800", letterSpacing: -0.4, marginTop: 5 }, body: { color: "#415B54", fontSize: 15, lineHeight: 22, marginTop: 10 },
  note: { flexDirection: "row", gap: 8, alignItems: "flex-start", backgroundColor: "#EAF3F9", borderRadius: 13, padding: 11, marginTop: 15 }, noteText: { flex: 1, color: "#365E77", fontSize: 12, lineHeight: 17, fontWeight: "600" },
  permissionStatus: { flexDirection: "row", gap: 9, borderRadius: 14, padding: 12, marginTop: 15 }, permissionOn: { backgroundColor: "#E8F4EE" }, permissionOff: { backgroundColor: "#FFF4E3" }, permissionCopy: { flex: 1 }, permissionTitle: { color: COLORS.text, fontSize: 13, fontWeight: "800" }, permissionText: { color: COLORS.muted, fontSize: 12, lineHeight: 17, marginTop: 2 },
  secondaryAction: { minHeight: 46, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 7, backgroundColor: "#EAF3F9", borderRadius: 13, marginTop: 11 }, secondaryActionText: { color: COLORS.blue, fontSize: 13, fontWeight: "800" }, checkAction: { minHeight: 40, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 4 }, checkActionText: { color: COLORS.muted, fontSize: 12, fontWeight: "800" },
  actions: { flexDirection: "row", gap: 10, marginTop: 20 }, backButton: { flex: 1, minHeight: 50, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#EFF4F1" }, backText: { color: COLORS.forest, fontSize: 14, fontWeight: "800" }, nextButton: { flex: 1.25, minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 14, backgroundColor: COLORS.forest }, nextText: { color: COLORS.white, fontSize: 14, fontWeight: "800" },
});
