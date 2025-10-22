const languageSwitch = document.getElementById("language-switch");
const languageLabel = document.getElementById("language-label");

// Testi in italiano e inglese
const texts = {
  it: {
    helpSimTitle: "🚀 HELP SIM",
    helpSimDesc: "Stanco di installare mod e traduzioni a mano? Help Sim è qui per salvarti! Con pochi click, potrai aggiungere le tue mod preferite, tenere tutto sotto controllo e persino dare una bella ripulita ai file cache di The Sims 4! Che tu voglia ampliare il tuo gioco con nuove mod o semplicemente tenere tutto in ordine, sei nel posto giusto.",
    relax: "Ora rilassati, personalizza il tuo gioco e lascia che <strong>Help Sim</strong> faccia il resto! 🎮✨",
    precautions: "⚠️ PICCOLE ATTENZIONI PRIMA DELLO SCARICO ⚠️",
    antivirus: "★ Se l'antivirus blocca il programma, clicca su <strong>\"Esegui comunque\"</strong>.<br>Il programma è sicuro! In quanto creato interamente da noi.",
    guide: "★ Prima dell'uso, <strong>leggi la guida</strong> disponibile nella home del programma.",
    zipSupport: "★ Supporta solo i file delle mod e delle traduzioni in <strong>formato ZIP</strong>.",
    noPackage: "★ <strong>Non supporta</strong> i file singoli <em>.package</em> (CC e mod non zip).",
    noExternal: "★ <strong>Non funziona</strong> con la cartella di The Sims in unità esterne (HDD, SSD, USB, ecc.).",
    download: "📥 Scarica",
    close: "❌ Chiudi",
    pageTitle: "Tabella - Mod +18",
    modLink: "MOD",
    mod18Link: "MOD +18",
    animazioniww18Link: "ANIMAZIONI WICKEDWHIMS +18",
    traduzioniLink: "TRADUZIONI",
    programmiLink: "PROGRAMMI",
    helpSimLink: "HELP SIM",
    searchPlaceholder: "Cerca...",
    filterStatusLabel: "Stato:",
    filterTranslationLabel: "Traduzione:",
    filterCategoryLabel: "Categoria:",
    filterFavoritesLabel: "Preferite:",
    tableHeaders: {
      favorites: "PREFERITE",
      author: "AUTORE",
      mod: "MOD",
      status: "STATO",
      modLink: "LINK MOD",
      lastModified: "DATA ULTIMA MODIFICA STATO MOD",
      translation: "TRADUZIONE",
      modRequirements: "MOD RICHIESTE",  // Nuova colonna
      dlcRequirements: "DLC RICHIESTI"   // Nuova colonna
    }
  },
  en: {
    helpSimTitle: "🚀 HELP SIM",
    helpSimDesc: "Tired of installing mods and translations manually? Help Sim is here to save you! With just a few clicks, you can add your favorite mods, keep everything under control and even clean up The Sims 4 cache files! Whether you want to expand your game with new mods or simply keep everything in order, you are in the right place.",
    relax: "Now relax, customize your game and let <strong>Help Sim</strong> do the rest! 🎮✨",
    precautions: "⚠️ SMALL PRECAUTIONS BEFORE DOWNLOADING  ⚠️",
    antivirus: "★ If the antivirus blocks the program, click on <strong>\"Run anyway\"</strong>.<br>The program is safe! It was entirely created by us.",
    guide: "★ Before using it, <strong>read the guide</strong> available on the program's home page.",
    zipSupport: "★ Supports only mod and translation files in <strong>ZIP format</strong>.",
    noPackage: "★ <strong>Does not support</strong> single <em>.package</em> files (CC and non-zipped mods).",
    noExternal: "★ <strong>Does not work</strong> with The Sims folder on external drives (HDD, SSD, USB, etc.).",
    download: "📥 Download",
    close: "❌ Close",
    pageTitle: "Table - Mod +18",
    modLink: "MOD",
    mod18Link: "MOD +18",
    animazioniww18Link: "ANIMATIONS WICKEDWHIMS +18",
    traduzioniLink: "ITALIAN TRANSLATIONS",
    programmiLink: "PROGRAMS",
    helpSimLink: "HELP SIM",
    searchPlaceholder: "Search...",
    filterStatusLabel: "Status:",
    filterTranslationLabel: "Italian Translation:",
    filterCategoryLabel: "Category:",
    filterFavoritesLabel: "Favorites:",
    tableHeaders: {
      favorites: "FAVORITES",
      author: "AUTHOR",
      mod: "MOD",
      status: "STATUS",
      modLink: "LINK MOD",
      lastModified: "LAST MODIFICATION DATE MOD STATUS",
      translation: "ITALIAN TRANSLATION",
      modRequirements: "MOD REQUIRED",   // Nuova colonna
      dlcRequirements: "DLC REQUIRED"    // Nuova colonna
    }
  }
};

// Traduzioni per stati e categorie
const translations = {
  "Compatibile": "Compatible",
  "Rotta": "Broken",
  "Aggiornata": "Updated",
  "Sconosciuta": "Unknown",
  "Nuova": "New",
  "Obsoleta": "Obsolete",
  "Compatible": "Compatibile",
  "Broken": "Rotta",
  "Updated": "Aggiornata",
  "Unknown": "Sconosciuta",
  "New": "Nuova",
  "Obsolete": "Obsoleta"
};

