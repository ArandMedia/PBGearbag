import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { DEFAULT_ACCENT } from "../store/ThemeContext";
import { captureException } from "../utils/errorTracking";

interface Props {
  children: React.ReactNode;
}
interface State {
  error: Error | null;
}

// Catches render-time crashes anywhere below it in the tree. Without this,
// React unmounts the whole app on an uncaught error and the user gets a
// blank white page with no way back in short of knowing to hard-refresh.
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Unhandled render error:", error, info.componentStack);
    captureException(error, { componentStack: info.componentStack });
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <View style={s.page}>
          <Text style={s.kicker}>SOMETHING WENT WRONG</Text>
          <Text style={s.title}>PBGearbag hit a snag.</Text>
          <Text style={s.body}>
            That's on us, not you. Try again, or reload the page if it keeps happening.
          </Text>
          <Pressable style={s.primary} onPress={this.reset}>
            <Text style={s.primaryText}>Try again</Text>
          </Pressable>
          {typeof window !== "undefined" && (
            <Pressable style={s.link} onPress={() => window.location.reload()}>
              <Text style={s.linkText}>Reload the page</Text>
            </Pressable>
          )}
        </View>
      );
    }
    return this.props.children;
  }
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0A0E0F", alignItems: "center", justifyContent: "center", padding: 24 },
  kicker: { color: DEFAULT_ACCENT, fontSize: 10, fontWeight: "900", letterSpacing: 1.5, marginBottom: 10 },
  title: { color: "#F3F1E8", fontSize: 26, fontWeight: "900", textAlign: "center" },
  body: { color: "#96a1a8", fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 10, maxWidth: 340 },
  primary: { backgroundColor: DEFAULT_ACCENT, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14, marginTop: 22 },
  primaryText: { color: "#10150d", fontWeight: "900", fontSize: 14 },
  link: { marginTop: 14, padding: 8 },
  linkText: { color: "#6d7881", fontSize: 13, fontWeight: "700" },
});
