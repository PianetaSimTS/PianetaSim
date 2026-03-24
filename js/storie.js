// Configurazione
const STORIES_BASE_PATH = 'Storie/card';
let allStories = [];
let authorsList = [];
let favorites = [];

// Elementi DOM
const storiesGrid = document.getElementById('storiesGrid');
const searchInput = document.getElementById('searchInput');
const authorFilter = document.getElementById('authorFilter');
const statsText = document.getElementById('statsText');
const modal = document.getElementById('storyModal');
const modalContent = document.getElementById('modalContent');
const modalClose = document.querySelector('.modal-close');

// Carica preferiti dal localStorage
function loadFavorites() {
    const saved = localStorage.getItem('simStoriesFavorites');
    if (saved) {
        try {
            favorites = JSON.parse(saved);
        } catch(e) {
            favorites = [];
        }
    }
    return favorites;
}

// Salva preferiti nel localStorage
function saveFavorites() {
    localStorage.setItem('simStoriesFavorites', JSON.stringify(favorites));
}

// Aggiungi o rimuovi dai preferiti
function toggleFavorite(storyId) {
    const index = favorites.indexOf(storyId);
    if (index === -1) {
        favorites.push(storyId);
        showToast('⭐ Aggiunta ai preferiti!', 'success');
    } else {
        favorites.splice(index, 1);
        showToast('🗑️ Rimossa dai preferiti', 'info');
    }
    saveFavorites();
    updateGrid(); // Aggiorna la griglia per mostrare il cambio di stato
}

// Verifica se una storia è nei preferiti
function isFavorite(storyId) {
    return favorites.includes(storyId);
}

