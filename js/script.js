// Gestione del popup HelpSim
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
    document.getElementById("popup").style.display = "none";
});

// Gestione dropdown
function toggleDropdown(id) {
  var dropdown = document.getElementById(id);
  var button = dropdown.previousElementSibling;

  if (dropdown.style.display === 'none' || dropdown.style.display === '') {
    dropdown.style.display = 'block';
    setTimeout(function() {
      dropdown.style.opacity = 1;
    }, 10);
    button.innerHTML = '▲';
  } else {
    dropdown.style.opacity = 0;
    setTimeout(function() {
      dropdown.style.display = 'none';
    }, 300);
    button.innerHTML = '▼';
  }
}

// Gestione tooltip
function showTooltip(event, modName) {
  const tooltip = document.querySelector(`#${modName} .tooltip`);
  tooltip.style.display = 'block';
}

function hideTooltip(event) {
  const tooltip = event.target.querySelector('.tooltip');
  if (tooltip) {
    tooltip.style.display = 'none';
  }
}

// Scroll to top
window.addEventListener("scroll", function () {
  const scrollToTopButton = document.getElementById("scrollToTop");
  if (window.scrollY > 300) {
    scrollToTopButton.style.display = "block";
  } else {
    scrollToTopButton.style.display = "none";
  }
});

document.getElementById("scrollToTop").addEventListener("click", function (e) {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// Gestione sessionStorage
window.addEventListener('beforeunload', () => {
  Object.keys(sessionStorage)
    .filter(key => key !== 'favorites')
    .forEach(key => sessionStorage.removeItem(key)); 
});

// MOSTRA POPUP INFORMATIVO ALL'APERTURA DELLA PAGINA (UNA VOLTA PER SESSIONE)
window.addEventListener('load', function() {
    // Controlla se il popup è già stato mostrato in questa sessione
    if (!sessionStorage.getItem('infoPopupShown')) {
        // Crea il popup dinamicamente
        const infoPopup = document.createElement('div');
        infoPopup.id = 'info-popup';
        infoPopup.className = 'popup';
        infoPopup.style.display = 'block';
        infoPopup.innerHTML = `
            <div class="popup-content">
                <h3 style="color: #ff6b6b; text-align: center; margin-bottom: 15px;">📢 IMPORTANTE</h3>
                <p style="margin-bottom: 15px; line-height: 1.6;">Molte mod di Carriera e carriere integrate, per funzionare ora richiedono la mod: <strong style="color: #4CAF50;">Core Library di Lot51</strong>, incluse quelle di Adeepindigo.</p>
                <p style="margin-bottom: 20px; line-height: 1.6;">Controlla sempre la colonna delle <strong style="color: #4CAF50;">'Mod Richieste'</strong> in tabella.</p>
                <div class="popup-buttons" style="display: flex; justify-content: center;">
                    <button id="info-popup-close-btn" style="background-color: #4CAF50; color: white; border: none; padding: 10px 25px; border-radius: 5px; cursor: pointer; font-size: 16px;">✓  Ho capito</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(infoPopup);
        
        // Aggiungi evento per chiudere il popup
        document.getElementById('info-popup-close-btn').addEventListener('click', function() {
            infoPopup.style.display = 'none';
            sessionStorage.setItem('infoPopupShown', 'true');
        });
        
        // Chiudi anche cliccando fuori dal popup
        infoPopup.addEventListener('click', function(e) {
            if (e.target === infoPopup) {
                infoPopup.style.display = 'none';
                sessionStorage.setItem('infoPopupShown', 'true');
            }
        });

        // Aggiungi anche la chiusura con il tasto ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && infoPopup.style.display === 'block') {
                infoPopup.style.display = 'none';
                sessionStorage.setItem('infoPopupShown', 'true');
            }
        });
    }
});

// Funzione per mostrare manualmente il popup informativo (opzionale)
function showInfoPopup() {
    const infoPopup = document.getElementById('info-popup');
    if (infoPopup) {
        infoPopup.style.display = 'block';
    } else {
        // Se il popup non esiste, ricrealo
        const newInfoPopup = document.createElement('div');
        newInfoPopup.id = 'info-popup';
        newInfoPopup.className = 'popup';
        newInfoPopup.style.display = 'block';
        newInfoPopup.innerHTML = `
            <div class="popup-content">
                <h3 style="color: #ff6b6b; text-align: center; margin-bottom: 15px;">📢 IMPORTANTE</h3>
                <p style="margin-bottom: 15px; line-height: 1.6;">Molte mod di Carriera e carriere integrate, per funzionare ora richiedono la mod: <strong style="color: #4CAF50;">Core Library di Lot51</strong>, incluse quelle di Adeepindigo.</p>
                <p style="margin-bottom: 20px; line-height: 1.6;">Controlla sempre la colonna delle <strong style="color: #4CAF50;">'Mod Richieste'</strong> in tabella.</p>
                <div class="popup-buttons" style="display: flex; justify-content: center;">
                    <button id="info-popup-close-btn" style="background-color: #4CAF50; color: white; border: none; padding: 10px 25px; border-radius: 5px; cursor: pointer; font-size: 16px;">❌ Ho capito</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(newInfoPopup);
        
        document.getElementById('info-popup-close-btn').addEventListener('click', function() {
            newInfoPopup.style.display = 'none';
            sessionStorage.setItem('infoPopupShown', 'true');
        });
        
        newInfoPopup.addEventListener('click', function(e) {
            if (e.target === newInfoPopup) {
                newInfoPopup.style.display = 'none';
                sessionStorage.setItem('infoPopupShown', 'true');
            }
        });
    }
}

// Pulisci lo sessionStorage al caricamento della pagina per i popup non relativi ai preferiti
window.addEventListener('load', function() {
    // Mantieni solo il flag del popup informativo
    const infoPopupShown = sessionStorage.getItem('infoPopupShown');
    sessionStorage.clear();
    if (infoPopupShown) {
        sessionStorage.setItem('infoPopupShown', infoPopupShown);
    }
});
