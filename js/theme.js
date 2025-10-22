function applyTheme(theme) {
  const root = document.documentElement;
  const themeSwitch = document.getElementById("themeSwitch");
  
  if (theme === "light") {
    root.style.setProperty("--navbarbackground", "#ffffff");
    root.style.setProperty("--navbarcolor", "#000000");
    root.style.setProperty("--formcontainerbackground", "#ffffff");
    root.style.setProperty("--formcontainercolor", "black");
    root.style.setProperty("--h1backgroundcolor", "#ffffff");
    root.style.setProperty("--h1color", "black");
    root.style.setProperty("--thchildcolor", "#f2f2f2");
    root.style.setProperty("--tdcolor", "#f9f9f9");
    root.style.setProperty("--thcolor", "#000000");
    root.style.setProperty("--bodybackground", "#ffffff");
    root.style.setProperty("--sconosciutavar", "#545454");
    root.style.setProperty("--thtdcolor", "black");
    root.style.setProperty("--tdacolor", "blue");
    root.style.setProperty("--tdahover", "#551A8B");
    root.style.setProperty("--tdactive", "#000080");
    root.style.setProperty("--text-color", "#000");
    themeSwitch.textContent = "🌞";
  } else {
    root.style.setProperty("--navbarbackground", "#343a40");
    root.style.setProperty("--navbarcolor", "#fff");
    root.style.setProperty("--formcontainerbackground", "#343a40");
    root.style.setProperty("--formcontainercolor", "#fff");
    root.style.setProperty("--h1backgroundcolor", "#343a40");
    root.style.setProperty("--h1color", "white");
    root.style.setProperty("--thchildcolor", "#666666");
    root.style.setProperty("--tdcolor", "#555555");
    root.style.setProperty("--thcolor", "white");
    root.style.setProperty("--bodybackground", "#343a40");
    root.style.setProperty("--sconosciutavar", "#FFFBB9");
    root.style.setProperty("--thtdcolor", "white");
    root.style.setProperty("--tdacolor", "#B57EDC");
    root.style.setProperty("--tdahover", "#FFB6C1");
    root.style.setProperty("--tdactive", "#8E44AD");
    root.style.setProperty("--text-color", "#fff");
    themeSwitch.textContent = "🌙";
  }
}

// Funzione per alternare il tema e salvarlo
function toggleTheme() {
  const currentTheme = localStorage.getItem("theme") || "dark";
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", newTheme);
  applyTheme(newTheme);
}

// Applica il tema al caricamento della pagina
window.addEventListener("load", function () {
  const savedTheme = localStorage.getItem("theme") || "dark";
  applyTheme(savedTheme);
});