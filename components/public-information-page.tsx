import { Link } from "expo-router";
import { Linking, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { ScaledText as Text } from "@/components/focus-flow/scaled-text";
import { useFocusPalette } from "@/components/focus-flow/ui";

const SUPPORT_EMAIL = "forcus.flow@gmail.com";
const EFFECTIVE_DATE = "2026年8月19日";

type Section = {
  title: string;
  paragraphs: string[];
};

type PublicInformationPageProps = {
  title: string;
  updated?: boolean;
  sections: Section[];
  footer?: "legal" | "support";
};

function openSupportEmail() {
  void Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
}

export function PublicInformationPage({
  title,
  updated = false,
  sections,
  footer = "legal",
}: PublicInformationPageProps) {
  const palette = useFocusPalette();
  return (
    <ScrollView contentContainerStyle={styles.content} style={[styles.screen, { backgroundColor: palette.background }]}>
      <View style={styles.brandRow}>
        <View style={[styles.mark, { backgroundColor: palette.primary }]} />
        <Text style={[styles.brand, { color: palette.primary }]}>Focus Flow</Text>
      </View>

      <Text accessibilityRole="header" style={[styles.title, { color: palette.text }]}>{title}</Text>
      {updated ? <Text style={[styles.updated, { color: palette.muted }]}>最終更新日: {EFFECTIVE_DATE}</Text> : null}

      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text accessibilityRole="header" style={[styles.heading, { color: palette.text }]}>{section.title}</Text>
          {section.paragraphs.map((paragraph) => (
            <Text key={paragraph} style={[styles.body, { color: palette.text }]}>{paragraph}</Text>
          ))}
        </View>
      ))}

      {footer === "legal" ? (
        <View style={[styles.footerCard, { backgroundColor: palette.primarySoft, borderColor: palette.border }]}>
          <Text style={[styles.footerTitle, { color: palette.text }]}>お問い合わせ</Text>
          <Text style={[styles.body, { color: palette.text }]}>本ページに関するお問い合わせは、以下のメールアドレスまでお送りください。</Text>
          <Pressable accessibilityRole="link" onPress={openSupportEmail} style={({ pressed }) => [styles.emailButton, pressed && styles.pressed]}>
            <Text style={[styles.emailButtonText, { color: palette.primary }]}>{SUPPORT_EMAIL}</Text>
          </Pressable>
        </View>
      ) : (
        <View style={[styles.footerCard, { backgroundColor: palette.primarySoft, borderColor: palette.border }]}>
          <Text style={[styles.footerTitle, { color: palette.text }]}>プライバシーと利用条件</Text>
          <Text style={[styles.body, { color: palette.text }]}>Focus Flowのデータの取り扱いと利用条件は、以下のページで確認できます。</Text>
          <View style={styles.linkRow}>
            <Link accessibilityRole="link" href="/policy" style={[styles.inlineLink, { color: palette.primary }]}>プライバシーポリシー</Link>
            <Text style={[styles.dot, { color: palette.muted }]}>・</Text>
            <Link accessibilityRole="link" href="/terms" style={[styles.inlineLink, { color: palette.primary }]}>利用条件</Link>
          </View>
        </View>
      )}

      {Platform.OS === "web" ? <Text style={[styles.webNote, { color: palette.muted }]}>Focus Flow公式情報ページ</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F6F8F5",
  },
  content: {
    alignSelf: "center",
    maxWidth: 760,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 64,
    width: "100%",
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 28,
  },
  mark: {
    backgroundColor: "#287A62",
    borderRadius: 5,
    height: 16,
    width: 16,
  },
  brand: {
    color: "#287A62",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  title: {
    color: "#173F34",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.4,
    lineHeight: 39,
  },
  updated: {
    color: "#66736D",
    fontSize: 14,
    marginTop: 8,
  },
  section: {
    marginTop: 32,
  },
  heading: {
    color: "#173F34",
    fontSize: 19,
    fontWeight: "700",
    lineHeight: 27,
    marginBottom: 10,
  },
  body: {
    color: "#33443D",
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 12,
  },
  footerCard: {
    backgroundColor: "#E7F3EE",
    borderColor: "#C9E2D6",
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 36,
    padding: 20,
  },
  footerTitle: {
    color: "#173F34",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
  },
  emailButton: {
    alignSelf: "flex-start",
    marginTop: 4,
  },
  emailButtonText: {
    color: "#0D5D9D",
    fontSize: 16,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  pressed: {
    opacity: 0.65,
  },
  linkRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 2,
  },
  inlineLink: {
    color: "#0D5D9D",
    fontSize: 16,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  dot: {
    color: "#66736D",
    fontSize: 16,
    marginHorizontal: 4,
  },
  webNote: {
    color: "#82918A",
    fontSize: 12,
    marginTop: 24,
    textAlign: "center",
  },
});
