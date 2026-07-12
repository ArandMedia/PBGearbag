import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ProfileWidget } from "../../services/widgets.service";
import { WidgetContext, WidgetRenderer } from "../WidgetCards";

const LIME = "#A8C84A";
const PANEL = "#121819";

interface Props {
  isPro: boolean;
  widgets: ProfileWidget[];
  ctx: WidgetContext;
  onUpgrade: () => void;
  onManage: () => void;
}

export default function ProWidgetsBlock({ isPro, widgets, ctx, onUpgrade, onManage }: Props) {
  if (!isPro) {
    return (
      <View style={[s.card, s.upsell]}>
        <Text style={s.eyebrow}>PBG PRO</Text>
        <Text style={s.heading}>Bring your profile widgets to your Home screen</Text>
        <Text style={s.body}>
          Stats, achievements, your team card, social links — the widgets you build on your profile can live
          here too, front and center every time you open the app.
        </Text>
        <Pressable style={s.upgradeBtn} onPress={onUpgrade}>
          <Text style={s.upgradeBtnText}>Upgrade to Pro</Text>
        </Pressable>
      </View>
    );
  }

  const visible = widgets.filter((w) => w.isVisible);
  return (
    <View>
      <View style={s.header}>
        <View>
          <Text style={s.eyebrow}>YOUR WIDGETS</Text>
          <Text style={s.heading}>Your profile, on your Home screen</Text>
        </View>
        <Pressable onPress={onManage}>
          <Text style={s.seeAll}>Manage →</Text>
        </Pressable>
      </View>
      {!visible.length ? (
        <View style={s.card}>
          <Text style={s.body}>
            No widgets are visible yet. Add some from your profile's "Customize widgets" screen and they'll show
            up here too.
          </Text>
        </View>
      ) : (
        <View style={s.grid}>
          {visible.map((widget) => (
            <View key={widget.id} style={s.widgetWrap}>
              <WidgetRenderer widget={widget} ctx={ctx} />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: PANEL, borderWidth: 1, borderColor: "#252c32", borderRadius: 20, padding: 22 },
  upsell: { borderColor: "rgba(168,200,74,.35)" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  eyebrow: { color: LIME, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  heading: { color: "#fff", fontSize: 19, fontWeight: "900", marginTop: 6 },
  body: { color: "#8e99a2", fontSize: 13, lineHeight: 19, marginTop: 10, maxWidth: 480 },
  seeAll: { color: LIME, fontSize: 12, fontWeight: "800" },
  upgradeBtn: { alignSelf: "flex-start", backgroundColor: LIME, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12, marginTop: 16 },
  upgradeBtnText: { color: "#10150d", fontWeight: "900", fontSize: 13 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  widgetWrap: { flexGrow: 1, flexBasis: 260, minWidth: 240 },
});
