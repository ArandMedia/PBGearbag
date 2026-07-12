import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "../store/AuthContext";
import { Alert } from "../utils/alert";
import { billingService, BillingStatus } from "../services/billing.service";
import {
  ProfileWidget,
  WidgetDefinition,
  widgetsService,
} from "../services/widgets.service";

const TURF = "#A8C84A",
  INK = "#0A0E0F",
  PANEL = "#121819",
  ORANGE = "#E8743B";

function relevantTags(playStyle?: string[]): string[] {
  return ["universal", ...(playStyle || [])];
}

export default function CustomizeWidgetsScreen() {
  const { user } = useAuth();
  const [catalog, setCatalog] = useState<WidgetDefinition[]>([]);
  const [mine, setMine] = useState<ProfileWidget[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [upgradeBusy, setUpgradeBusy] = useState(false);

  const load = () =>
    Promise.all([widgetsService.catalog(), widgetsService.mine()]).then(
      ([c, m]) => {
        setCatalog(c);
        setMine(m);
      },
    );

  useEffect(() => {
    load().finally(() => setLoading(false));
    billingService.getStatus().then(setBilling).catch(() => {});
  }, []);

  const isPro = !!billing?.isPro;

  const upgrade = async () => {
    setUpgradeBusy(true);
    try {
      const url = await billingService.startCheckout("monthly");
      await Linking.openURL(url);
    } catch {
      Alert.alert("Couldn't start checkout", "Please try again in a moment.");
    } finally {
      setUpgradeBusy(false);
    }
  };

  const requirePro = (): boolean => {
    if (isPro) return true;
    Alert.alert(
      "Unlock custom widgets",
      "Adding profile widgets is a PBG Pro feature — pick from loadout, stats, achievements, social links, and more for $4/mo or $24/yr.",
      [
        { text: "Not now", style: "cancel" },
        { text: "Upgrade", onPress: upgrade },
      ],
    );
    return false;
  };

  const addedKeys = new Set(mine.map((w) => w.widgetKey));
  const tags = relevantTags(user?.playStyle);
  const suggested = catalog.filter(
    (c) => !addedKeys.has(c.key) && c.tags.some((t) => tags.includes(t)),
  );
  const others = catalog.filter(
    (c) => !addedKeys.has(c.key) && !c.tags.some((t) => tags.includes(t)),
  );

  const add = async (key: string) => {
    if (!requirePro()) return;
    setBusyKey(key);
    try {
      await widgetsService.add(key);
      await load();
    } catch {
      // no-op, list just won't update
    } finally {
      setBusyKey(null);
    }
  };

  const remove = async (id: string) => {
    setBusyKey(id);
    try {
      await widgetsService.remove(id);
      await load();
    } finally {
      setBusyKey(null);
    }
  };

  const toggleVisible = async (w: ProfileWidget) => {
    setMine((prev) =>
      prev.map((x) => (x.id === w.id ? { ...x, isVisible: !x.isVisible } : x)),
    );
    await widgetsService.update(w.id, { isVisible: !w.isVisible });
  };

  const move = async (index: number, dir: -1 | 1) => {
    const next = [...mine];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setMine(next);
    await widgetsService.reorder(next.map((w) => w.id));
  };

  const saveConfig = async (id: string, config: Record<string, any>) => {
    await widgetsService.update(id, { config });
    setEditingId(null);
    await load();
  };

  if (loading)
    return (
      <View style={s.center}>
        <ActivityIndicator color={TURF} />
      </View>
    );

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <Text style={s.eyebrow}>PROFILE WIDGETS</Text>
      <Text style={s.heading}>Customize your profile</Text>
      <Text style={s.subhead}>
        Attach widgets that fit how you play. Reorder, hide, or remove them
        anytime.
      </Text>

      {!isPro && (
        <View style={s.upsell}>
          <View style={s.upsellIcon}>
            <Ionicons name="star" size={16} color={ORANGE} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.upsellTitle}>Adding widgets is a Pro feature</Text>
            <Text style={s.upsellText}>
              Upgrade for $4/mo or $24/yr to add new widgets. Any widgets you
              already have keep working — reorder, hide, or edit them below.
            </Text>
          </View>
          <Pressable style={s.upsellBtn} onPress={upgrade} disabled={upgradeBusy}>
            {upgradeBusy ? (
              <ActivityIndicator size="small" color="#10140D" />
            ) : (
              <Text style={s.upsellBtnText}>UPGRADE</Text>
            )}
          </Pressable>
        </View>
      )}

      <Text style={s.sectionTitle}>YOUR WIDGETS ({mine.length})</Text>
      {mine.length === 0 && (
        <Text style={s.empty}>No widgets yet — add some below.</Text>
      )}
      {mine.map((w, i) => {
        const def = catalog.find((c) => c.key === w.widgetKey);
        const editing = editingId === w.id;
        return (
          <View key={w.id} style={s.row}>
            <View style={s.rowMain}>
              <View style={{ flex: 1 }}>
                <Text style={s.rowLabel}>{def?.label || w.widgetKey}</Text>
                <Text style={s.rowDesc} numberOfLines={1}>
                  {def?.description}
                </Text>
              </View>
              <View style={s.reorderCol}>
                <Pressable onPress={() => move(i, -1)} disabled={i === 0}>
                  <Ionicons
                    name="chevron-up"
                    size={16}
                    color={i === 0 ? "#3A4442" : "#B8C0BC"}
                  />
                </Pressable>
                <Pressable onPress={() => move(i, 1)} disabled={i === mine.length - 1}>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color={i === mine.length - 1 ? "#3A4442" : "#B8C0BC"}
                  />
                </Pressable>
              </View>
              <Switch
                value={w.isVisible}
                onValueChange={() => toggleVisible(w)}
                trackColor={{ false: "#293231", true: TURF }}
                thumbColor="#F3F1E8"
              />
              {def?.configFields.length ? (
                <Pressable
                  style={s.iconBtn}
                  onPress={() => setEditingId(editing ? null : w.id)}
                >
                  <Ionicons name="create-outline" size={16} color="#B8C0BC" />
                </Pressable>
              ) : null}
              <Pressable
                style={s.iconBtn}
                onPress={() => remove(w.id)}
                disabled={busyKey === w.id}
              >
                {busyKey === w.id ? (
                  <ActivityIndicator size="small" color="#B97861" />
                ) : (
                  <Ionicons name="trash-outline" size={16} color="#B97861" />
                )}
              </Pressable>
            </View>
            {editing && def && (
              <WidgetConfigEditor
                def={def}
                initial={w.config}
                onSave={(config) => saveConfig(w.id, config)}
                onCancel={() => setEditingId(null)}
              />
            )}
          </View>
        );
      })}

      {suggested.length > 0 && (
        <>
          <Text style={s.sectionTitle}>SUGGESTED FOR YOUR STYLE</Text>
          {suggested.map((c) => (
            <CatalogRow key={c.key} def={c} busy={busyKey === c.key} isPro={isPro} onAdd={() => add(c.key)} />
          ))}
        </>
      )}

      <Text style={s.sectionTitle}>ALL WIDGETS</Text>
      {others.map((c) => (
        <CatalogRow key={c.key} def={c} busy={busyKey === c.key} isPro={isPro} onAdd={() => add(c.key)} />
      ))}
      {others.length === 0 && suggested.length === 0 && mine.length === catalog.length && (
        <Text style={s.empty}>You've added every available widget.</Text>
      )}
    </ScrollView>
  );
}

