// Gestione del popup Help Sim
document.getElementById("desc-mod-btn").addEventListener("click", function(event) {
    event.preventDefault();
    document.getElementById("popup").style.display = "block";
});

document.getElementById("close-btn").addEventListener("click", function() {
    document.getElementById("popup").style.display = "none";
});

document.getElementById("download-btn").addEventListener("click", function() {
    const link = document.createElement("a");
    link.href = "https://github.com/PianetaSimTS/HelpSim/releases/download/HelpSim/HelpSim.exe";
    link.download = "HelpSim.exe";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    document.getElementById("popup").style.display = "none"; // Chiude il popup dopo il download
});

// Caricamento dei dati dal JSON
function loadModsFromJson() {
  fetch('https://raw.githubusercontent.com/PianetaSimTS/PianetaSim/refs/heads/main/Json/animazioniww18.json')
    .then(response => response.json())
    .then(mods => {
      const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
      const table = document.getElementById("animazioni-table").getElementsByTagName("tbody")[0];
      table.innerHTML = '';
      const lang = localStorage.getItem("language") || "it";

      // Crea righe per ogni mod
      mods.forEach(mod => {
        const cleanedAuthor = mod.Autore.replace("'", ""); // Remove the apostrophe for internal processing
        const isFavorite = favorites.includes(cleanedAuthor); // Check against cleaned author
        const newRow = table.insertRow();

        newRow.innerHTML = `
          <td>
            <span class="star-container">
              <span class="star ${isFavorite ? 'favorite' : ''}" onclick="toggleFavorite('${cleanedAuthor}')">&#9733;</span>
            </span>
          </td>
          <td>${mod.Autore || ''}</td>
          <td>
            <span class="status ${(mod.Status || 'sconosciuta').toLowerCase()}">
              ${lang === "en" ? (translations[mod.Status.trim().charAt(0).toUpperCase() + mod.Status.trim().slice(1)] || mod.Status) : mod.Status}
            </span>
          </td>
          <td><a href="${mod.Link || '#'}" target="_blank">Visita</a></td>
          <td>${mod.DataAggiornamento || ''}</td>
          <td>${mod.Note || ''}</td>
        `;
      });
      checkModUpdates(mods);
      filterTable();
    })
    .catch(error => {
      console.error('Errore nel caricare il JSON:', error);
      document.getElementById("animazioni-table").getElementsByTagName("tbody")[0].innerHTML = `
        <tr><td colspan="6">Errore nel caricare i dati. Riprova più tardi.</td></tr>
      `;
    });
}

// Controllo aggiornamenti delle animazioni
function checkModUpdates(mods) {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  let savedMods = JSON.parse(localStorage.getItem("savedAnimazioni")) || {};

  let updatedMods = [];

  mods.forEach(mod => {
    if (favorites.includes(mod.Autore)) { // Usa Autore invece di ModName
      let prevData = savedMods[mod.Autore]; 

      if (!prevData || prevData.Status !== mod.Status || prevData.DataAggiornamento !== mod.DataAggiornamento) {
        updatedMods.push(mod);
      }

      // Aggiorna i dati salvati
      savedMods[mod.Autore] = { 
        Status: mod.Status,
        DataAggiornamento: mod.DataAggiornamento 
      };
    }
  });

  localStorage.setItem("savedAnimazioni", JSON.stringify(savedMods));

  // Definizione dei testi per la notifica in entrambe le lingue
  const notificationTexts = {
    it: "Le seguenti animazioni preferite sono state modificate:\n",
    en: "The following favorite animations have been changed:\n"
  };
  
  const lang = localStorage.getItem("language") || "it";
  
  // Se ci sono mod aggiornate, mostra una notifica
  if (updatedMods.length > 0) {
    let message = notificationTexts[lang] + 
                  updatedMods.map(mod => `${mod.Autore} - Stato: ${mod.Status} (${mod.DataAggiornamento})`).join("\n");
    alert(message); // Puoi sostituirlo con una notifica più elegante
  }
}

// Ordinamento tabella
let lastSortedColumn = -1; // Memorizza l'ultima colonna ordinata
let lastSortDirection = 'asc'; // Ordine di ordinamento: ascendente (default) o discendente

