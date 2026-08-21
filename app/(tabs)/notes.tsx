import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useState } from "react";
import { Alert, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

import { COLORS, EmptyState, IconButton, LoadingScreen, safeHaptic, ScreenHeading } from "@/components/focus-flow/ui";
import { ScaledText as Text } from "@/components/focus-flow/scaled-text";
import { ScreenContainer } from "@/components/screen-container";
import { getAppLanguage, localized } from "@/lib/focus-flow/i18n";
import { useFocusFlow } from "@/lib/focus-flow/provider";
import type { Memo } from "@/lib/focus-flow/types";

export default function NotesScreen() {
  const { memos, displaySettings, isReady, addMemo, updateMemo, deleteMemo, addTodo } = useFocusFlow();
  const language = getAppLanguage(displaySettings);
  const t = (ja: string, en: string) => localized(language, ja, en);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Memo | undefined>();

  const openForm = (memo?: Memo) => { setEditing(memo); setFormOpen(true); };
  const closeForm = () => { setFormOpen(false); setEditing(undefined); };
  const remove = (memo: Memo) => {
    const confirm = () => deleteMemo(memo.id);
    if (Platform.OS === "web") confirm();
    else Alert.alert(t("メモを削除しますか？", "Delete this note?"), t("削除したメモは復元できません。", "Deleted notes cannot be restored."), [{ text: t("キャンセル", "Cancel"), style: "cancel" }, { text: t("削除", "Delete"), style: "destructive", onPress: confirm }]);
  };
  const showFreeLimit = (kind: string) => Alert.alert(t("無料版の上限です", "Free plan limit"), t(`${kind}は無料版では2件までです。Plusでは無制限に追加できます。`, `The free plan allows up to 2 ${kind.toLowerCase()}. Plus removes this limit.`));
  const convert = (memo: Memo) => {
    const confirm = () => {
      const result = addTodo({ title: memo.title, priority: "medium", isRequired: false });
      if (!result.ok) { showFreeLimit(t("Todo", "Tasks")); return; }
      safeHaptic("success");
    };
    if (Platform.OS === "web") confirm();
    else Alert.alert(t("Todoに追加", "Add to tasks"), t(`「${memo.title}」を通常のTodoとして追加します。`, `Add “${memo.title}” as a regular task?`), [{ text: t("キャンセル", "Cancel"), style: "cancel" }, { text: t("追加", "Add"), onPress: confirm }]);
  };

  if (!isReady) return <ScreenContainer><LoadingScreen /></ScreenContainer>;

  return <ScreenContainer className="px-5" containerClassName="bg-background">
    <FlatList
      data={memos}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={<ScreenHeading eyebrow={t("あとで整理する", "Capture for later")} title={t("メモ", "Notes")} action={<IconButton icon="add" label={t("メモを追加", "Add note")} onPress={() => openForm()} variant="filled" />} />}
      ListEmptyComponent={<EmptyState icon="sticky-note-2" title={t("気になったことをすぐ残す", "Save an idea right away")} description={t("まだTodoにしない情報、考え、調べたいことを自由にメモできます。", "Keep thoughts, research ideas, and anything you do not want to turn into a task yet.")} actionLabel={t("メモを追加", "Add note")} onAction={() => openForm()} />}
      renderItem={({ item }) => <View style={styles.memoCard}><TouchableOpacity onPress={() => openForm(item)} activeOpacity={0.76} style={styles.memoCopy}><Text style={styles.memoTitle} numberOfLines={1}>{item.title}</Text>{item.body ? <Text style={styles.memoBody} numberOfLines={3}>{item.body}</Text> : null}<Text style={styles.memoDate}>{new Date(item.updatedAt).toLocaleDateString(language === "en" ? "en-US" : "ja-JP", { month: language === "en" ? "short" : "numeric", day: "numeric" })} {t("更新", "updated")}</Text></TouchableOpacity><View style={styles.actions}><TouchableOpacity accessibilityLabel={t("Todoとして追加", "Add as task")} onPress={() => convert(item)} style={styles.action}><MaterialIcons name="playlist-add" size={20} color={COLORS.blue} /></TouchableOpacity><TouchableOpacity accessibilityLabel={t("メモを削除", "Delete note")} onPress={() => remove(item)} style={styles.action}><MaterialIcons name="delete-outline" size={21} color={COLORS.muted} /></TouchableOpacity></View></View>}
    />
    <MemoForm visible={formOpen} memo={editing} onClose={closeForm} onSave={(input) => {
      const result = editing ? updateMemo(editing.id, input) : addMemo(input);
      if (!result.ok) showFreeLimit(t("メモ", "Notes"));
      return result;
    }} />
  </ScreenContainer>;
}

function MemoForm({ visible, memo, onClose, onSave }: { visible: boolean; memo?: Memo; onClose: () => void; onSave: (input: { title?: string; body: string }) => { ok: boolean } }) {
  const { displaySettings } = useFocusFlow();
  const language = getAppLanguage(displaySettings);
  const t = (ja: string, en: string) => localized(language, ja, en);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (visible) { setTitle(memo?.title ?? ""); setBody(memo?.body ?? ""); }
  }, [visible, memo]);

  const save = () => {
    if (!title.trim() && !body.trim()) return;
    const result = onSave({ title, body });
    if (result.ok) onClose();
  };

  return <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoider}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <View style={styles.handle} />
          <View style={styles.formHeader}><Text style={styles.formTitle}>{memo ? t("メモを編集", "Edit note") : t("メモを追加", "Add note")}</Text><TouchableOpacity accessibilityLabel={t("閉じる", "Close")} onPress={onClose} style={styles.close}><MaterialIcons name="close" size={20} color={COLORS.muted} /></TouchableOpacity></View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.formBody}>
            <Text style={styles.fieldLabel}>{t("タイトル", "Title")}</Text>
            <TextInput value={title} onChangeText={setTitle} placeholder={t("タイトル（任意）", "Title (optional)")} placeholderTextColor="#91A0B7" style={styles.titleInput} autoFocus={!memo} returnKeyType="next" />
            <Text style={styles.fieldLabel}>{t("メモ", "Note")}</Text>
            <TextInput value={body} onChangeText={setBody} placeholder={t("思いつき、調べたいこと、あとで決めること…", "An idea, something to research, or a decision for later…")} placeholderTextColor="#91A0B7" style={styles.bodyInput} multiline textAlignVertical="top" />
            <TouchableOpacity onPress={save} disabled={!title.trim() && !body.trim()} style={[styles.save, !title.trim() && !body.trim() && styles.saveDisabled]}><Text style={styles.saveText}>{memo ? t("変更を保存", "Save changes") : t("メモを保存", "Save note")}</Text></TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>
    </KeyboardAvoidingView>
  </Modal>;
}