function CatalogRow({
  def,
  busy,
  isPro,
  onAdd,
}: {
  def: WidgetDefinition;
  busy: boolean;
  isPro: boolean;
  onAdd: () => void;
}) {
  return (
    <View style={s.catalogRow}>
      <View style={{ flex: 1 }}>
        <Text style={s.rowLabel}>{def.label}</Text>
        <Text style={s.rowDesc}>{def.description}</Text>
      </View>
      <Pressable
        style={[s.addBtn, !isPro && s.addBtnLocked]}
        onPress={onAdd}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator size="small" color="#10140D" />
        ) : isPro ? (
          <Text style={s.addBtnText}>ADD</Text>
        ) : (
          <Ionicons name="lock-closed" size={13} color={ORANGE} />
        )}
      </Pressable>
    </View>
  );
}

// Renders a form driven by the widget's configFields — "list" fields become
// a repeatable primary/secondary pair editor shared by stats, achievements,
// and social links, each giving the two columns their own meaning.
function WidgetConfigEditor({
  def,
  initial,
  onSave,
  onCancel,
}: {
  def: WidgetDefinition;
  initial: Record<string, any>;
  onSave: (config: Record<string, any>) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<Record<string, any>>(() => ({ ...initial }));
  const listField = def.configFields.find((f) => f.type === "list");
  const [items, setItems] = useState<{ primary: string; secondary: string }[]>(
    () => (listField ? values[listField.key] || [] : []),
  );
  const textFields = def.configFields.filter((f) => f.type !== "list");

  const save = () => {
    const config = { ...values };
    if (listField) config[listField.key] = items.filter((x) => x.primary.trim());
    onSave(config);
  };

  return (
    <View style={s.editor}>
      {textFields.map((f) => (
        <View key={f.key} style={{ marginBottom: 10 }}>
          <Text style={s.label}>{f.label}</Text>
          <TextInput
            style={[s.input, f.type === "textarea" && s.textarea]}
            value={values[f.key] || ""}
            onChangeText={(t) => setValues((v) => ({ ...v, [f.key]: t }))}
            multiline={f.type === "textarea"}
            placeholder={f.label}
            placeholderTextColor="#666"
          />
        </View>
      ))}
      {listField && (
        <View>
          {items.map((item, i) => (
            <View key={i} style={s.pairRow}>
              <TextInput
                style={[s.input, s.pairInput]}
                value={item.primary}
                onChangeText={(t) =>
                  setItems((prev) => prev.map((x, idx) => (idx === i ? { ...x, primary: t } : x)))
                }
                placeholder="Label"
                placeholderTextColor="#666"
              />
              <TextInput
                style={[s.input, s.pairInput]}
                value={item.secondary}
                onChangeText={(t) =>
                  setItems((prev) => prev.map((x, idx) => (idx === i ? { ...x, secondary: t } : x)))
                }
                placeholder="Value"
                placeholderTextColor="#666"
              />
              <Pressable onPress={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}>
                <Ionicons name="close" size={18} color="#B97861" />
              </Pressable>
            </View>
          ))}
          <Pressable
            style={s.addRowBtn}
            onPress={() => setItems((prev) => [...prev, { primary: "", secondary: "" }])}
          >
            <Text style={s.addRowText}>＋ Add row</Text>
          </Pressable>
        </View>
      )}
      <View style={s.editorActions}>
        <Pressable onPress={onCancel}>
          <Text style={s.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable style={s.saveBtn} onPress={save}>
          <Text style={s.saveBtnText}>Save</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: INK },
  center: { flex: 1, backgroundColor: INK, alignItems: "center", justifyContent: "center" },
  content: { maxWidth: 780, width: "100%", alignSelf: "center", padding: 20, paddingBottom: 90 },
  eyebrow: { color: TURF, fontSize: 9, fontWeight: "900", letterSpacing: 1.4, marginTop: 6 },
  heading: { color: "#F3F1E8", fontSize: 26, fontWeight: "900", marginTop: 8 },
  subhead: { color: "#9DA9A3", fontSize: 13, marginTop: 8, lineHeight: 19, maxWidth: 560 },
  sectionTitle: {
    color: "#75817D",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginTop: 28,
    marginBottom: 10,
  },
  empty: { color: "#687470", fontSize: 12, fontStyle: "italic" },
  row: {
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: "#293231",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  rowMain: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowLabel: { color: "#E4E8E5", fontSize: 13, fontWeight: "800" },
  rowDesc: { color: "#6F7B77", fontSize: 10, marginTop: 2 },
  reorderCol: { alignItems: "center" },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#293231",
    alignItems: "center",
    justifyContent: "center",
  },
  catalogRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#0F1414",
    borderWidth: 1,
    borderColor: "#212A28",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  addBtn: {
    backgroundColor: TURF,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    minWidth: 60,
    alignItems: "center",
  },
  addBtnText: { color: "#10140D", fontSize: 10, fontWeight: "900" },
  addBtnLocked: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#5C4B2E" },
  upsell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 18,
    borderWidth: 1,
    borderColor: "#5C4B2E",
    backgroundColor: "#181410",
    borderRadius: 13,
    padding: 16,
  },
  upsellIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "rgba(232,116,59,.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  upsellTitle: { color: "#F3F1E8", fontSize: 13, fontWeight: "900" },
  upsellText: { color: "#9DA9A3", fontSize: 11, lineHeight: 16, marginTop: 3 },
  upsellBtn: {
    backgroundColor: ORANGE,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 74,
    alignItems: "center",
  },
  upsellBtnText: { color: "#10140D", fontSize: 10, fontWeight: "900" },
  editor: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#232C2A",
  },
  label: { color: "#9DA9A3", fontSize: 10, fontWeight: "800", marginBottom: 5 },
  input: {
    backgroundColor: "#0F1414",
    borderWidth: 1,
    borderColor: "#293231",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: "#F3F1E8",
    fontSize: 13,
  },
  textarea: { minHeight: 70, textAlignVertical: "top" },
  pairRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  pairInput: { flex: 1 },
  addRowBtn: { marginTop: 2, marginBottom: 4 },
  addRowText: { color: TURF, fontSize: 11, fontWeight: "800" },
  editorActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 16,
    marginTop: 8,
    alignItems: "center",
  },
  cancelText: { color: "#9DA9A3", fontSize: 12, fontWeight: "700" },
  saveBtn: { backgroundColor: ORANGE, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 9 },
  saveBtnText: { color: "#10140D", fontSize: 11, fontWeight: "900" },
});
