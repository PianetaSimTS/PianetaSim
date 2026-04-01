// Configurazione
const STORIES_BASE_PATH = 'Storie/card';
let allStories = [];
let authorsList = [];
let favorites = [];
let showOnlyFavorites = false;
let currentSort = 'date_desc'; // Default: più recenti

// Elementi DOM
const storiesGrid = document.getElementById('storiesGrid');
const searchInput = document.getElementById('searchInput');
const authorFilter = document.getElementById('authorFilter');
const sortFilter = document.getElementById('sortFilter');
const statsText = document.getElementById('statsText');
const modal = document.getElementById('storyModal');
const modalContent = document.getElementById('modalContent');
const modalClose = document.querySelector('.modal-close');

// ========== FUNZIONE PER CREARE STELLE ANIMATE ==========
function createStars() {
    const starsContainer = document.getElementById('starsContainer');
    if (!starsContainer) return;
    
    const starCount = 100;
    starsContainer.innerHTML = '';
    
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.classList.add('star');
        const isGreen = Math.random() > 0.5;
        star.classList.add(isGreen ? 'green' : 'purple');
        
        const size = Math.random() * 4 + 2;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 5}s`;
        star.style.animationDuration = `${Math.random() * 3 + 3}s`;
        
        starsContainer.appendChild(star);
    }
}

// ========== FUNZIONI PREFERITI ==========
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

function saveFavorites() {
    localStorage.setItem('simStoriesFavorites', JSON.stringify(favorites));
}

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
    updateGrid();
}

function isFavorite(storyId) {
    return favorites.includes(storyId);
}

// ========== TOAST NOTIFICATION ==========
function showToast(message, type = 'info') {
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-heart' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ========== FUNZIONI AGGIORNAMENTO STORIE ==========
function checkForUpdates(story) {
    const storyKey = story.id || story.titolo;
    const lastViewed = localStorage.getItem(`story_viewed_${storyKey}`);
    const currentDate = story.data_modifica || story.data || story.data_pubblicazione;
    
    if (lastViewed && currentDate && new Date(currentDate) > new Date(lastViewed)) {
        return true;
    }
    return false;
}

function markStoryAsViewed(story) {
    const storyKey = story.id || story.titolo;
    const currentDate = story.data_modifica || story.data || story.data_pubblicazione || new Date().toISOString();
    localStorage.setItem(`story_viewed_${storyKey}`, currentDate);
}

// ========== FUNZIONI CARICAMENTO STORIE ==========
async function getJsonFilesFromGitHub() {
    try {
        const githubApiUrl = `https://api.github.com/repos/PianetaSimTS/PianetaSim/contents/${STORIES_BASE_PATH}`;
        
        const response = await fetch(githubApiUrl);
        
        if (response.ok) {
            const files = await response.json();
            const jsonFiles = files
                .filter(file => file.name.endsWith('.json') && file.name !== 'list.json')
                .map(file => file.name);
            return jsonFiles;
        } else {
            console.warn('GitHub API non disponibile, provo metodo alternativo...');
            return await getJsonFilesFromListFile();
        }
    } catch (error) {
        console.error('Errore GitHub API:', error);
        return await getJsonFilesFromListFile();
    }
}

async function getJsonFilesFromListFile() {
    try {
        const listResponse = await fetch(`${STORIES_BASE_PATH}/list.json`);
        if (listResponse.ok) {
            const listData = await listResponse.json();
            if (listData.files && Array.isArray(listData.files)) {
                console.log('📋 File JSON da list.json:', listData.files);
                return listData.files;
            }
        }
    } catch (e) {
        console.log('Nessun file list.json trovato');
    }
    
    console.warn('Nessun metodo automatico disponibile. Creare list.json');
    return [];
}

