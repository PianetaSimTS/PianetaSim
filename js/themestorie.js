function applyTheme(theme) {
  const root = document.documentElement;
  const themeLabel = document.getElementById("theme-label");

  if (theme === "light") {
    root.style.setProperty("--bg-primary", "#f5f5f7");
    root.style.setProperty("--bg-secondary", "#ffffff");
    root.style.setProperty("--bg-card", "rgba(0, 0, 0, 0.03)");
    root.style.setProperty("--bg-card-hover", "rgba(0, 0, 0, 0.06)");
    root.style.setProperty("--text-primary", "#1a1a2e");
    root.style.setProperty("--text-secondary", "#555570");
    root.style.setProperty("--text-muted", "#8888a0");
    root.style.setProperty("--border-color", "rgba(0, 0, 0, 0.1)");
    root.style.setProperty("--border-hover", "rgba(0, 0, 0, 0.18)");
    root.style.setProperty("--shadow-card", "0 4px 20px rgba(0, 0, 0, 0.08)");
    root.style.setProperty("--card-title-color", "#1a1a2e");
    root.style.setProperty("--card-description-color", "#555570");
    root.style.setProperty("--card-meta-color", "#8888a0");
    root.style.setProperty("--stats-text-color", "#555570");
    root.style.setProperty("--footer-text-color", "#8888a0");
    root.style.setProperty("--modal-text-color", "#1a1a2e");
    root.style.setProperty("--modal-meta-color", "#555570");
    root.style.setProperty("--filter-placeholder-color", "#8888a0");
    root.style.setProperty("--filter-text-color", "#1a1a2e");
    if (themeLabel) themeLabel.textContent = "Tema Chiaro";
  } else {
    root.style.setProperty("--bg-primary", "#0a0a0f");
    root.style.setProperty("--bg-secondary", "#12121a");
    root.style.setProperty("--bg-card", "rgba(255, 255, 255, 0.04)");
    root.style.setProperty("--bg-card-hover", "rgba(255, 255, 255, 0.08)");
    root.style.setProperty("--text-primary", "#f0f0f5");
    root.style.setProperty("--text-secondary", "#8888a0");
    root.style.setProperty("--text-muted", "#555570");
    root.style.setProperty("--border-color", "rgba(255, 255, 255, 0.08)");
    root.style.setProperty("--border-hover", "rgba(255, 255, 255, 0.15)");
    root.style.setProperty("--shadow-card", "0 4px 20px rgba(0, 0, 0, 0.3)");
    root.style.setProperty("--card-title-color", "#ffffff");
    root.style.setProperty("--card-description-color", "rgba(255, 255, 255, 0.8)");
    root.style.setProperty("--card-meta-color", "rgba(255, 255, 255, 0.6)");
    root.style.setProperty("--stats-text-color", "#ffffff");
    root.style.setProperty("--footer-text-color", "#888888");
    root.style.setProperty("--modal-text-color", "#ffffff");
    root.style.setProperty("--modal-meta-color", "rgba(255, 255, 255, 0.7)");
    root.style.setProperty("--filter-placeholder-color", "rgba(255, 255, 255, 0.5)");
    root.style.setProperty("--filter-text-color", "#ffffff");
    if (themeLabel) themeLabel.textContent = "Tema Scuro";
  }
}

function toggleTheme() {
  const currentTheme = localStorage.getItem("theme") || "dark";
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", newTheme);
  applyTheme(newTheme);
  const themeSwitch = document.getElementById("theme-switch");
  if (themeSwitch) themeSwitch.checked = newTheme === "light";
}

document.addEventListener("DOMContentLoaded", function() {
  const savedTheme = localStorage.getItem("theme") || "dark";
  applyTheme(savedTheme);
  const themeSwitch = document.getElementById("theme-switch");
  if (themeSwitch) {
    themeSwitch.checked = savedTheme === "light";
    themeSwitch.addEventListener("change", toggleTheme);
  }
});