function sortTable(columnIndex) {
  const table = document.getElementById("animazioni-table");
  const rows = Array.from(table.rows).slice(1); // Esclude l'intestazione
  const arrow = document.getElementById(`arrow-${columnIndex}`);

  if (lastSortedColumn === columnIndex) {
    lastSortDirection = (lastSortDirection === 'asc') ? 'desc' : 'asc';
  } else {
    lastSortDirection = 'asc';
  }

  const compare = (a, b) => {
    let valA = a.cells[columnIndex].textContent.trim().toLowerCase();
    let valB = b.cells[columnIndex].textContent.trim().toLowerCase();

    if (valA < valB) return lastSortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return lastSortDirection === 'asc' ? 1 : -1;
    return 0;
  };

  rows.sort(compare);
  rows.forEach(row => table.appendChild(row));

  document.querySelectorAll('.sort-arrow').forEach(arrow => arrow.className = 'sort-arrow');
  arrow.classList.add(lastSortDirection);

  lastSortedColumn = columnIndex;
}

// Traduzioni
const translations = {
  "Compatibile": "Compatible",
  "Rotta": "Broken",
  "Aggiornata": "Updated",
  "Sconosciuta": "Unknown",
  "Nuova": "New",
  "Compatible": "Compatibile",
  "Broken": "Rotta",
  "Updated": "Aggiornata",
  "Unknown": "Sconosciuta",
  "New": "Nuova"
};

// Filtro tabella
function filterTable() {
  const searchValue = document.getElementById("search").value.toLowerCase();

  // Identificare la lingua attuale
  const isEnglish = document.querySelector(".en-label").style.display !== "none";

  // Stato - raccogli i valori selezionati e convertirli in un formato uniforme
  const selectedStatuses = Array.from(document.querySelectorAll('#filter-status-dropdown input:checked'))
                                  .map(input => {
                                    let value = input.value;
                                    return isEnglish ? translations[value] : value; 
                                  }).map(v => v.toLowerCase());
  
  const filterFavorites = document.getElementById("filter-favorites").value.toLowerCase();

  const table = document.getElementById("animazioni-table");
  const rows = table.getElementsByTagName("tr");

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const author = row.cells[1].textContent.toLowerCase();
    let status = row.querySelector(".status").textContent.trim();
    status = isEnglish ? (translations[status] || status) : status;
    status = status.toLowerCase();
    const isFavorite = row.querySelector(".star").classList.contains("favorite");
    const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(status);
    const matchesSearch = author.includes(searchValue);
    const matchesFavorites = !filterFavorites || (filterFavorites === 'true' ? isFavorite : !isFavorite);
    row.style.display = (matchesSearch && matchesStatus && matchesFavorites) ? "" : "none";
  }
}

// Gestione preferiti
function toggleFavorite(author) {
  const lang = localStorage.getItem("language") || "it";
  // Remove the apostrophe when toggling favorites
  const cleanedAuthor = author.replace("'", "");
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  
  if (favorites.includes(cleanedAuthor)) {
    favorites = favorites.filter(favorite => favorite !== cleanedAuthor);
    alert(author + (lang === "en" ? " has been removed from favorites." : " è stata rimossa dai preferiti."));
  } else {
    favorites.push(cleanedAuthor);
    alert(author + (lang === "en" ? " has been added to favorites!" : " è stata aggiunta ai preferiti!"));
  }
  
  localStorage.setItem("favorites", JSON.stringify(favorites));
  loadModsFromJson();
}

// Gestione tema
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
    // Passa al tema scuro
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

// Gestione lingua
const languageSwitch = document.getElementById("language-switch");
const languageLabel = document.getElementById("language-label");
const texts = {
  it: {
    pageTitle: "Tabella - Animazioni WickedWhims +18",
    searchPlaceholder: "Cerca...",
    filterStatusLabel: "Stato:",
    filterFavoritesLabel: "Preferite:",
    favoritesAll: "Tutte",
    favoritesYes: "Preferite",
    favoritesNo: "Non Preferite",
    tableHeaders: ["PREFERITE", "AUTORE", "STATO ANIMAZIONE", "LINK ANIMAZIONE", "DATA AGGIORNAMENTO ANIMAZIONE", "NOTE"],
    statusOptions: ["Compatibile", "Rotta", "Aggiornata", "Sconosciuta", "Nuova"]
  },
  en: {
    pageTitle: "Table - WickedWhims +18 Animations",
    searchPlaceholder: "Search...",
    filterStatusLabel: "Status:",
    filterFavoritesLabel: "Favorites:",
    favoritesAll: "All",
    favoritesYes: "Favorites",
    favoritesNo: "No Favorites",
    tableHeaders: ["FAVORITES", "AUTHOR", "ANIMATION STATUS", "ANIMATION LINK", "ANIMATION UPDATE DATE", "NOTES"],
    statusOptions: ["Compatible", "Broken", "Updated", "Unknown", "New"]
  }
};

