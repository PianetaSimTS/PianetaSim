import requests
import json
import base64
import asyncio
import os

# Recupera i valori dai segreti
telegram_token = '7390613815:AAFZzCFSMnfomMqRXHkKzEqsrPo7Rh_0Yf4'
group_id = '-1001771715212'
topic_id = '79558'
github_token = os.getenv('GITHUB_TOKEN')

# URL dei file su GitHub
mods_url = 'https://raw.githubusercontent.com/PianetaSimSito/PianetaSim/refs/heads/main/Json/mods.json'
state_url = 'https://raw.githubusercontent.com/PianetaSimSito/PianetaSim/refs/heads/main/Json/telegramstato/last_statemod.json'
repo_api_url = 'https://api.github.com/repos/PianetaSimSito/PianetaSim/contents/Json/telegramstato/last_statemod.json'

# Funzione per scaricare un file JSON da un URL
def fetch_json(url):
    try:
        response = requests.get(url)
        response.raise_for_status()  # Rilancia l'eccezione per status code >= 400
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Errore nel recuperare il file {url}: {e}")
        return None

# Funzione per caricare lo stato precedente
def load_last_state():
    print("Caricando lo stato precedente...")
    return fetch_json(state_url) or []

# Funzione per salvare il nuovo stato su GitHub
def save_current_state(new_state):
    try:
        headers = {
            "Authorization": f"token {github_token}",
            "Accept": "application/vnd.github.v3+json",
        }

        # Recupera il SHA del file esistente
        current_file = requests.get(repo_api_url, headers=headers).json()
        sha = current_file['sha']

        # Codifica il contenuto in base64 mantenendo tutti i caratteri speciali
        content = base64.b64encode(json.dumps(new_state, indent=2, ensure_ascii=False).encode('utf-8')).decode('utf-8')

        # Aggiorna il file su GitHub
        data = {
            "message": "Aggiornamento stato mod con supporto per caratteri speciali",
            "content": content,
            "sha": sha,
        }

        response = requests.put(repo_api_url, headers=headers, json=data)
        response.raise_for_status()  # Rilancia l'eccezione se status code >= 400
        print("Stato aggiornato con successo su GitHub.")
    except requests.exceptions.RequestException as e:
        print(f"Errore nell'aggiornamento del file su GitHub: {e}")

# Funzione per normalizzare i dati di una mod
def normalize_mod(mod):
    """Normalizza i dati di una mod per il confronto."""
    def safe_strip(value):
        return value.strip() if isinstance(value, str) else ''  # Gestisce valori None

    return {
        'Author': safe_strip(mod.get('Author')),
        'ModName': safe_strip(mod.get('ModName')),
        'Status': safe_strip(mod.get('Status')).upper(),
        'SiteLink': safe_strip(mod.get('SiteLink')),
        'DataUltimaModifica': safe_strip(mod.get('DataUltimaModifica')),
        'Translation': safe_strip(mod.get('Translation')),
        'Categoria': safe_strip(mod.get('Categoria')),
        'Dependency': safe_strip(mod.get('Dependency')),
        'Descrizione': safe_strip(mod.get('Descrizione')),
    }
# Funzione per confrontare gli stati e generare il messaggio
def compare_status_only(old_state, new_state):
    messages = []

    # Normalizza lo stato vecchio e nuovo
    normalized_old = [normalize_mod(mod) for mod in old_state if normalize_mod(mod) is not None]
    normalized_new = [normalize_mod(mod) for mod in new_state if normalize_mod(mod) is not None]

    # Mappa per lo stato con le relative icone
    status_icons = {
        "AGGIORNATA": "🟢",  # Pallino verde
        "COMPATIBILE": "🔵",  # Pallino blu
        "ROTTA": "🔴",       # Pallino rosso
        "NUOVA": "🟣",       # Pallino viola
        "SCONOSCIUTA & OBSOLETA": "⚪️"  # Pallino bianco
    }

    # Confronta lo stato delle mod una per una
    for new_mod in normalized_new:
        if not all(key in new_mod and new_mod[key] for key in ['ModName', 'Author', 'Status']):
            continue  # Salta se mancano campi essenziali

        for old_mod in normalized_old:
            if not all(key in old_mod and old_mod[key] for key in ['ModName', 'Author', 'Status']):
                continue  # Salta se mancano campi essenziali

            # Confronta le mod per nome e autore per essere sicuri che stiamo confrontando la stessa mod
            if new_mod['ModName'] == old_mod['ModName'] and new_mod['Author'] == old_mod['Author']:
                # Confronta solo lo status e altri campi significativi
                if new_mod['Status'] != old_mod['Status'] or new_mod['DataUltimaModifica'] != old_mod['DataUltimaModifica']:
                    icon = status_icons.get(new_mod['Status'], "⚪️")  # Default a pallino bianco se lo stato non è trovato
                    status_change_message = (
                        f"MOD\n\n"
                        f"**{new_mod['ModName']}** ➜ Di **{new_mod['Author']}**\n\n"
                        f"Stato ➜ {icon} _{new_mod['Status']}_\n"
                        f"[SITO](https://pianetasimsito.github.io/PianetaSim/index.html)"
                    )
                    messages.append(status_change_message)
                break  # Interrompi il ciclo interno, una volta trovata la mod corrispondente

    return messages

# Funzione per inviare un messaggio su Telegram
def send_telegram_message(message, chat_id, topic_id):
    url = f'https://api.telegram.org/bot{telegram_token}/sendMessage'
    
    payload = {
        'chat_id': chat_id,
        'text': message,
        'message_thread_id': topic_id,
        'parse_mode': 'Markdown',  # Usa MarkdownV2 per supporto caratteri
        'disable_web_page_preview': True
    }
    
    try:
        response = requests.post(url, data=payload)
        response.raise_for_status()  # Se il codice di stato non è 200, solleva un'eccezione
        print(f"Messaggio inviato con successo: {message}")
    except requests.exceptions.RequestException as e:
        print(f"Errore nell'invio del messaggio a Telegram: {e}")

# Funzione per monitorare le modifiche
async def monitor_mods():
    print("Monitorando le modifiche...")
    last_state = load_last_state()
    new_state = fetch_json(mods_url)

    if new_state:
        messages = compare_status_only(last_state, new_state)

        if messages:
            print("Modifiche di status rilevate! Inviando notifiche...")

            # Invio dei messaggi Telegram
            for message in messages:
                send_telegram_message(message, group_id, topic_id)

            # Dopo l'invio dei messaggi, aggiorna lo stato su GitHub
            save_current_state(new_state)
        else:
            print("Nessuna modifica dello status trovata.")
    else:
        print("Errore nel recupero delle informazioni sui mods.")

if __name__ == "__main__":
    try:
        asyncio.run(monitor_mods())
    except Exception as e:
        print(f"Errore nell'esecuzione del programma: {e}")
