import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Alert } from "../utils/alert";
import { communityService, TeamGearOrderDetail, TeamGearOrderItem } from "../services/community.service";
import { useTheme, DEFAULT_ACCENT } from "../store/ThemeContext";
import { hexToRgba } from "../utils/color";

export default function TeamGearOrderScreen({ route, navigation }: any) {
  const { orderId } = route.params || {};
  const { accent } = useTheme();
  const [detail, setDetail] = useState<TeamGearOrderDetail | null>(null);
  const [selections, setSelections] = useState<Record<string, { variant?: string; quantity: string }>>({});
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);

  const load = () =>
    communityService
      .gearOrder(orderId)
      .then(setDetail)
      .catch(() => {
        Alert.alert("Couldn't load this order", "Please try again in a moment.");
        navigation.goBack();
      });
  useEffect(() => {
    load();
  }, [orderId]);

  if (!detail)
    return (
      <View style={s.center}>
        <ActivityIndicator color={accent} />
      </View>
    );
  const { order, items, myPicks, itemTotals, isManager, tally } = detail;
  const isOpen = order.status === "open" && !(order.closesAt && new Date(order.closesAt) < new Date());
  const myPickFor = (itemId: string) => myPicks.find((p) => p.itemId === itemId);
  const teamNameFor = (item: TeamGearOrderItem) => item.name;

  const submitPick = async (itemId: string) => {
    const sel = selections[itemId] || { quantity: "1" };
    setBusyItemId(itemId);
    try {
      await communityService.pickGearOrderItem(itemId, { variant: sel.variant, quantity: Number(sel.quantity) || 1 });
      await load();
    } catch (e: any) {
      Alert.alert(
        "Couldn't save your pick",
        e?.response?.data?.error?.message || e?.response?.data?.message || "Please try again in a moment.",
      );
    } finally {
      setBusyItemId(null);
    }
  };
  const removePick = async (itemId: string) => {
    setBusyItemId(itemId);
    try {
      await communityService.unpickGearOrderItem(itemId);
      await load();
    } catch {
      Alert.alert("Couldn't remove your pick", "Please try again in a moment.");
    } finally {
      setBusyItemId(null);
    }
  };
  const closeOrder = () => {
    Alert.alert("Close this order?", "Members won't be able to pick or change picks once it's closed.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Close order",
        style: "destructive",
        onPress: async () => {
          setClosing(true);
          try {
            await communityService.closeGearOrder(order.id);
            await load();
          } catch {
            Alert.alert("Couldn't close this order", "Please try again in a moment.");
          } finally {
            setClosing(false);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <Text style={s.title}>{order.title}</Text>
      {!!order.description && <Text style={s.body}>{order.description}</Text>}
      {!!order.closesAt && <Text style={s.meta}>Picks close {new Date(order.closesAt).toLocaleDateString()}</Text>}
      <Text style={s.disclaimer}>
        Your captain collects payment separately — this isn't a checkout. Picking an item just tells your captain what to
        order and in what size; pay them directly (Venmo, cash, however your team usually handles it).
      </Text>
      {!isOpen && <Text style={s.closedBanner}>This order is closed — picks are locked.</Text>}

      {items.map((item) => {
        const mine = myPickFor(item.id);
        const sel = selections[item.id] || { variant: mine?.variant, quantity: String(mine?.quantity || 1) };
        return (
          <View key={item.id} style={s.itemCard}>
            <View style={s.itemHeader}>
              <Text style={s.itemName}>{teamNameFor(item)}</Text>
              {item.priceCents != null && <Text style={[s.itemPrice, { color: accent }]}>${(item.priceCents / 100).toFixed(2)}</Text>}
            </View>
            {!!item.variantOptions?.length && (
              <View style={s.chipRow}>
                {item.variantOptions.map((v) => (
                  <Pressable
                    key={v}
                    style={[s.chip, sel.variant === v && { backgroundColor: accent, borderColor: accent }]}
                    onPress={() => setSelections((prev) => ({ ...prev, [item.id]: { ...sel, variant: v } }))}
                    disabled={!isOpen}
                  >
                    <Text style={[s.chipText, sel.variant === v && s.chipTextActive]}>{v}</Text>
                  </Pressable>
                ))}
              </View>
            )}
            <View style={s.qtyRow}>
              <Text style={s.qtyLabel}>Qty</Text>
              <TextInput
                style={s.qtyInput}
                value={sel.quantity}
                onChangeText={(v) => setSelections((prev) => ({ ...prev, [item.id]: { ...sel, quantity: v.replace(/[^0-9]/g, "") } }))}
                keyboardType="number-pad"
                editable={isOpen}
              />
              {mine && (
                <>
                  <Text style={[s.pickedBadge, { color: accent }]}>Picked: {mine.variant || "—"} × {mine.quantity}</Text>
                  {isOpen && (
                    <Pressable onPress={() => removePick(item.id)} disabled={busyItemId === item.id}>
                      <Text style={s.removeLink}>Unpick</Text>
                    </Pressable>
                  )}
                </>
              )}
              {isOpen && (
                <Pressable style={[s.pickBtn, { backgroundColor: accent }]} onPress={() => submitPick(item.id)} disabled={busyItemId === item.id}>
                  {busyItemId === item.id ? <ActivityIndicator size="small" color="#10140D" /> : <Text style={s.pickBtnText}>{mine ? "Update" : "Pick"}</Text>}
                </Pressable>
              )}
            </View>
            {!!itemTotals[item.id] && (
              <Text style={s.totalsLine}>
                {Object.entries(itemTotals[item.id].byVariant)
                  .map(([v, q]) => `${v}: ${q}`)
                  .join(" · ")}
              </Text>
            )}
          </View>
        );
      })}

      {isManager && (
        <View style={s.managerCard}>
          <View style={s.announceHeader}>
            <Text style={s.label}>MANAGER TALLY</Text>
            {order.status === "open" && (
              <Pressable onPress={closeOrder} disabled={closing}>
                <Text style={[s.announceToggle, { color: "#E8743B" }]}>{closing ? "Closing…" : "Close order"}</Text>
              </Pressable>
            )}
          </View>
          <Text style={s.body}>Use this to place the real order and check off who still owes you.</Text>
          {!tally?.length ? (
            <Text style={s.emptyAnnounce}>No picks yet.</Text>
          ) : (
            tally.map((p) => (
              <View key={p.id} style={s.tallyRow}>
                <Text style={s.tallyName}>{p.userName}</Text>
                <Text style={s.tallyDetail}>
                  {items.find((i) => i.id === p.itemId)?.name} — {p.variant || "—"} × {p.quantity}
                </Text>
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0A0E0F" },
  content: { width: "94%", maxWidth: 760, alignSelf: "center", padding: 22 },
  center: { flex: 1, backgroundColor: "#0A0E0F", alignItems: "center", justifyContent: "center" },
  title: { color: "#F3F1E8", fontSize: 28, fontWeight: "900" },
  body: { color: "#B8C1BC", fontSize: 14, lineHeight: 21, marginTop: 10 },
  meta: { color: "#75817B", fontSize: 12, marginTop: 8 },
  disclaimer: { color: "#75817B", fontSize: 11, lineHeight: 16, marginTop: 14, fontStyle: "italic" },
  closedBanner: {
    color: "#E8743B",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 14,
    borderWidth: 1,
    borderColor: "rgba(232,116,59,0.4)",
    borderRadius: 8,
    padding: 10,
  },
  itemCard: {
    marginTop: 16,
    backgroundColor: "#121819",
    borderWidth: 1,
    borderColor: "#293431",
    borderRadius: 14,
    padding: 16,
  },
  itemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  itemName: { color: "#F3F1E8", fontSize: 15, fontWeight: "800", flex: 1, marginRight: 10 },
  itemPrice: { fontSize: 13, fontWeight: "900" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  chip: {
    borderWidth: 1,
    borderColor: "#3B4645",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: { color: "#D6DDDA", fontSize: 12, fontWeight: "800" },
  chipTextActive: { color: "#10140D" },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12, flexWrap: "wrap" },
  qtyLabel: { color: "#75817B", fontSize: 11, fontWeight: "900" },
  qtyInput: {
    backgroundColor: "#171c20",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#364047",
    color: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: 56,
    textAlign: "center",
  },
  pickedBadge: { fontSize: 12, fontWeight: "900" },
  removeLink: { color: "#75817B", fontSize: 12, fontWeight: "800", textDecorationLine: "underline" },
  pickBtn: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, marginLeft: "auto" },
  pickBtnText: { color: "#10150d", fontWeight: "900", fontSize: 12 },
  totalsLine: { color: "#75817B", fontSize: 11, marginTop: 10 },
  managerCard: {
    marginTop: 22,
    backgroundColor: "#121819",
    borderWidth: 1,
    borderColor: hexToRgba(DEFAULT_ACCENT, 0.35),
    borderRadius: 14,
    padding: 18,
  },
  announceHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  announceToggle: { fontSize: 12, fontWeight: "900" },
  label: { color: "#75817B", fontSize: 8, fontWeight: "900", letterSpacing: 1.2 },
  emptyAnnounce: { color: "#68737d", fontSize: 13, fontStyle: "italic", marginTop: 8 },
  tallyRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#29322F" },
  tallyName: { color: "#F3F1E8", fontSize: 13, fontWeight: "800" },
  tallyDetail: { color: "#B8C1BC", fontSize: 12, marginTop: 3 },
});