async function loadAllStories() {
    try {
        let jsonFiles = [];
        
        if (window.location.hostname.includes('github.io')) {
            jsonFiles = await getJsonFilesFromGitHub();
        } else {
            jsonFiles = await getJsonFilesFromListFile();
        }
        
        if (jsonFiles.length === 0) {
            if (storiesGrid) {
                storiesGrid.innerHTML = `
                    <div class="error-container">
                        <i class="fas fa-info-circle fa-3x"></i>
                        <h3>Non ci sono storie disponibili</h3>
                    </div>
                `;
            }
            if (statsText) statsText.innerHTML = '📂 Non ci sono storie attualmente';
            return [];
        }
        
        const stories = [];
        let loadedCount = 0;
        
        if (statsText) statsText.innerHTML = `📖 Caricamento storie... (0/${jsonFiles.length})`;
        
        for (const file of jsonFiles) {
            try {
                const response = await fetch(`${STORIES_BASE_PATH}/${file}`);
                if (response.ok) {
const data = await response.json();
if (Array.isArray(data)) {
    data.forEach(story => normalizeStoryLinks(story));
    stories.push(...data);
} else if (data && typeof data === 'object') {
    normalizeStoryLinks(data);
    stories.push(data);
}
                    loadedCount++;
                    if (statsText) statsText.innerHTML = `📖 Caricamento storie... (${loadedCount}/${jsonFiles.length})`;
                    console.log(`✅ Caricato: ${file}`);
                } else {
                    console.warn(`❌ Impossibile caricare ${file}: ${response.status}`);
                    loadedCount++;
                }
            } catch (err) {
                console.warn(`❌ Errore nel caricamento di ${file}:`, err);
                loadedCount++;
            }
        }
        
        return stories;
        
    } catch (error) {
        console.error('Errore nel caricamento delle storie:', error);
        return [];
    }
}

function normalizeStoryLinks(story) {
    if (story.links) {
        // Supporta sia 'yt' che 'youtube'
        if (story.links.yt && !story.links.youtube) {
            story.links.youtube = story.links.yt;
        }
        // Supporta sia 'ig' che 'instagram'
        if (story.links.ig && !story.links.instagram) {
            story.links.instagram = story.links.ig;
        }
        // Supporta sia 'tg' che 'telegram'
        if (story.links.tg && !story.links.telegram) {
            story.links.telegram = story.links.tg;
        }
    }
    return story;
}

// ========== FUNZIONI UTILITY ==========
function updateAuthorsList(stories) {
    const authors = new Set();
    stories.forEach(story => {
        if (story.autore) {
            authors.add(story.autore);
        }
        if (story.pubblicato_da && story.pubblicato_da.nome) {
            authors.add(story.pubblicato_da.nome);
        }
    });
    authorsList = Array.from(authors).sort();
    
    if (authorFilter) {
        authorFilter.innerHTML = '<option value="">📝 Tutti gli autori</option>';
        authorsList.forEach(author => {
            authorFilter.innerHTML += `<option value="${escapeHtml(author)}">✍️ ${escapeHtml(author)}</option>`;
        });
    }
}

function formatDate(dateString) {
    if (!dateString) return 'Data non disponibile';
    // Se la data è già in formato italiano, la restituisco così com'è
    if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        return dateString;
    }
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch {
        return dateString;
    }
}

function convertItalianDateToISO(dateString) {
    if (!dateString) return '1970-01-01';
    
    // Se è già in formato ISO (yyyy-mm-dd), restituiscilo
    if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
        return dateString;
    }
    
    // Converte da formato italiano (dd/mm/yyyy) a ISO (yyyy-mm-dd)
    const parts = dateString.split('/');
    if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
    }
    
    return '1970-01-01';
}

// Funzione per ottenere la data di riferimento per l'ordinamento
function getStoryDate(story) {
    let dateString = null;
    
    // Prova a ottenere la data nell'ordine di priorità
    if (story.data_modifica) dateString = story.data_modifica;
    else if (story.data_pubblicazione) dateString = story.data_pubblicazione;
    else if (story.data) dateString = story.data;
    
    // Se non c'è data, usa una data molto vecchia
    if (!dateString) return '1970-01-01';
    
    // Converti la data italiana in formato ISO per l'ordinamento
    return convertItalianDateToISO(dateString);
}

