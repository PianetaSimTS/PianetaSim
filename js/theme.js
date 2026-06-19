function applyTheme(theme) {
  const root = document.documentElement;

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
    themeLabel.textContent = "Tema Chiaro";
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
    themeLabel.textContent = "Tema Scuro";
  }
}

function toggleTheme() {
  const currentTheme = localStorage.getItem("theme") || "dark";
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", newTheme);
  applyTheme(newTheme);
  document.getElementById("theme-switch").checked = newTheme === "light";
}

document.addEventListener("DOMContentLoaded", function() {
  const savedTheme = localStorage.getItem("theme") || "dark";
  window.themeLabel = document.getElementById("theme-label");
  applyTheme(savedTheme);
  document.getElementById("theme-switch").checked = savedTheme === "light";
  document.getElementById("theme-switch").addEventListener("change", toggleTheme);
});
