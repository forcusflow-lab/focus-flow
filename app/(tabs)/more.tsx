import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { COLORS, ScreenHeading } from "@/components/focus-flow/ui";
import { ScaledText as Text } from "@/components/focus-flow/scaled-text";
import { ScreenContainer } from "@/components/screen-container";
import { isEnglish } from "@/lib/focus-flow/i18n";
import { useFocusFlow } from "@/lib/focus-flow/provider";

export default function MoreScreen() {
  const router = useRouter();
  const { displaySettings } = useFocusFlow();
  const english = isEnglish(displaySettings);
  const items = english ? [
    { route: "/(tabs)/insights", icon: "bar-chart" as const, title: "Review", description: "See this week's completion and required-item progress", tint: "#E7F0FF", color: COLORS.blue },
    { route: "/(tabs)/settings", icon: "tune" as const, title: "Settings", description: "Set app limits, routines, language, and appearance", tint: "#E3F3EF", color: COLORS.forest },
    { route: "/privacy", icon: "privacy-tip" as const, title: "Privacy & beta", description: "Read how accessibility, on-device data, and feedback work", tint: "#E9F3FA", color: COLORS.blue },
    { route: "/support", icon: "help-outline" as const, title: "FAQ & support", description: "Get help and share a structured beta bug report", tint: "#F0F5E9", color: COLORS.forest },
  ] : [
    { route: "/(tabs)/insights", icon: "bar-chart" as const, title: "振り返り", description: "今週の完了状況と必須項目の進み方を見る", tint: "#E7F0FF", color: COLORS.blue },
    { route: "/(tabs)/settings", icon: "tune" as const, title: "設定", description: "アプリ制限、日課ルール、言語、表示を整える", tint: "#E3F3EF", color: COLORS.forest },
    { route: "/privacy", icon: "privacy-tip" as const, title: "プライバシーとベータ案内", description: "アクセシビリティの利用目的、端末内データ、フィードバック方法を見る", tint: "#E9F3FA", color: COLORS.blue },
    { route: "/support", icon: "help-outline" as const, title: "FAQ・サポート", description: "英語FAQと、ベータ版の不具合報告テンプレートを開く", tint: "#F0F5E9", color: COLORS.forest },
  ];
  return <ScreenContainer className="px-5" containerClassName="bg-background"><View style={styles.content}><ScreenHeading eyebrow={english ? "Make it yours" : "アプリを整える"} title={english ? "Manage" : "管理"} />{items.map((item) => <TouchableOpacity key={item.route} accessibilityRole="button" onPress={() => router.push(item.route as never)} activeOpacity={0.76} style={styles.card}><View style={[styles.icon, { backgroundColor: item.tint }]}><MaterialIcons name={item.icon} size={22} color={item.color} /></View><View style={styles.copy}><Text style={styles.title}>{item.title}</Text><Text style={styles.description} numberOfLines={2}>{item.description}</Text></View><MaterialIcons name="chevron-right" size={23} color={COLORS.muted} /></TouchableOpacity>)}</View></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { paddingTop: 16 }, card: { minHeight: 84, flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.82)", borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, padding: 14, marginBottom: 10 }, icon: { width: 46, height: 46, alignItems: "center", justifyContent: "center", borderRadius: 15, marginRight: 13 }, copy: { flex: 1, minWidth: 0 }, title: { color: COLORS.text, fontSize: 16, lineHeight: 22, fontWeight: "800" }, description: { color: COLORS.muted, fontSize: 13, lineHeight: 19, marginTop: 3 } });
