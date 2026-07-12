import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Alert } from "../utils/alert";
import { useAuth } from "../store/AuthContext";
import { authService } from "../services/auth.service";
import {
  socialService,
  SocialProfileSummary,
} from "../services/social.service";

const TURF = "#A8C84A",
  INK = "#0A0E0F",
  PANEL = "#121819",
  RED = "#B97861";

const MESSAGE_OPTIONS: { value: string; label: string; hint: string }[] = [
  { value: "everyone", label: "Everyone", hint: "Any player can message you" },
  { value: "following", label: "People I follow", hint: "Only players you follow can message you" },
  { value: "nobody", label: "No one", hint: "Turn off direct messages" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function AccountSettingsScreen() {
  const { user, logout, refreshUser } = useAuth();

  // Change password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  // Change email
  const [emailPassword, setEmailPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  // Privacy
  const [messagePermission, setMessagePermission] = useState<string>(
    user?.messagePermission || "everyone",
  );
  const [permBusy, setPermBusy] = useState(false);
  const [blocked, setBlocked] = useState<SocialProfileSummary[]>([]);
  const [blockedLoading, setBlockedLoading] = useState(true);
  const [unblockBusyId, setUnblockBusyId] = useState<string | null>(null);

  // Sessions
  const [signOutAllBusy, setSignOutAllBusy] = useState(false);

  // Danger zone
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    socialService
      .blockedUsers()
      .then(setBlocked)
      .catch(() => {})
      .finally(() => setBlockedLoading(false));
  }, []);

  const changePassword = async () => {
    if (!currentPassword || !newPassword) return;
    if (newPassword.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      setPwError("New password must be at least 8 characters with uppercase, lowercase, and a number.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match.");
      return;
    }
    setPwBusy(true);
    setPwError(null);
    try {
      await authService.changePassword(currentPassword, newPassword);
      Alert.alert("Password changed", "Your password has been updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPwError(err.response?.data?.error?.message || err.response?.data?.message || "Could not change password.");
    } finally {
      setPwBusy(false);
    }
  };

  const changeEmail = async () => {
    if (!emailPassword || !newEmail) return;
    setEmailBusy(true);
    setEmailError(null);
    try {
      await authService.changeEmail(emailPassword, newEmail);
      setEmailSent(true);
      setEmailPassword("");
      await refreshUser();
    } catch (err: any) {
      setEmailError(err.response?.data?.error?.message || err.response?.data?.message || "Could not change email.");
    } finally {
      setEmailBusy(false);
    }
  };

  const updateMessagePermission = async (value: string) => {
    const prev = messagePermission;
    setMessagePermission(value);
    setPermBusy(true);
    try {
      await authService.updateSettings({ messagePermission: value });
    } catch {
      setMessagePermission(prev);
      Alert.alert("Couldn't save", "Please try again in a moment.");
    } finally {
      setPermBusy(false);
    }
  };

  const unblock = async (userId: string) => {
    setUnblockBusyId(userId);
    try {
      await socialService.unblock(userId);
      setBlocked((prev) => prev.filter((x) => x.id !== userId));
    } catch {
      Alert.alert("Couldn't unblock", "Please try again in a moment.");
    } finally {
      setUnblockBusyId(null);
    }
  };

  const signOutEverywhere = () =>
    Alert.alert(
      "Sign out of all devices",
      "You'll be signed out everywhere, including this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out everywhere",
          style: "destructive",
          onPress: async () => {
            setSignOutAllBusy(true);
            try {
              await authService.logoutAllDevices();
            } finally {
              setSignOutAllBusy(false);
              await logout();
            }
          },
        },
      ],
    );

  const deleteAccount = async () => {
    if (deleteConfirm.trim().toUpperCase() !== "DELETE" || !deletePassword) return;
    setDeleteBusy(true);
    try {
      await authService.deleteAccount(deletePassword);
      await logout();
    } catch (err: any) {
      setDeleteBusy(false);
      Alert.alert(
        "Couldn't delete account",
        err.response?.data?.error?.message || err.response?.data?.message || "Check your password and try again.",
      );
    }
  };

  if (!user) return null;

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <Text style={s.heading}>Account settings</Text>
      <Text style={s.subhead}>Security, privacy, and account controls.</Text>

      <Section title="EMAIL & PASSWORD">
        <Text style={s.label}>Current password</Text>
        <TextInput
          style={s.input}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Current password"
          placeholderTextColor="#5f6972"
          secureTextEntry
        />
        <Text style={s.label}>New password</Text>
        <TextInput
          style={s.input}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="New password"
          placeholderTextColor="#5f6972"
          secureTextEntry
        />
        <Text style={s.label}>Confirm new password</Text>
        <TextInput
          style={s.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm new password"
          placeholderTextColor="#5f6972"
          secureTextEntry
        />
        {pwError && <Text style={s.errorText}>{pwError}</Text>}
        <Pressable style={s.primaryBtn} onPress={changePassword} disabled={pwBusy}>
          {pwBusy ? <ActivityIndicator size="small" color="#10140D" /> : <Text style={s.primaryBtnText}>Change password</Text>}
        </Pressable>

        <View style={s.divider} />

        <Text style={s.label}>Email address</Text>
        <Text style={s.currentValue}>{user.email}</Text>
        {user.pendingEmail ? (
          <Text style={s.hint}>
            Confirmation sent to {user.pendingEmail} — check that inbox to finish the change.
          </Text>
        ) : emailSent ? (
          <Text style={s.hint}>Check your new inbox for a confirmation link.</Text>
        ) : (
          <>
            <Text style={[s.label, { marginTop: 14 }]}>New email address</Text>
            <TextInput
              style={s.input}
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder="New email address"
              placeholderTextColor="#5f6972"
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Text style={s.label}>Confirm with your password</Text>
            <TextInput
              style={s.input}
              value={emailPassword}
              onChangeText={setEmailPassword}
              placeholder="Password"
              placeholderTextColor="#5f6972"
              secureTextEntry
            />
            {emailError && <Text style={s.errorText}>{emailError}</Text>}
            <Pressable style={s.primaryBtn} onPress={changeEmail} disabled={emailBusy}>
              {emailBusy ? <ActivityIndicator size="small" color="#10140D" /> : <Text style={s.primaryBtnText}>Send confirmation</Text>}
            </Pressable>
          </>
        )}

        <View style={s.divider} />
        <Pressable style={s.secondaryBtn} onPress={signOutEverywhere} disabled={signOutAllBusy}>
          {signOutAllBusy ? <ActivityIndicator size="small" color="#D6DDDA" /> : <Text style={s.secondaryBtnText}>Sign out of all devices</Text>}
        </Pressable>
      </Section>

      <Section title="PRIVACY">
        <Text style={s.label}>Who can message you</Text>
        {MESSAGE_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            style={[s.optionRow, messagePermission === opt.value && s.optionRowActive]}
            onPress={() => updateMessagePermission(opt.value)}
            disabled={permBusy}
          >
            <View style={[s.radio, messagePermission === opt.value && s.radioActive]}>
              {messagePermission === opt.value && <View style={s.radioDot} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.optionLabel}>{opt.label}</Text>
              <Text style={s.optionHint}>{opt.hint}</Text>
            </View>
          </Pressable>
        ))}

        <View style={s.divider} />
        <Text style={s.label}>Blocked players</Text>
        {blockedLoading ? (
          <ActivityIndicator color={TURF} style={{ marginTop: 10 }} />
        ) : blocked.length === 0 ? (
          <Text style={s.hint}>You haven't blocked anyone.</Text>
        ) : (
          blocked.map((b) => (
            <View key={b.id} style={s.blockedRow}>
              <Text style={s.blockedName}>{b.displayName || b.username}</Text>
              <Pressable
                style={s.unblockBtn}
                onPress={() => unblock(b.id)}
                disabled={unblockBusyId === b.id}
              >
                {unblockBusyId === b.id ? (
                  <ActivityIndicator size="small" color="#D6DDDA" />
                ) : (
                  <Text style={s.unblockText}>Unblock</Text>
                )}
              </Pressable>
            </View>
          ))
        )}
      </Section>

      <Section title="DANGER ZONE">
        <Text style={s.dangerText}>
          Deleting your account is permanent — your listings, gearbag, posts, and messages will
          all be removed. This can't be undone.
        </Text>
        <Text style={s.label}>Type DELETE to confirm</Text>
        <TextInput
          style={s.input}
          value={deleteConfirm}
          onChangeText={setDeleteConfirm}
          placeholder="DELETE"
          placeholderTextColor="#5f6972"
          autoCapitalize="characters"
        />
        <Text style={s.label}>Password</Text>
        <TextInput
          style={s.input}
          value={deletePassword}
          onChangeText={setDeletePassword}
          placeholder="Password"
          placeholderTextColor="#5f6972"
          secureTextEntry
        />
        <Pressable
          style={[
            s.dangerBtn,
            (deleteConfirm.trim().toUpperCase() !== "DELETE" || !deletePassword) && s.dangerBtnDisabled,
          ]}
          onPress={deleteAccount}
          disabled={deleteBusy || deleteConfirm.trim().toUpperCase() !== "DELETE" || !deletePassword}
        >
          {deleteBusy ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.dangerBtnText}>Delete my account</Text>}
        </Pressable>
      </Section>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: INK },
  content: { maxWidth: 620, width: "100%", alignSelf: "center", padding: 20, paddingBottom: 90 },
  heading: { color: "#F3F1E8", fontSize: 26, fontWeight: "900", marginTop: 8 },
  subhead: { color: "#9DA9A3", fontSize: 13, marginTop: 6 },
  section: {
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: "#293231",
    borderRadius: 14,
    padding: 18,
    marginTop: 22,
  },
  sectionTitle: { color: "#75817D", fontSize: 10, fontWeight: "900", letterSpacing: 1.2, marginBottom: 14 },
  label: { color: "#9DA9A3", fontSize: 11, fontWeight: "800", marginBottom: 6, marginTop: 10 },
  currentValue: { color: "#F3F1E8", fontSize: 14, fontWeight: "700" },
  hint: { color: "#75817D", fontSize: 11, lineHeight: 16, marginTop: 6 },
  input: {
    backgroundColor: "#0F1414",
    borderWidth: 1,
    borderColor: "#293231",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#F3F1E8",
    fontSize: 13,
  },
  errorText: { color: "#ff6b6b", fontSize: 12, marginTop: 8 },
  primaryBtn: {
    backgroundColor: TURF,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 14,
  },
  primaryBtnText: { color: "#10140D", fontSize: 12, fontWeight: "900" },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: "#3A4541",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryBtnText: { color: "#D6DDDA", fontSize: 12, fontWeight: "800" },
  divider: { height: 1, backgroundColor: "#232C2A", marginVertical: 18 },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#232C2A",
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  optionRowActive: { borderColor: TURF },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#3A4541",
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: { borderColor: TURF },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: TURF },
  optionLabel: { color: "#F3F1E8", fontSize: 13, fontWeight: "800" },
  optionHint: { color: "#75817D", fontSize: 11, marginTop: 2 },
  blockedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#232C2A",
  },
  blockedName: { color: "#E4E8E5", fontSize: 13, fontWeight: "700" },
  unblockBtn: {
    borderWidth: 1,
    borderColor: "#3A4541",
    borderRadius: 7,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  unblockText: { color: "#D6DDDA", fontSize: 11, fontWeight: "800" },
  dangerText: { color: "#9DA9A3", fontSize: 12, lineHeight: 18, marginBottom: 4 },
  dangerBtn: {
    backgroundColor: RED,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 16,
  },
  dangerBtnDisabled: { opacity: 0.4 },
  dangerBtnText: { color: "#fff", fontSize: 12, fontWeight: "900" },
});
