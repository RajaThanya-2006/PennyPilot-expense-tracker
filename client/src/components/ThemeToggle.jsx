import React from "react";
import { Sun, Moon } from "lucide-react";

function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="pp-theme-toggle"
      aria-label={
        theme === "dark"
          ? "Switch to light theme"
          : "Switch to dark theme"
      }
      title={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      {theme === "dark" ? (
        <Sun size={20} />
      ) : (
        <Moon size={20} />
      )}
      <span>{theme === "dark" ? "Light" : "Dark"}</span>
    </button>
  );
}

export default ThemeToggle;
