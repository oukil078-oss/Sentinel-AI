import {
  createContext, useContext, useState, useEffect, useCallback, ReactNode,
} from "react";
import { ThemeTransition } from "../components/ui/ThemeTransition";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  isDark: true,
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
  });

  const [transition, setTransition] = useState<{
    active: boolean;
    target: Theme;
  }>({ active: false, target: "dark" });

  // Keep <html> class and localStorage in sync
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("sentinel-theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTransition({ active: true, target: next });
  }, [theme]);

  const handleMidpoint = useCallback(() => {
    setTheme(transition.target);
  }, [transition.target]);

  const handleComplete = useCallback(() => {
    setTransition((prev) => ({ ...prev, active: false }));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === "dark", toggleTheme }}>
      {children}
      {transition.active && (
        <ThemeTransition
          target={transition.target}
          onMidpoint={handleMidpoint}
          onComplete={handleComplete}
        />
      )}
    </ThemeContext.Provider>
  );
}
