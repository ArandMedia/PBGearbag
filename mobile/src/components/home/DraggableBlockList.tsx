import React, { useEffect, useRef, useState } from "react";
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { HomeLayoutBlock } from "../../services/home.service";
import { useTheme } from "../../store/ThemeContext";

const ROW_HEIGHT = 60;

export interface BlockDef {
  key: string;
  label: string;
  hint?: string;
}

interface Props {
  catalog: BlockDef[];
  order: HomeLayoutBlock[];
  onChange: (order: HomeLayoutBlock[]) => void;
}

// Press-and-drag block reordering built on core RN PanResponder + Animated —
// not react-native-gesture-handler/reanimated. Both are installed and
// babel-configured but have zero usage anywhere else in this app, and
// gesture-handler's web support is unproven here; PanResponder+Animated is
// the exact primitive this screen's carousel already uses successfully on
// web. Rows are absolutely positioned and animate to index*ROW_HEIGHT so a
// dragged row can freely follow the finger while siblings slide to make room.
export default function DraggableBlockList({ catalog, order, onChange }: Props) {
  const { accent: LIME } = useTheme();
  const [localOrder, setLocalOrder] = useState(order);
  useEffect(() => setLocalOrder(order), [order]);

  const anims = useRef<Map<string, Animated.Value>>(new Map()).current;
  const getAnim = (key: string, index: number) => {
    if (!anims.has(key)) anims.set(key, new Animated.Value(index * ROW_HEIGHT));
    return anims.get(key)!;
  };

  useEffect(() => {
    localOrder.forEach((item, i) => {
      Animated.timing(getAnim(item.key, i), {
        toValue: i * ROW_HEIGHT,
        duration: 180,
        useNativeDriver: true,
      }).start();
    });
  }, [localOrder]);

  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const dragStartY = useRef(0);
  const orderRef = useRef(localOrder);
  orderRef.current = localOrder;

  const responders = useRef<Map<string, ReturnType<typeof PanResponder.create>>>(new Map()).current;
  const getResponder = (key: string) => {
    if (responders.has(key)) return responders.get(key)!;
    const responder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
      onPanResponderGrant: () => {
        setDraggingKey(key);
        const idx = orderRef.current.findIndex((i) => i.key === key);
        dragStartY.current = idx * ROW_HEIGHT;
      },
      onPanResponderMove: (_, g) => {
        getAnim(key, 0).setValue(dragStartY.current + g.dy);
        const target = Math.max(
          0,
          Math.min(orderRef.current.length - 1, Math.round((dragStartY.current + g.dy) / ROW_HEIGHT)),
        );
        const current = orderRef.current.findIndex((i) => i.key === key);
        if (target !== current) {
          const next = [...orderRef.current];
          const [moved] = next.splice(current, 1);
          next.splice(target, 0, moved);
          setLocalOrder(next);
        }
      },
      onPanResponderRelease: () => {
        const idx = orderRef.current.findIndex((i) => i.key === key);
        Animated.timing(getAnim(key, 0), {
          toValue: idx * ROW_HEIGHT,
          duration: 180,
          useNativeDriver: true,
        }).start();
        setDraggingKey(null);
        onChange(orderRef.current);
      },
    });
    responders.set(key, responder);
    return responder;
  };

  const toggleHidden = (key: string) => {
    const next = localOrder.map((o) => (o.key === key ? { ...o, hidden: !o.hidden } : o));
    setLocalOrder(next);
    onChange(next);
  };

  return (
    <View style={{ height: localOrder.length * ROW_HEIGHT, position: "relative" }}>
      {localOrder.map((item, i) => {
        const def = catalog.find((b) => b.key === item.key);
        if (!def) return null;
        const anim = getAnim(item.key, i);
        const isDragging = draggingKey === item.key;
        return (
          <Animated.View
            key={item.key}
            style={[
              s.row,
              {
                transform: [{ translateY: anim }],
                zIndex: isDragging ? 10 : 1,
                opacity: item.hidden ? 0.5 : 1,
                borderColor: isDragging ? LIME : "#252c32",
              },
            ]}
          >
            <View {...getResponder(item.key).panHandlers} style={s.handle}>
              <Ionicons name="reorder-three" size={22} color="#8e99a2" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>{def.label}</Text>
              {def.hint ? <Text style={s.hint}>{def.hint}</Text> : null}
            </View>
            <Pressable onPress={() => toggleHidden(item.key)} hitSlop={10}>
              <Ionicons name={item.hidden ? "eye-off-outline" : "eye-outline"} size={19} color="#8e99a2" />
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: ROW_HEIGHT - 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    backgroundColor: "#121819",
    borderWidth: 1,
    borderRadius: 12,
  },
  handle: { padding: 4, cursor: "grab" } as any,
  label: { color: "#fff", fontSize: 13, fontWeight: "800" },
  hint: { color: "#68737d", fontSize: 11, marginTop: 2 },
});