function handleImageError(img) {
    img.onerror = null;
    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"%3E%3Crect width="400" height="200" fill="%23343a40"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23ffffff" font-size="14"%3E📖 Copertina non disponibile%3C/text%3E%3C/svg%3E';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Funzione per verificare se una storia ha almeno un link
function hasAnyLink(story) {
    return story.links && Object.keys(story.links).some(key => story.links[key] && story.links[key] !== '');
}

// ========== FUNZIONI ORDINAMENTO ==========
function sortStories(stories) {
    const sorted = [...stories];
    
    switch(currentSort) {
        case 'date_desc':
            return sorted.sort((a, b) => {
                const dateA = getStoryDate(a);
                const dateB = getStoryDate(b);
                return dateB.localeCompare(dateA);
            });
        case 'date_asc':
            return sorted.sort((a, b) => {
                const dateA = getStoryDate(a);
                const dateB = getStoryDate(b);
                return dateA.localeCompare(dateB);
            });
        case 'title_asc':
            return sorted.sort((a, b) => (a.titolo || '').localeCompare(b.titolo || ''));
        case 'title_desc':
            return sorted.sort((a, b) => (b.titolo || '').localeCompare(a.titolo || ''));
        case 'author_asc': {
            const getAuthor = (story) => story.autore || story.pubblicato_da?.nome || '';
            return sorted.sort((a, b) => getAuthor(a).localeCompare(getAuthor(b)));
        }
        case 'author_desc': {
            const getAuthor = (story) => story.autore || story.pubblicato_da?.nome || '';
            return sorted.sort((a, b) => getAuthor(b).localeCompare(getAuthor(a)));
        }
        default:
            return sorted;
    }
}

// ========== FUNZIONI FILTRO ==========
function filterStories() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const selectedAuthor = authorFilter ? authorFilter.value : '';
    
    return allStories.filter(story => {
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

function addFavoritesFilter() {
    const filterContainer = document.querySelector('.filters-container');
    if (filterContainer && !document.getElementById('favoritesFilterBtn')) {
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

// ========== CREAZIONE CARD ==========
function createStoryCard(story) {
    const card = document.createElement('div');
    card.className = 'story-card';
    
    const storyId = story.id || story.titolo;
    const isFav = isFavorite(storyId);
    const hasUpdate = checkForUpdates(story);
    const hasLinks = hasAnyLink(story);
    
    const coverUrl = story.copertina && story.copertina !== '' ? story.copertina : '';
    
    const coverHtml = coverUrl 
        ? `<img src="${coverUrl}" alt="${escapeHtml(story.titolo)}" onerror="handleImageError(this)">`
        : `<div class="cover-placeholder"><i class="fas fa-book"></i></div>`;
    
    const authorName = story.autore || (story.pubblicato_da?.nome) || 'Autore sconosciuto';
    
    const description = story.descrizione || 'Nessuna descrizione disponibile.';
    const isLongDescription = description.length > 150;
    const shortDescription = isLongDescription ? description.substring(0, 150) + '...' : description;
    
const linksHtml = story.links ? `
    <div class="card-links">
        ${story.links.ig ? `<a href="${story.links.ig}" target="_blank" rel="noopener noreferrer" class="social-link" title="Vai a Instagram"><i class="fab fa-instagram"></i></a>` : ''}
        ${story.links.tg ? `<a href="${story.links.tg}" target="_blank" rel="noopener noreferrer" class="social-link" title="Vai a Telegram"><i class="fab fa-telegram"></i></a>` : ''}
        ${story.links.patreon ? `<a href="${story.links.patreon}" target="_blank" rel="noopener noreferrer" class="social-link" title="Vai a Patreon"><i class="fab fa-patreon"></i></a>` : ''}
        ${(story.links.youtube || story.links.yt) ? `<a href="${story.links.youtube || story.links.yt}" target="_blank" rel="noopener noreferrer" class="social-link" title="Vai a YouTube"><i class="fab fa-youtube"></i></a>` : ''}
        ${story.links.twitter ? `<a href="${story.links.twitter}" target="_blank" rel="noopener noreferrer" class="social-link" title="Vai a Twitter"><i class="fab fa-twitter"></i></a>` : ''}
        ${story.links.facebook ? `<a href="${story.links.facebook}" target="_blank" rel="noopener noreferrer" class="social-link" title="Vai a Facebook"><i class="fab fa-facebook"></i></a>` : ''}
        ${story.links.tiktok ? `<a href="${story.links.tiktok}" target="_blank" rel="noopener noreferrer" class="social-link" title="Vai a TikTok"><i class="fab fa-tiktok"></i></a>` : ''}
        ${story.links.discord ? `<a href="${story.links.discord}" target="_blank" rel="noopener noreferrer" class="social-link" title="Vai a Discord"><i class="fab fa-discord"></i></a>` : ''}
        ${story.links.twitch ? `<a href="${story.links.twitch}" target="_blank" rel="noopener noreferrer" class="social-link" title="Vai a Twitch"><i class="fab fa-twitch"></i></a>` : ''}
        ${story.links.altro ? `<a href="${story.links.altro}" target="_blank" rel="noopener noreferrer" class="social-link" title="Vai al link"><i class="fas fa-link"></i></a>` : ''}
    </div>
` : '<div class="card-links empty-links"></div>';
    
    const clickHintHtml = hasLinks ? `
        <div class="click-hint">
            <i class="fas fa-hand-pointer"></i> <span>Clicca sull'icona dei social per la storia completa</span>
        </div>
    ` : '';
    
    card.innerHTML = `
        <div class="card-cover">
            ${coverHtml}
            <div class="author-badge">
                <i class="fas fa-user"></i> ${escapeHtml(authorName)}
            </div>
            ${hasUpdate ? '<div class="update-badge"><i class="fas fa-sync-alt"></i> Aggiornata!</div>' : ''}
            <button class="favorite-btn ${isFav ? 'active' : ''}" data-story-id="${escapeHtml(storyId)}">
                <i class="fas fa-heart"></i>
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
            ${linksHtml}
            ${clickHintHtml}
        </div>
    `;
    
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

// ========== MODAL ==========
function openModal(story) {
    const authorName = story.autore || (story.pubblicato_da?.nome) || 'Autore sconosciuto';
    const coverUrl = story.copertina && story.copertina !== '' ? story.copertina : '';
    const storyId = story.id || story.titolo;
    const isFav = isFavorite(storyId);
    const hasUpdate = checkForUpdates(story);
    const hasLinks = hasAnyLink(story);
    
    markStoryAsViewed(story);
    
    if (modalContent) {
        modalContent.innerHTML = `
            ${coverUrl ? `<img class="modal-cover" src="${coverUrl}" alt="${escapeHtml(story.titolo)}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'600\' height=\'250\' viewBox=\'0 0 600 250\'%3E%3Crect width=\'600\' height=\'250\' fill=\'%23343a40\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%23ffffff\' font-size=\'16\'%3E📖 Copertina non disponibile%3C/text%3E%3C/svg%3E'">` : `<div class="modal-cover" style="background: linear-gradient(135deg, #16ab63, #b510bd); display: flex; align-items: center; justify-content: center;"><i class="fas fa-book-open" style="font-size: 64px; color: white;"></i></div>`}
            <div class="modal-body">
                <div class="modal-header-actions">
                    <h2 class="modal-title">${escapeHtml(story.titolo)}</h2>
                    <button class="modal-favorite-btn ${isFav ? 'active' : ''}" data-story-id="${escapeHtml(storyId)}">
                        <i class="fas fa-heart"></i>
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
                ${hasLinks ? `
                <div class="modal-links">
                    <p class="social-hint">
                        <i class="fas fa-arrow-down"></i> Clicca sui pulsanti qui sotto per poter leggere la storia completa:
                    </p>
<div class="modal-social-buttons">
    ${story.links?.ig ? `<a href="${story.links.ig}" target="_blank" rel="noopener noreferrer" class="modal-social-btn instagram"><i class="fab fa-instagram"></i> Instagram</a>` : ''}
    ${story.links?.tg ? `<a href="${story.links.tg}" target="_blank" rel="noopener noreferrer" class="modal-social-btn telegram"><i class="fab fa-telegram"></i> Telegram</a>` : ''}
    ${story.links?.patreon ? `<a href="${story.links.patreon}" target="_blank" rel="noopener noreferrer" class="modal-social-btn patreon"><i class="fab fa-patreon"></i> Patreon</a>` : ''}
    ${(story.links?.youtube || story.links?.yt) ? `<a href="${story.links.youtube || story.links.yt}" target="_blank" rel="noopener noreferrer" class="modal-social-btn youtube"><i class="fab fa-youtube"></i> YouTube</a>` : ''}
    ${story.links?.twitter ? `<a href="${story.links.twitter}" target="_blank" rel="noopener noreferrer" class="modal-social-btn twitter"><i class="fab fa-twitter"></i> Twitter</a>` : ''}
    ${story.links?.facebook ? `<a href="${story.links.facebook}" target="_blank" rel="noopener noreferrer" class="modal-social-btn facebook"><i class="fab fa-facebook"></i> Facebook</a>` : ''}
    ${story.links?.tiktok ? `<a href="${story.links.tiktok}" target="_blank" rel="noopener noreferrer" class="modal-social-btn tiktok"><i class="fab fa-tiktok"></i> TikTok</a>` : ''}
    ${story.links?.discord ? `<a href="${story.links.discord}" target="_blank" rel="noopener noreferrer" class="modal-social-btn discord"><i class="fab fa-discord"></i> Discord</a>` : ''}
    ${story.links?.twitch ? `<a href="${story.links.twitch}" target="_blank" rel="noopener noreferrer" class="modal-social-btn twitch"><i class="fab fa-twitch"></i> Twitch</a>` : ''}
    ${story.links?.altro ? `<a href="${story.links.altro}" target="_blank" rel="noopener noreferrer" class="modal-social-btn altro"><i class="fas fa-link"></i> Altro link</a>` : ''}
</div>
                </div>
                ` : ''}
            </div>
        `;
        
        const modalFavBtn = modalContent.querySelector('.modal-favorite-btn');
        if (modalFavBtn) {
            modalFavBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFavorite(storyId);
                const isNowFav = isFavorite(storyId);
                modalFavBtn.classList.toggle('active', isNowFav);
                modalFavBtn.querySelector('span').textContent = isNowFav ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti';
                updateGrid();
            });
        }
    }
    
    if (modal) modal.classList.add('show');
}

// ========== AGGIORNAMENTO GRIGLIA ==========
function updateGrid() {
    if (allStories.length === 0) return;
    
    const filtered = filterStories();
    const sorted = sortStories(filtered);
    const favoritesCount = favorites.length;
    
    if (statsText) {
        let statsMessage = `📚 ${sorted.length} ${sorted.length === 1 ? 'storia trovata' : 'storie trovate'} su ${allStories.length} totali`;
        if (favoritesCount > 0) {
            statsMessage += ` | ⭐ ${favoritesCount} nei preferiti`;
        }
        statsText.innerHTML = statsMessage;
    }
    
    if (storiesGrid) {
        storiesGrid.innerHTML = '';
        
        if (sorted.length === 0) {
            storiesGrid.innerHTML = `<div class="no-results">
                <i class="fas ${showOnlyFavorites ? 'fa-heart-broken' : 'fa-search'} fa-3x"></i>
                <h3>${showOnlyFavorites ? 'Nessuna storia nei preferiti' : 'Nessuna storia trovata'}</h3>
                <p>${showOnlyFavorites ? 'Aggiungi alcune storie ai preferiti cliccando sul cuore' : 'Prova a modificare i filtri di ricerca'}</p>
            </div>`;
            return;
        }
        
        sorted.forEach((story, index) => {
            const card = createStoryCard(story);
            card.style.animationDelay = `${index * 0.05}s`;
            storiesGrid.appendChild(card);
        });
    }
}

// ========== INIZIALIZZAZIONE ==========
async function init() {
    createStars();
    window.handleImageError = handleImageError;
    loadFavorites();
    
    // IMPORTANTE: Imposta il valore iniziale dal select
    if (sortFilter) {
        currentSort = sortFilter.value;
    }
    
    try {
        allStories = await loadAllStories();
        
        if (allStories.length > 0) {
            updateAuthorsList(allStories);
            addFavoritesFilter();
            updateGrid(); // Questo chiamerà sortStories con currentSort
            if (statsText) statsText.innerHTML = `📚 ${allStories.length} ${allStories.length === 1 ? 'storia caricata' : 'storie caricate'}`;
        }
    } catch (error) {
        console.error('Errore:', error);
    }
    
    if (searchInput) searchInput.addEventListener('input', updateGrid);
    if (authorFilter) authorFilter.addEventListener('change', updateGrid);
    if (sortFilter) {
        sortFilter.addEventListener('change', (e) => {
            currentSort = e.target.value;
            updateGrid();
        });
    }
}

// ========== EVENT LISTENERS MODAL ==========
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
