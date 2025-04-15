import React, { useState } from "react";

const ThemeSwitchButton = () => {
  const [theme, setTheme] = useState("light");

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  return (
    <button onClick={toggleTheme} className="theme-switch-button">
      Switch to {theme === "light" ? "dark" : "light"} mode
    </button>
  );
};

const Header = () => {
  return (
    <header className="dashboard-header">
      <h1>Dashboard</h1>
      <ThemeSwitchButton />
    </header>
  );
};

export default Header; 