// Mostra un toast di notifica
function showToast(message, type = 'info') {
    // Rimuovi toast esistenti
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-heart' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    // Animazione di entrata
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Rimuovi dopo 3 secondi
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Verifica se una storia è stata aggiornata (confronta con data salvata)
function checkForUpdates(story) {
    const lastViewed = localStorage.getItem(`story_viewed_${story.id || story.titolo}`);
    const currentDate = story.data_modifica || story.data || story.data_pubblicazione;
    
    if (lastViewed && currentDate && new Date(currentDate) > new Date(lastViewed)) {
        return true;
    }
    return false;
}

// Segna una storia come visualizzata
function markStoryAsViewed(story) {
    const storyKey = story.id || story.titolo;
    const currentDate = story.data_modifica || story.data || story.data_pubblicazione || new Date().toISOString();
    localStorage.setItem(`story_viewed_${storyKey}`, currentDate);
}

// Crea la card HTML per una storia (versione aggiornata con preferiti e badge aggiornamento)
function createStoryCard(story) {
    const card = document.createElement('div');
    card.className = 'story-card';
    
    const storyId = story.id || story.titolo;
    const isFav = isFavorite(storyId);
    const hasUpdate = checkForUpdates(story);
    
    const coverUrl = story.copertina && story.copertina !== '' ? story.copertina : '';
    
    const coverHtml = coverUrl 
        ? `<img src="${coverUrl}" alt="${escapeHtml(story.titolo)}" onerror="handleImageError(this)">`
        : `<div class="cover-placeholder"><i class="fas fa-book"></i></div>`;
    
    const authorName = story.autore || (story.pubblicato_da?.nome) || 'Autore sconosciuto';
    
    // Determina se la descrizione è lunga (>150 caratteri)
    const description = story.descrizione || 'Nessuna descrizione disponibile.';
    const isLongDescription = description.length > 150;
    const shortDescription = isLongDescription ? description.substring(0, 150) + '...' : description;
    
    card.innerHTML = `
        <div class="card-cover">
            ${coverHtml}
            <div class="author-badge">
                <i class="fas fa-user"></i> ${escapeHtml(authorName)}
            </div>
            ${hasUpdate ? '<div class="update-badge"><i class="fas fa-sync-alt"></i> Aggiornata!</div>' : ''}
            <button class="favorite-btn ${isFav ? 'active' : ''}" data-story-id="${escapeHtml(storyId)}">
                <i class="fas ${isFav ? 'fa-heart' : 'fa-heart'}"></i>
            </button>
        </div>
        <div class="card-content">
            <h3 class="card-title">${escapeHtml(story.titolo)}</h3>
            <div class="card-meta">
                <span><i class="fas fa-calendar-alt"></i> ${escapeHtml(story.data || formatDate(story.data_pubblicazione))}</span>
                <span><i class="fas fa-user-pen"></i> ${escapeHtml(authorName)}</span>
                ${story.data_modifica ? `<span class="update-date"><i class="fas fa-edit"></i> Agg.: ${formatDate(story.data_modifica)}</span>` : ''}
            </div>
            <p class="card-description">${escapeHtml(shortDescription)}</p>
            ${isLongDescription ? '<div class="expand-hint"><i class="fas fa-expand-alt"></i> <span>Clicca sulla card per leggere la descrizione completa</span></div>' : ''}
            <div class="card-links">
                ${story.links?.ig ? `<a href="${story.links.ig}" target="_blank" rel="noopener noreferrer" class="social-link" title="Vai a Instagram"><i class="fab fa-instagram"></i></a>` : ''}
                ${story.links?.tg ? `<a href="${story.links.tg}" target="_blank" rel="noopener noreferrer" class="social-link" title="Vai a Telegram"><i class="fab fa-telegram"></i></a>` : ''}
                ${story.links?.patreon ? `<a href="${story.links.patreon}" target="_blank" rel="noopener noreferrer" class="social-link" title="Vai a Patreon"><i class="fab fa-patreon"></i></a>` : ''}
                ${story.links?.youtube ? `<a href="${story.links.youtube}" target="_blank" rel="noopener noreferrer" class="social-link" title="Vai a YouTube"><i class="fab fa-youtube"></i></a>` : ''}
                ${story.links?.twitter ? `<a href="${story.links.twitter}" target="_blank" rel="noopener noreferrer" class="social-link" title="Vai a Twitter"><i class="fab fa-twitter"></i></a>` : ''}
                ${story.links?.facebook ? `<a href="${story.links.facebook}" target="_blank" rel="noopener noreferrer" class="social-link" title="Vai a Facebook"><i class="fab fa-facebook"></i></a>` : ''}
                ${story.links?.tiktok ? `<a href="${story.links.tiktok}" target="_blank" rel="noopener noreferrer" class="social-link" title="Vai a TikTok"><i class="fab fa-tiktok"></i></a>` : ''}
                ${story.links?.discord ? `<a href="${story.links.discord}" target="_blank" rel="noopener noreferrer" class="social-link" title="Vai a Discord"><i class="fab fa-discord"></i></a>` : ''}
                ${story.links?.twitch ? `<a href="${story.links.twitch}" target="_blank" rel="noopener noreferrer" class="social-link" title="Vai a Twitch"><i class="fab fa-twitch"></i></a>` : ''}
                ${story.links?.altro ? `<a href="${story.links.altro}" target="_blank" rel="noopener noreferrer" class="social-link" title="Vai al link"><i class="fas fa-link"></i></a>` : ''}
            </div>
            <div class="click-hint">
                <i class="fas fa-hand-pointer"></i> <span>Clicca sull'icona dei social per la storia completa</span>
            </div>
        </div>
    `;
    
    // Evento per il pulsante preferiti
    const favBtn = card.querySelector('.favorite-btn');
    if (favBtn) {
        favBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(storyId);
        });
    }
    
    card.addEventListener('click', (e) => {
        if (!e.target.closest('.card-links') && e.target.tagName !== 'A' && !e.target.closest('.favorite-btn')) {
            openModal(story);
        }
    });
    
    return card;
}

