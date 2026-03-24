// storie.js - Logica principale per la pagina delle storie

// Configurazione
const STORIES_BASE_PATH = 'Storie/card';
let allStories = [];
let authorsList = [];

// Elementi DOM
const storiesGrid = document.getElementById('storiesGrid');
const searchInput = document.getElementById('searchInput');
const authorFilter = document.getElementById('authorFilter');
const statsText = document.getElementById('statsText');
const modal = document.getElementById('storyModal');
const modalContent = document.getElementById('modalContent');
const modalClose = document.querySelector('.modal-close');

// Funzione per creare stelle animate
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

// Funzione per ottenere tutti i file JSON dalla cartella usando GitHub API
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

// Metodo alternativo: usa un file list.json
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

// Funzione per caricare tutti i file JSON
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
                `;
            }
            if (statsText) statsText.innerHTML = '📂 Non ci sono storie attualemente';
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
                        stories.push(...data);
                    } else if (data && typeof data === 'object') {
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

// Aggiorna la lista degli autori unici
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

// Filtra le storie
function filterStories() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const selectedAuthor = authorFilter ? authorFilter.value : '';
    
    return allStories.filter(story => {
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

// Formatta la data
function formatDate(dateString) {
    if (!dateString) return 'Data non disponibile';
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

// Gestione errori immagini
function handleImageError(img) {
    img.onerror = null;
    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"%3E%3Crect width="400" height="200" fill="%23343a40"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23ffffff" font-size="14"%3E📖 Copertina non disponibile%3C/text%3E%3C/svg%3E';
}

// Crea la card HTML per una storia
function createStoryCard(story) {
    const card = document.createElement('div');
    card.className = 'story-card';
    
    const coverUrl = story.copertina && story.copertina !== '' ? story.copertina : '';
    
    const coverHtml = coverUrl 
        ? `<img src="${coverUrl}" alt="${escapeHtml(story.titolo)}" onerror="handleImageError(this)">`
        : `<div class="cover-placeholder"><i class="fas fa-book"></i></div>`;
    
    const authorName = story.autore || (story.pubblicato_da?.nome) || 'Autore sconosciuto';
    
    card.innerHTML = `
        <div class="card-cover">
            ${coverHtml}
            <div class="author-badge">
                <i class="fas fa-user"></i> ${escapeHtml(authorName)}
            </div>
        </div>
        <div class="card-content">
            <h3 class="card-title">${escapeHtml(story.titolo)}</h3>
            <div class="card-meta">
                <span><i class="fas fa-calendar-alt"></i> ${escapeHtml(story.data || formatDate(story.data_pubblicazione))}</span>
                <span><i class="fas fa-user-pen"></i> ${escapeHtml(authorName)}</span>
            </div>
            <p class="card-description">${escapeHtml(story.descrizione?.substring(0, 120) || 'Nessuna descrizione disponibile')}${story.descrizione?.length > 120 ? '...' : ''}</p>
<div class="card-links">
    ${story.links?.ig ? `<a href="${story.links.ig}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()"><i class="fab fa-instagram"></i></a>` : ''}
    ${story.links?.tg ? `<a href="${story.links.tg}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()"><i class="fab fa-telegram"></i></a>` : ''}
    ${story.links?.patreon ? `<a href="${story.links.patreon}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()"><i class="fab fa-patreon"></i></a>` : ''}
    ${story.links?.youtube ? `<a href="${story.links.youtube}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()"><i class="fab fa-youtube"></i></a>` : ''}
    ${story.links?.twitter ? `<a href="${story.links.twitter}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()"><i class="fab fa-twitter"></i></a>` : ''}
    ${story.links?.facebook ? `<a href="${story.links.facebook}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()"><i class="fab fa-facebook"></i></a>` : ''}
    ${story.links?.tiktok ? `<a href="${story.links.tiktok}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()"><i class="fab fa-tiktok"></i></a>` : ''}
    ${story.links?.discord ? `<a href="${story.links.discord}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()"><i class="fab fa-discord"></i></a>` : ''}
    ${story.links?.twitch ? `<a href="${story.links.twitch}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()"><i class="fab fa-twitch"></i></a>` : ''}
    ${story.links?.altro ? `<a href="${story.links.altro}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()"><i class="fas fa-link"></i></a>` : ''}