function updateLanguage(lang) {
  const currentTexts = texts[lang];
  
  // Aggiorna titolo pagina
  document.getElementById("page-title").textContent = currentTexts.pageTitle;
  
  // Aggiorna placeholder ricerca
  document.getElementById("search").placeholder = currentTexts.searchPlaceholder;
  
  // Aggiorna etichette filtri
  document.getElementById("filter-status-label").textContent = currentTexts.filterStatusLabel;
  document.getElementById("filter-favorites-label").textContent = currentTexts.filterFavoritesLabel;
  
  // Aggiorna opzioni preferiti
  const favoritesSelect = document.getElementById("filter-favorites");
  favoritesSelect.innerHTML = '';
  [currentTexts.favoritesAll, currentTexts.favoritesYes, currentTexts.favoritesNo].forEach((text, index) => {
    const option = document.createElement("option");
    option.value = ["", "true", "false"][index];
    option.textContent = text;
    favoritesSelect.appendChild(option);
  });
  
  // Aggiorna intestazioni tabella
  const headers = document.querySelectorAll("#animazioni-table th");
  headers.forEach((header, index) => {
    header.textContent = currentTexts.tableHeaders[index];
    // Aggiungi nuovamente la freccia di ordinamento
    const arrow = document.createElement("span");
    arrow.className = "sort-arrow";
    arrow.id = `arrow-${index}`;
    header.appendChild(arrow);
  });
  
  // Aggiorna opzioni stato
  const statusOptionsIt = document.querySelector(".it-label");
  const statusOptionsEn = document.querySelector(".en-label");
  
  if (lang === "en") {
    statusOptionsIt.style.display = "none";
    statusOptionsEn.style.display = "block";
  } else {
    statusOptionsIt.style.display = "block";
    statusOptionsEn.style.display = "none";
  }
  
  // Aggiorna etichetta lingua
  languageLabel.textContent = lang === "en" ? "English" : "Italiano";
  
  // Ricarica i dati per aggiornare le traduzioni
  loadModsFromJson();
}

// Cambio lingua
languageSwitch.addEventListener("change", function() {
  const lang = this.checked ? "en" : "it";
  localStorage.setItem("language", lang);
  updateLanguage(lang);
});

// Toggle dropdown
function toggleDropdown(id) {
  const dropdown = document.getElementById(id);
  if (dropdown.style.display === "none" || dropdown.style.display === "") {
    dropdown.style.display = "block";
    dropdown.style.opacity = "1";
  } else {
    dropdown.style.display = "none";
    dropdown.style.opacity = "0";
  }
}

// Toggle tema
function toggleTheme() {
  const currentTheme = localStorage.getItem("theme") || "dark";
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", newTheme);
  applyTheme(newTheme);
}

// Scroll to top
window.onscroll = function() {
  const scrollToTopBtn = document.getElementById("scrollToTop");
  if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
    scrollToTopBtn.style.display = "block";
  } else {
    scrollToTopBtn.style.display = "none";
  }
};

// Inizializzazione
window.onload = function() {
  // Carica tema
  const savedTheme = localStorage.getItem("theme") || "dark";
  applyTheme(savedTheme);
  
  // Carica lingua
  const savedLang = localStorage.getItem("language") || "it";
  languageSwitch.checked = savedLang === "en";
  updateLanguage(savedLang);
  
  // Carica dati
  loadModsFromJson();
  
  // Chiudi dropdown se si clicca fuori
  document.addEventListener("click", function(event) {
    const dropdowns = document.querySelectorAll("#filter-status-dropdown");
    dropdowns.forEach(dropdown => {
      if (!event.target.closest("#filter-status-dropdown") && !event.target.closest("#filter-status-label")) {
        dropdown.style.display = "none";
        dropdown.style.opacity = "0";
      }
    });
  });
};