// Apre il modal con i dettagli della storia (versione aggiornata)
function openModal(story) {
    const authorName = story.autore || (story.pubblicato_da?.nome) || 'Autore sconosciuto';
    const coverUrl = story.copertina && story.copertina !== '' ? story.copertina : '';
    const storyId = story.id || story.titolo;
    const isFav = isFavorite(storyId);
    const hasUpdate = checkForUpdates(story);
    
    // Segna come visualizzata
    markStoryAsViewed(story);
    
    if (modalContent) {
        modalContent.innerHTML = `
            ${coverUrl ? `<img class="modal-cover" src="${coverUrl}" alt="${escapeHtml(story.titolo)}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'600\' height=\'250\' viewBox=\'0 0 600 250\'%3E%3Crect width=\'600\' height=\'250\' fill=\'%23343a40\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%23ffffff\' font-size=\'16\'%3E📖 Copertina non disponibile%3C/text%3E%3C/svg%3E'">` : `<div class="modal-cover" style="background: linear-gradient(135deg, #16ab63, #b510bd); display: flex; align-items: center; justify-content: center;"><i class="fas fa-book-open" style="font-size: 64px; color: white;"></i></div>`}
            <div class="modal-body">
                <div class="modal-header-actions">
                    <h2 class="modal-title">${escapeHtml(story.titolo)}</h2>
                    <button class="modal-favorite-btn ${isFav ? 'active' : ''}" data-story-id="${escapeHtml(storyId)}">
                        <i class="fas ${isFav ? 'fa-heart' : 'fa-heart'}"></i>
                        <span>${isFav ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}</span>
                    </button>
                </div>
                ${hasUpdate ? '<div class="update-notice"><i class="fas fa-sync-alt fa-fw"></i> Questa storia è stata aggiornata di recente!</div>' : ''}
                <div class="modal-meta">
                    <span><i class="fas fa-user"></i> <strong>Autore:</strong> ${escapeHtml(authorName)}</span>
                    <span><i class="fas fa-calendar"></i> <strong>Data:</strong> ${escapeHtml(story.data || formatDate(story.data_pubblicazione))}</span>
                    ${story.data_modifica ? `<span><i class="fas fa-edit"></i> <strong>Ultimo aggiornamento:</strong> ${formatDate(story.data_modifica)}</span>` : ''}
                    ${story.pubblicato_da?.username ? `<span><i class="fas fa-id-badge"></i> <strong>Pubblicato da:</strong> @${escapeHtml(story.pubblicato_da.username)}</span>` : ''}
                </div>
                <div class="modal-description">
                    <p>${escapeHtml(story.descrizione || 'Nessuna descrizione disponibile.')}</p>
                </div>
                <div class="modal-links">
                    <p class="social-hint"><i class="fas fa-mouse-pointer"></i> Clicca sui pulsanti qui sotto per visitare i profili social dell'autore:</p>
                    <div class="modal-social-buttons">
                        ${story.links?.ig ? `<a href="${story.links.ig}" target="_blank" rel="noopener noreferrer" class="modal-social-btn instagram"><i class="fab fa-instagram"></i> Instagram</a>` : ''}
                        ${story.links?.tg ? `<a href="${story.links.tg}" target="_blank" rel="noopener noreferrer" class="modal-social-btn telegram"><i class="fab fa-telegram"></i> Telegram</a>` : ''}
                        ${story.links?.patreon ? `<a href="${story.links.patreon}" target="_blank" rel="noopener noreferrer" class="modal-social-btn patreon"><i class="fab fa-patreon"></i> Patreon</a>` : ''}
                        ${story.links?.youtube ? `<a href="${story.links.youtube}" target="_blank" rel="noopener noreferrer" class="modal-social-btn youtube"><i class="fab fa-youtube"></i> YouTube</a>` : ''}
                        ${story.links?.twitter ? `<a href="${story.links.twitter}" target="_blank" rel="noopener noreferrer" class="modal-social-btn twitter"><i class="fab fa-twitter"></i> Twitter</a>` : ''}
                        ${story.links?.facebook ? `<a href="${story.links.facebook}" target="_blank" rel="noopener noreferrer" class="modal-social-btn facebook"><i class="fab fa-facebook"></i> Facebook</a>` : ''}
                        ${story.links?.tiktok ? `<a href="${story.links.tiktok}" target="_blank" rel="noopener noreferrer" class="modal-social-btn tiktok"><i class="fab fa-tiktok"></i> TikTok</a>` : ''}
                        ${story.links?.discord ? `<a href="${story.links.discord}" target="_blank" rel="noopener noreferrer" class="modal-social-btn discord"><i class="fab fa-discord"></i> Discord</a>` : ''}
                        ${story.links?.twitch ? `<a href="${story.links.twitch}" target="_blank" rel="noopener noreferrer" class="modal-social-btn twitch"><i class="fab fa-twitch"></i> Twitch</a>` : ''}
                        ${story.links?.altro ? `<a href="${story.links.altro}" target="_blank" rel="noopener noreferrer" class="modal-social-btn altro"><i class="fas fa-link"></i> Altro link</a>` : ''}
                    </div>
                </div>
            </div>
        `;
        
        // Aggiungi evento per il pulsante preferiti nel modal
        const modalFavBtn = modalContent.querySelector('.modal-favorite-btn');
        if (modalFavBtn) {
            modalFavBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFavorite(storyId);
                // Aggiorna il pulsante nel modal
                const isNowFav = isFavorite(storyId);
                modalFavBtn.classList.toggle('active', isNowFav);
                modalFavBtn.querySelector('span').textContent = isNowFav ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti';
                // Aggiorna anche il pulsante nella card corrispondente
                updateGrid();
            });
        }
    }
    
    if (modal) modal.classList.add('show');
}

