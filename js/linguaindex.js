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
    welcomeText: "Qui troverai gli aggiornamenti più recenti su mod, mod +18, animazioni per la mod WickedWhims, traduzioni italiane e programmi per The Sims 4. Monitoriamo costantemente lo stato dei contenuti per offrirti informazioni accurate.<br><br>Rimani aggiornato e migliora la tua esperienza di gioco con noi!",
    buttonHint: "⬇ PREMI QUI SOTTO PER RECARTI NELLA TABELLA DESIDERATA ⬇",
    socialFollow: "Unisciti ai nostri social ed entra a far parte della community Pianeta Sim! Potrai trovare assistenza e molto altro ancora!",
    copyright: "&copy; 2025 Pianeta Sim. Tutti i diritti riservati.",
    modButton: "MOD",
    mod18Button: "MOD +18",
    animationsButton: "ANIMAZIONI",
    programsButton: "PROGRAMMI",
    helpSimButton: "HELP SIM",
    assistanceButton: "ASSISTENZA",
    requestsButton: "RICHIESTE MOD",
    comingButton: "IN ARRIVO"
  },
  en: {
    helpSimTitle: "🚀 HELP SIM",
    helpSimDesc: "Tired of installing mods and translations manually? Help Sim is here to save you! With just a few clicks, you can add your favorite mods, keep everything under control and even clean up The Sims 4 cache files! Whether you want to expand your game with new mods or simply keep everything in order, you are in the right place.",
    relax: "Now relax, customize your game and let <strong>Help Sim</strong> do the rest! 🎮✨",
    precautions: "⚠️ SMALL PRECAUTIONS BEFORE DOWNLOADING ⚠️",
    antivirus: "★ If the antivirus blocks the program, click on <strong>\"Run anyway\"</strong>.<br>The program is safe! It was entirely created by us.",
    guide: "★ Before using it, <strong>read the guide</strong> available on the program's home page.",
    zipSupport: "★ Supports only mod and translation files in <strong>ZIP format</strong>.",
    noPackage: "★ <strong>Does not support</strong> single <em>.package</em> files (CC and non-zipped mods).",
    noExternal: "★ <strong>Does not work</strong> with The Sims folder on external drives (HDD, SSD, USB, etc.).",
    download: "📥 Download",
    close: "❌ Close",
    welcomeText: "Here you will find the latest updates on mods, +18 mods, animations for the WickedWhims mod, Italian translations and programs for The Sims 4. We constantly monitor the status of content to provide you with accurate information.<br><br>Stay updated and improve your gaming experience with us!",
    buttonHint: "⬇ CLICK BELOW TO GO TO THE DESIRED TABLE ⬇",
    socialFollow: "Join our social media and become part of the Pianeta Sim community! You’ll find support and much more!",
    copyright: "&copy; 2025 Pianeta Sim. All rights reserved.",
    modButton: "MOD",
    mod18Button: "MOD +18",
    animationsButton: "ANIMATIONS",
    programsButton: "PROGRAMS",
    helpSimButton: "HELP SIM",
    assistanceButton: "ASSISTANCE",
    requestsButton: "MOD REQUESTS",
    comingButton: "COMING SOON"
  }
};

// Funzione per cambiare lingua
function toggleLanguage() {
  const isEnglish = languageSwitch.checked;
  const lang = isEnglish ? "en" : "it";
  languageLabel.textContent = isEnglish ? "English" : "Italiano";
  localStorage.setItem("language", lang);

  // Aggiornamento dinamico dei testi nella pagina index
  if (document.querySelector("#popup h2")) {
    document.querySelector("#popup h2").textContent = texts[lang].helpSimTitle;
    document.querySelector("#popup p").innerHTML = texts[lang].helpSimDesc;
    document.querySelector("#popup p:nth-of-type(2)").innerHTML = texts[lang].relax;
    document.querySelector("#popup h3").textContent = texts[lang].precautions;
    
    const precautionsList = document.querySelector("#popup ul");
    if (precautionsList) {
      precautionsList.innerHTML = `
        <li>${texts[lang].antivirus}</li>
        <li>${texts[lang].guide}</li>
        <li>${texts[lang].zipSupport}</li>
        <li>${texts[lang].noPackage}</li>
        <li>${texts[lang].noExternal}</li>
      `;
    }

    document.getElementById("download-btn").textContent = texts[lang].download;
    document.getElementById("close-btn").textContent = texts[lang].close;
  }

  // Aggiorna i testi della pagina principale
  const introText = document.querySelector(".intro-text");
  if (introText) {
    introText.innerHTML = texts[lang].welcomeText;
  }

  const buttonHint = document.querySelector(".button-hint");
  if (buttonHint) {
    buttonHint.textContent = texts[lang].buttonHint;
  }

  const socialText = document.querySelector(".social-container p");
  if (socialText) {
    socialText.textContent = texts[lang].socialFollow;
  }

  const copyright = document.querySelector(".index-footer p:last-child");
  if (copyright) {
    copyright.innerHTML = texts[lang].copyright;
  }

  // Aggiorna i pulsanti
  const buttons = document.querySelectorAll(".button-container a");
  if (buttons.length >= 8) {
    buttons[0].textContent = texts[lang].modButton;
    buttons[1].textContent = texts[lang].mod18Button;
    buttons[2].textContent = texts[lang].animationsButton;
    buttons[3].textContent = texts[lang].programsButton;
    buttons[4].textContent = texts[lang].helpSimButton;
    buttons[5].textContent = texts[lang].assistanceButton;
    buttons[6].textContent = texts[lang].requestsButton;
    buttons[7].textContent = texts[lang].comingButton;
  }
}

// Impostazione della lingua iniziale
function setInitialLanguage() {
  const savedLanguage = localStorage.getItem("language") || "it";
  languageSwitch.checked = savedLanguage === "en";
  toggleLanguage();
}

// Aggiungi event listener quando il DOM è caricato
document.addEventListener("DOMContentLoaded", function() {
  setInitialLanguage();
  languageSwitch.addEventListener("change", toggleLanguage);
});