const styles = StyleSheet.create({
  keyboardAvoider: { flex: 1 },
  content: { paddingTop: 16, paddingBottom: 28, flexGrow: 1 },
  memoCard: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.78)", borderColor: "#D7E1F0", borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 9 },
  memoCopy: { flex: 1, minWidth: 0 },
  memoTitle: { color: COLORS.text, fontSize: 16, lineHeight: 21, fontWeight: "800" },
  memoBody: { color: COLORS.muted, fontSize: 13, lineHeight: 19, marginTop: 5 },
  memoDate: { color: "#7B8AA3", fontSize: 11, fontWeight: "700", marginTop: 9 },
  actions: { width: 37, alignItems: "center", gap: 4 },
  action: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "#EDF3FB" },
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(22,35,59,0.34)" },
  sheet: { maxHeight: "94%", backgroundColor: "#F4F8FE", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingBottom: 16 },
  handle: { alignSelf: "center", width: 42, height: 5, borderRadius: 3, backgroundColor: "#C8D5E8", marginTop: 10, marginBottom: 16 },
  formHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  formTitle: { color: COLORS.text, fontSize: 20, fontWeight: "800" },
  close: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: "#E9F0FA" },
  formBody: { paddingBottom: 8 },
  fieldLabel: { color: COLORS.text, fontSize: 13, fontWeight: "800", marginBottom: 7 },
  titleInput: { minHeight: 50, borderRadius: 13, borderWidth: 1, borderColor: "#D7E1F0", backgroundColor: "rgba(255,255,255,0.92)", color: COLORS.text, fontSize: 16, paddingHorizontal: 13, marginBottom: 14 },
  bodyInput: { minHeight: 154, borderRadius: 13, borderWidth: 1, borderColor: "#D7E1F0", backgroundColor: "rgba(255,255,255,0.92)", color: COLORS.text, fontSize: 15, lineHeight: 22, padding: 13 },
  save: { minHeight: 51, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: COLORS.forest, marginTop: 16 },
  saveDisabled: { backgroundColor: "#AAB8C9" },
  saveText: { color: COLORS.white, fontSize: 16, fontWeight: "800" },
});