</div>
        </div>
    `;
    
    card.addEventListener('click', (e) => {
        if (!e.target.closest('.card-links') && e.target.tagName !== 'A') {
            openModal(story);
        }
    });
    
    return card;
}

// Apre il modal con i dettagli della storia
function openModal(story) {
    const authorName = story.autore || (story.pubblicato_da?.nome) || 'Autore sconosciuto';
    const coverUrl = story.copertina && story.copertina !== '' ? story.copertina : '';
    
    if (modalContent) {
        modalContent.innerHTML = `
            ${coverUrl ? `<img class="modal-cover" src="${coverUrl}" alt="${escapeHtml(story.titolo)}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'600\' height=\'250\' viewBox=\'0 0 600 250\'%3E%3Crect width=\'600\' height=\'250\' fill=\'%23343a40\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%23ffffff\' font-size=\'16\'%3E📖 Copertina non disponibile%3C/text%3E%3C/svg%3E'">` : `<div class="modal-cover" style="background: linear-gradient(135deg, #16ab63, #b510bd); display: flex; align-items: center; justify-content: center;"><i class="fas fa-book-open" style="font-size: 64px; color: white;"></i></div>`}
            <div class="modal-body">
                <h2 class="modal-title">${escapeHtml(story.titolo)}</h2>
                <div class="modal-meta">
                    <span><i class="fas fa-user"></i> <strong>Autore:</strong> ${escapeHtml(authorName)}</span>
                    <span><i class="fas fa-calendar"></i> <strong>Data:</strong> ${escapeHtml(story.data || formatDate(story.data_pubblicazione))}</span>
                    ${story.pubblicato_da?.username ? `<span><i class="fas fa-id-badge"></i> <strong>Pubblicato da:</strong> @${escapeHtml(story.pubblicato_da.username)}</span>` : ''}
                </div>
                <div class="modal-description">
                    <p>${escapeHtml(story.descrizione || 'Nessuna descrizione disponibile.')}</p>
                </div>
                <div class="modal-links">
                    ${story.links?.ig ? `<a href="${story.links.ig}" target="_blank" rel="noopener noreferrer"><i class="fab fa-instagram"></i> Instagram</a>` : ''}
                    ${story.links?.tg ? `<a href="${story.links.tg}" target="_blank" rel="noopener noreferrer"><i class="fab fa-telegram"></i> Telegram</a>` : ''}
                </div>
            </div>
        `;
    }
    
    if (modal) modal.classList.add('show');
}

// Escape HTML per prevenire XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Aggiorna la griglia con le storie filtrate
function updateGrid() {
    if (allStories.length === 0) return;
    
    const filtered = filterStories();
    
    if (statsText) statsText.innerHTML = `📚 ${filtered.length} ${filtered.length === 1 ? 'storia trovata' : 'storie trovate'} su ${allStories.length} totali`;
    
    if (storiesGrid) {
        storiesGrid.innerHTML = '';
        
        if (filtered.length === 0) {
            storiesGrid.innerHTML = '<div class="no-results"><i class="fas fa-search fa-3x"></i><h3>Nessuna storia trovata</h3><p>Prova a modificare i filtri di ricerca</p></div>';
            return;
        }
        
        filtered.forEach((story, index) => {
            const card = createStoryCard(story);
            card.style.animationDelay = `${index * 0.05}s`;
            storiesGrid.appendChild(card);
        });
    }
}

// Inizializza la pagina
async function init() {
    createStars();
    window.handleImageError = handleImageError;
    
    try {
        allStories = await loadAllStories();
        
        if (allStories.length > 0) {
            updateAuthorsList(allStories);
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
