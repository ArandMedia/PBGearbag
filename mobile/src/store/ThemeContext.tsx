import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authService } from "../services/auth.service";
import { useAuth } from "./AuthContext";

export const DEFAULT_ACCENT = "#A8C84A";

interface ThemeContextType {
  accent: string;
  setAccent: (hex: string) => Promise<void>;
  saving: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  accent: DEFAULT_ACCENT,
  setAccent: async () => {},
  saving: false,
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user, refreshUser } = useAuth();
  const [accent, setAccentState] = useState(user?.themeColor || DEFAULT_ACCENT);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAccentState(user?.themeColor || DEFAULT_ACCENT);
  }, [user?.themeColor]);

  const setAccent = async (hex: string) => {
    const previous = accent;
    setAccentState(hex); // optimistic — the whole app repaints immediately
    setSaving(true);
    try {
      await authService.updateProfile({ themeColor: hex });
      await refreshUser();
    } catch {
      setAccentState(previous);
      throw new Error("Couldn't save your theme color. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return <ThemeContext.Provider value={{ accent, setAccent, saving }}>{children}</ThemeContext.Provider>;
}