// Filtra le storie (con opzione per mostrare solo preferiti)
let showOnlyFavorites = false;

// Aggiungi un filtro per preferiti
function addFavoritesFilter() {
    const filterContainer = document.querySelector('.filters-container');
    if (filterContainer) {
        const favoritesFilterBtn = document.createElement('button');
        favoritesFilterBtn.id = 'favoritesFilterBtn';
        favoritesFilterBtn.className = 'favorites-filter-btn';
        favoritesFilterBtn.innerHTML = '<i class="fas fa-heart"></i> Preferiti';
        favoritesFilterBtn.addEventListener('click', () => {
            showOnlyFavorites = !showOnlyFavorites;
            favoritesFilterBtn.classList.toggle('active', showOnlyFavorites);
            updateGrid();
        });
        filterContainer.appendChild(favoritesFilterBtn);
    }
}

// Filtra le storie aggiornato
function filterStories() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const selectedAuthor = authorFilter ? authorFilter.value : '';
    
    return allStories.filter(story => {
        // Filtro preferiti
        if (showOnlyFavorites && !isFavorite(story.id || story.titolo)) {
            return false;
        }
        
        if (selectedAuthor && story.autore !== selectedAuthor && 
            (!story.pubblicato_da || story.pubblicato_da.nome !== selectedAuthor)) {
            return false;
        }
        
        if (searchTerm) {
            const titoloMatch = story.titolo?.toLowerCase().includes(searchTerm);
            const autoreMatch = story.autore?.toLowerCase().includes(searchTerm);
            const descrizioneMatch = story.descrizione?.toLowerCase().includes(searchTerm);
            const pubblicatoMatch = story.pubblicato_da?.nome?.toLowerCase().includes(searchTerm);
            
            return titoloMatch || autoreMatch || descrizioneMatch || pubblicatoMatch;
        }
        
        return true;
    });
}

// Aggiorna la griglia (versione aggiornata)
function updateGrid() {
    if (allStories.length === 0) return;
    
    const filtered = filterStories();
    const favoritesCount = favorites.length;
    
    if (statsText) {
        let statsMessage = `📚 ${filtered.length} ${filtered.length === 1 ? 'storia trovata' : 'storie trovate'} su ${allStories.length} totali`;
        if (favoritesCount > 0) {
            statsMessage += ` | ⭐ ${favoritesCount} nei preferiti`;
        }
        statsText.innerHTML = statsMessage;
    }
    
    if (storiesGrid) {
        storiesGrid.innerHTML = '';
        
        if (filtered.length === 0) {
            storiesGrid.innerHTML = `<div class="no-results">
                <i class="fas ${showOnlyFavorites ? 'fa-heart-broken' : 'fa-search'} fa-3x"></i>
                <h3>${showOnlyFavorites ? 'Nessuna storia nei preferiti' : 'Nessuna storia trovata'}</h3>
                <p>${showOnlyFavorites ? 'Aggiungi alcune storie ai preferiti cliccando sul cuore' : 'Prova a modificare i filtri di ricerca'}</p>
            </div>`;
            return;
        }
        
        filtered.forEach((story, index) => {
            const card = createStoryCard(story);
            card.style.animationDelay = `${index * 0.05}s`;
            storiesGrid.appendChild(card);
        });
    }
}

// Inizializza la pagina (versione aggiornata)
async function init() {
    createStars();
    window.handleImageError = handleImageError;
    loadFavorites();
    
    try {
        allStories = await loadAllStories();
        
        if (allStories.length > 0) {
            updateAuthorsList(allStories);
            addFavoritesFilter();
            updateGrid();
            if (statsText) statsText.innerHTML = `📚 ${allStories.length} ${allStories.length === 1 ? 'storia caricata' : 'storie caricate'}`;
        }
    } catch (error) {
        console.error('Errore:', error);
    }
    
    if (searchInput) searchInput.addEventListener('input', updateGrid);
    if (authorFilter) authorFilter.addEventListener('change', updateGrid);
}

// Event listeners per il modal
if (modalClose) {
    modalClose.addEventListener('click', () => {
        if (modal) modal.classList.remove('show');
    });
}

if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
}

// Avvia l'inizializzazione quando il DOM è caricato
document.addEventListener('DOMContentLoaded', init);
