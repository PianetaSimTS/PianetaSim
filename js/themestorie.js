// theme.js - Gestione temi chiari e scuri

function applyTheme(theme) {
  const root = document.documentElement;
  const themeLabel = document.getElementById("theme-label");
  
  if (theme === "light") {
    // Tema chiaro
    root.style.setProperty("--navbarbackground", "#ffffff");
    root.style.setProperty("--navbarcolor", "#000000");
    root.style.setProperty("--formcontainerbackground", "#ffffff");
    root.style.setProperty("--formcontainercolor", "#000000");
    root.style.setProperty("--h1backgroundcolor", "#ffffff");
    root.style.setProperty("--h1color", "#000000");
    root.style.setProperty("--thchildcolor", "#f2f2f2");
    root.style.setProperty("--tdcolor", "#f9f9f9");
    root.style.setProperty("--thcolor", "#000000");
    root.style.setProperty("--bodybackground", "#ffffff");
    root.style.setProperty("--sconosciutavar", "#545454");
    root.style.setProperty("--thtdcolor", "#000000");
    root.style.setProperty("--tdacolor", "#0066cc");
    root.style.setProperty("--tdahover", "#004999");
    root.style.setProperty("--tdactive", "#000080");
    root.style.setProperty("--text-color", "#000000");
    root.style.setProperty("--bg-color", "#ffffff");
    root.style.setProperty("--button-bg", "#16ab63");
    root.style.setProperty("--button-bg-hover", "#0f7041");
    root.style.setProperty("--highlight-color", "#b510bd");
    root.style.setProperty("--contact-bg", "rgba(255, 255, 255, 0.95)");
    root.style.setProperty("--contact-border", "rgba(0, 136, 204, 0.5)");
    root.style.setProperty("--contact-border-hover", "rgba(0, 136, 204, 0.9)");
    root.style.setProperty("--contact-shadow", "rgba(0, 136, 204, 0.3)");
    root.style.setProperty("--donation-bg", "rgba(255, 255, 255, 0.95)");
    root.style.setProperty("--donation-border", "rgba(22, 171, 99, 0.5)");
    root.style.setProperty("--donation-border-hover", "rgba(22, 171, 99, 0.9)");
    root.style.setProperty("--donation-shadow", "rgba(22, 171, 99, 0.3)");
    
    // Variabili per le card e testi (tema chiaro)
    root.style.setProperty("--card-bg", "#ffffff");
    root.style.setProperty("--card-border", "#e0e0e0");
    root.style.setProperty("--card-hover-border", "#16ab63");
    root.style.setProperty("--card-shadow", "0 8px 20px rgba(0, 0, 0, 0.1)");
    root.style.setProperty("--card-hover-shadow", "0 15px 35px rgba(22, 171, 99, 0.15)");
    
    // Colori dei testi (tema chiaro)
    root.style.setProperty("--card-title-color", "#000000");
    root.style.setProperty("--card-meta-color", "#666666");
    root.style.setProperty("--card-description-color", "#444444");
    root.style.setProperty("--filter-placeholder-color", "#999999");
    root.style.setProperty("--filter-text-color", "#000000");
    root.style.setProperty("--stats-text-color", "#000000");
    root.style.setProperty("--footer-text-color", "#888888");
    root.style.setProperty("--modal-text-color", "#000000");
    root.style.setProperty("--modal-meta-color", "#666666");
    
    // Background e blur (tema chiaro)
    root.style.setProperty("--card-bg-blur", "rgba(255, 255, 255, 0.95)");
    root.style.setProperty("--filter-bg", "#ffffff");
    root.style.setProperty("--stats-bg", "rgba(255, 255, 255, 0.9)");
    
    if (themeLabel) themeLabel.textContent = "Tema Chiaro";
    
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
  } else {
    // Tema scuro
    root.style.setProperty("--navbarbackground", "#343a40");
    root.style.setProperty("--navbarcolor", "#ffffff");
    root.style.setProperty("--formcontainerbackground", "#343a40");
    root.style.setProperty("--formcontainercolor", "#ffffff");
    root.style.setProperty("--h1backgroundcolor", "#343a40");
    root.style.setProperty("--h1color", "#ffffff");
    root.style.setProperty("--thchildcolor", "#666666");
    root.style.setProperty("--tdcolor", "#555555");
    root.style.setProperty("--thcolor", "#ffffff");
    root.style.setProperty("--bodybackground", "#343a40");
    root.style.setProperty("--sconosciutavar", "#FFFBB9");
    root.style.setProperty("--thtdcolor", "#ffffff");
    root.style.setProperty("--tdacolor", "#B57EDC");
    root.style.setProperty("--tdahover", "#FFB6C1");
    root.style.setProperty("--tdactive", "#8E44AD");
    root.style.setProperty("--text-color", "#ffffff");
    root.style.setProperty("--bg-color", "#343a40");
    root.style.setProperty("--button-bg", "#16ab63");
    root.style.setProperty("--button-bg-hover", "#0f7041");
    root.style.setProperty("--highlight-color", "#b510bd");
    root.style.setProperty("--contact-bg", "rgba(52, 58, 64, 0.9)");
    root.style.setProperty("--contact-border", "rgba(0, 136, 204, 0.3)");
    root.style.setProperty("--contact-border-hover", "rgba(0, 136, 204, 0.8)");
    root.style.setProperty("--contact-shadow", "rgba(0, 136, 204, 0.2)");
    root.style.setProperty("--donation-bg", "rgba(52, 58, 64, 0.9)");
    root.style.setProperty("--donation-border", "rgba(22, 171, 99, 0.3)");
    root.style.setProperty("--donation-border-hover", "rgba(22, 171, 99, 0.8)");
    root.style.setProperty("--donation-shadow", "rgba(22, 171, 99, 0.2)");
    
    // Variabili per le card e testi (tema scuro)
    root.style.setProperty("--card-bg", "rgba(255, 255, 255, 0.08)");
    root.style.setProperty("--card-border", "rgba(255, 255, 255, 0.15)");
    root.style.setProperty("--card-hover-border", "#16ab63");
    root.style.setProperty("--card-shadow", "0 8px 20px rgba(0, 0, 0, 0.3)");
    root.style.setProperty("--card-hover-shadow", "0 15px 35px rgba(22, 171, 99, 0.2)");
    
    // Colori dei testi (tema scuro)
    root.style.setProperty("--card-title-color", "#ffffff");
    root.style.setProperty("--card-meta-color", "rgba(255, 255, 255, 0.6)");
    root.style.setProperty("--card-description-color", "rgba(255, 255, 255, 0.8)");
    root.style.setProperty("--filter-placeholder-color", "rgba(255, 255, 255, 0.5)");
    root.style.setProperty("--filter-text-color", "#ffffff");
    root.style.setProperty("--stats-text-color", "#ffffff");
    root.style.setProperty("--footer-text-color", "#888888");
    root.style.setProperty("--modal-text-color", "#ffffff");
    root.style.setProperty("--modal-meta-color", "rgba(255, 255, 255, 0.7)");
    
    // Background e blur (tema scuro)
    root.style.setProperty("--card-bg-blur", "rgba(255, 255, 255, 0.08)");
    root.style.setProperty("--filter-bg", "rgba(255, 255, 255, 0.08)");
    root.style.setProperty("--stats-bg", "rgba(255, 255, 255, 0.08)");
    
    if (themeLabel) themeLabel.textContent = "Tema Scuro";
    
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');
  }
}

// Funzione per alternare il tema e salvarlo
function toggleTheme() {
  const currentTheme = localStorage.getItem("theme") || "dark";
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", newTheme);
  applyTheme(newTheme);
  
  // Aggiorna lo stato dello switch
  const themeSwitch = document.getElementById("theme-switch");
  if (themeSwitch) themeSwitch.checked = newTheme === "light";
}

// Applica il tema al caricamento della pagina
document.addEventListener("DOMContentLoaded", function() {
  const savedTheme = localStorage.getItem("theme") || "dark";
  applyTheme(savedTheme);
  
  const themeSwitch = document.getElementById("theme-switch");
  if (themeSwitch) {
    themeSwitch.checked = savedTheme === "light";
    themeSwitch.addEventListener("change", toggleTheme);
  }
});