const translationTranslations = {
  "inclusa": "Included",
  "non necessaria": "Not Needed",
  "da-scaricare": "To Download",
  "in-lavorazione": "To Do",
  "Included": "Inclusa",
  "Not Needed": "Non necessaria",
  "To Download": "Da scaricare",
  "To Do": "In lavorazione",
  "null": "" // Gestione del valore null
};

const categoryTranslation = {
  "Carriere": "Careers",
  "Gameplay": "Gameplay",
  "Oggetti Funzionali": "Functional Items",
  "Utilità": "Utilities",
  "Tratti": "Traits",
  "Bug fix": "Bug Fixes",
  "Varie": "Miscellaneous"
};

// Funzione per cambiare lingua
function toggleLanguage() {
  const isEnglish = languageSwitch.checked;
  const lang = isEnglish ? "en" : "it";
  languageLabel.textContent = isEnglish ? "English" : "Italiano";
  localStorage.setItem("language", lang);

  // Aggiornamento dinamico dei testi
  document.querySelector("#popup h2").textContent = texts[lang].helpSimTitle;
  document.querySelector("#popup p").innerHTML = texts[lang].helpSimDesc;
  document.querySelector("#popup p:nth-of-type(2)").innerHTML = texts[lang].relax;
  document.querySelector("#popup h3").textContent = texts[lang].precautions;
  const precautionsList = document.querySelector("#popup ul");
  precautionsList.innerHTML = `
    <li>${texts[lang].antivirus}</li>
    <li>${texts[lang].guide}</li>
    <li>${texts[lang].zipSupport}</li>
    <li>${texts[lang].noPackage}</li>
    <li>${texts[lang].noExternal}</li>
  `;

  document.getElementById("download-btn").textContent = texts[lang].download;
  document.getElementById("close-btn").textContent = texts[lang].close;
  document.getElementById("page-title").textContent = texts[lang].pageTitle;
  document.getElementById("mod-link").textContent = texts[lang].modLink;
  document.getElementById("mod18-link").textContent = texts[lang].mod18Link;
  document.getElementById("animazioniww18-link").textContent = texts[lang].animazioniww18Link;
  document.getElementById("traduzioni-link").textContent = texts[lang].traduzioniLink;
  document.getElementById("programmi-link").textContent = texts[lang].programmiLink;
  document.getElementById("desc-mod-btn").textContent = texts[lang].helpSimLink;
  document.querySelector("#search").placeholder = texts[lang].searchPlaceholder;
  document.getElementById("filter-status-label").textContent = texts[lang].filterStatusLabel;
  document.getElementById("filter-translation-label").textContent = texts[lang].filterTranslationLabel;
  document.getElementById("filter-category-label").textContent = texts[lang].filterCategoryLabel;
  document.getElementById("filter-favorites-label").textContent = texts[lang].filterFavoritesLabel;
  
  // Aggiorna gli header della tabella
  document.querySelector("th:nth-child(1)").textContent = texts[lang].tableHeaders.favorites;
  document.querySelector("th:nth-child(2)").textContent = texts[lang].tableHeaders.author;
  document.querySelector("th:nth-child(3)").textContent = texts[lang].tableHeaders.mod;
  document.querySelector("th:nth-child(4)").textContent = texts[lang].tableHeaders.status;
  document.querySelector("th:nth-child(5)").textContent = texts[lang].tableHeaders.modLink;
  document.querySelector("th:nth-child(6)").textContent = texts[lang].tableHeaders.lastModified;
  document.querySelector("th:nth-child(7)").textContent = texts[lang].tableHeaders.translation;
  document.querySelector("th:nth-child(8)").textContent = texts[lang].tableHeaders.modRequirements;
  document.querySelector("th:nth-child(9)").textContent = texts[lang].tableHeaders.dlcRequirements;

  const italianLabels = document.querySelectorAll('.it-label');
  const englishLabels = document.querySelectorAll('.en-label');
  
  italianLabels.forEach(label => label.style.display = isEnglish ? 'none' : 'block');
  englishLabels.forEach(label => label.style.display = isEnglish ? 'block' : 'none');
  
  const filterFavorites = document.getElementById('filter-favorites');
  
  if (isEnglish) {
    filterFavorites.innerHTML = `
      <option value="">All</option>
      <option value="true">Favorites</option>
      <option value="false">No Favorites</option>
    `;
  } else {
    filterFavorites.innerHTML = `
      <option value="">Tutte</option>
      <option value="true">Preferite</option>
      <option value="false">Non Preferite</option>
    `;
  }

  filterFavorites.selectedIndex = 0;
  document.getElementById("search").value = "";
  filterTable();
  setTimeout(loadModsFromJson, 100);
}

// Impostazione della lingua iniziale
function setInitialLanguage() {
  const savedLanguage = localStorage.getItem("language") || "it";
  languageSwitch.checked = savedLanguage === "en";
  toggleLanguage();
}

languageSwitch.addEventListener("change", toggleLanguage);
setInitialLanguage();
