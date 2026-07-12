import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { authService } from "../services/auth.service";

function backToApp() {
  if (typeof window !== "undefined") window.location.href = "/";
}

export default function ConfirmEmailChangeScreen({ token }: { token: string }) {
  const [status, setStatus] = useState<"pending" | "done" | "error">("pending");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authService
      .confirmEmailChange(token)
      .then(() => setStatus("done"))
      .catch((err: any) => {
        setStatus("error");
        setError(
          err.response?.data?.error?.message ||
            err.response?.data?.message ||
            "This link is invalid or expired.",
        );
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={s.page}>
      <View style={s.card}>
        <View style={s.mark}>
          <Text style={s.markText}>PBG</Text>
        </View>
        <Text style={s.kicker}>
          {status === "error" ? "SOMETHING WENT WRONG" : "EMAIL CONFIRMATION"}
        </Text>
        <Text style={s.title}>
          {status === "pending" && "Confirming your new email…"}
          {status === "done" && "Email updated."}
          {status === "error" && "Couldn't confirm this link."}
        </Text>
        <Text style={s.sub}>
          {status === "done" &&
            "Your account now uses your new email address. Sign in again if asked."}
          {status === "error" && error}
        </Text>
        {status !== "pending" && (
          <Pressable style={s.primary} onPress={backToApp}>
            <Text style={s.primaryText}>Continue to PBGearbag  →</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0A0E0F", alignItems: "center", justifyContent: "center", padding: 20 },
  card: { width: "100%", maxWidth: 560, backgroundColor: "#121819", borderWidth: 1, borderColor: "#2c353c", borderRadius: 24, padding: 30 },
  mark: { width: 44, height: 44, borderRadius: 13, backgroundColor: "#A8C84A", alignItems: "center", justifyContent: "center" },
  markText: { color: "#10150d", fontWeight: "900", fontSize: 10 },
  kicker: { color: "#A8C84A", fontSize: 9, fontWeight: "900", letterSpacing: 1.5, marginTop: 26 },
  title: { color: "#fff", fontSize: 30, fontWeight: "900", marginTop: 8 },
  sub: { color: "#929da5", lineHeight: 22, marginTop: 10 },
  primary: { backgroundColor: "#A8C84A", padding: 16, borderRadius: 12, alignItems: "center", marginTop: 20 },
  primaryText: { color: "#10150d", fontWeight: "900" },
});
