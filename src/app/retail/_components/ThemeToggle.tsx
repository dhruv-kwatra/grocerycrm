"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

const THEME_EVENT = "retail-theme-change";

function applyTheme(isLight: boolean) {
  document.querySelectorAll(".retail-theme").forEach((el) => {
    if (isLight) el.setAttribute("data-theme", "light");
    else el.removeAttribute("data-theme");
  });
  if (isLight) {
    document.documentElement.setAttribute("data-theme", "light");
    document.documentElement.style.colorScheme = "light";
  } else {
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.style.colorScheme = "dark";
  }
}

export function useRetailTheme(): [boolean, () => void] {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const checkState = () => {
      const el = document.querySelector(".retail-theme");
      const isLight = el?.getAttribute("data-theme") === "light" || localStorage.getItem("retailTheme") === "light";
      setLight(isLight);
      if (isLight) {
        applyTheme(true);
      }
    };

    checkState();

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ light: boolean }>;
      if (customEvent.detail !== undefined) {
        setLight(customEvent.detail.light);
      } else {
        checkState();
      }
    };

    window.addEventListener(THEME_EVENT, handleThemeChange);
    window.addEventListener("storage", checkState);
    return () => {
      window.removeEventListener(THEME_EVENT, handleThemeChange);
      window.removeEventListener("storage", checkState);
    };
  }, []);

  const toggle = () => {
    const next = !light;
    setLight(next);
    applyTheme(next);
    try {
      localStorage.setItem("retailTheme", next ? "light" : "dark");
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: { light: next } }));
  };

  return [light, toggle];
}

export function ThemeToggle() {
  const [light, toggle] = useRetailTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={light ? "Switch to dark theme" : "Switch to light theme"}
      title={light ? "Dark theme" : "Light theme"}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--muted)] hover:bg-[var(--surface-raised)] hover:text-[var(--text)] border border-[var(--border)] transition-colors shrink-0"
    >
      {light ? <Moon size={17} /> : <Sun size={17} />}
    </button>
  );
}
