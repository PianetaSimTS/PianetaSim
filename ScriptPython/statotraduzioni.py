import requests
import json
import base64
import asyncio
import os
from telegram.ext import Application

# Recupera i valori dai segreti
telegram_token = '7390613815:AAFZzCFSMnfomMqRXHkKzEqsrPo7Rh_0Yf4'
group_id = '-1001771715212'
topic_id = '79558'
github_token = os.getenv('GITHUB_TOKEN')

# URL dei file su GitHub
mods_url = 'https://raw.githubusercontent.com/PianetaSimSito/PianetaSim/refs/heads/main/Json/traduzioni.json'
state_url = 'https://raw.githubusercontent.com/PianetaSimSito/PianetaSim/refs/heads/main/Json/telegramstato/last_statetraduzioni.json'

repo_api_url = 'https://api.github.com/repos/PianetaSimSito/PianetaSim/contents/Json/telegramstato/last_statetraduzioni.json'

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
    print("Caricando lo stato precedente...")  # Debug print
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
    return {
        'Creator': mod.get('Creator', '').strip(),
        'Title': mod.get('Title', '').strip(),
        'ReleaseVersion': mod.get('ReleaseVersion', '').strip(),
        'CurrentVersion': mod.get('CurrentVersion', '').strip(),
        'Status': mod.get('Status', '').strip().upper(),
        'Translator': mod.get('Translator', '').strip(),
        'Link': mod.get('Link', '').strip() or '',
    }

# Funzione per confrontare gli stati e generare il messaggio
def compare_status_only(old_state, new_state):
    messages = []

    # Dizionario per associare lo status agli emoji
    status_icons = {
        "AGGIORNATA": "🟢",  # Pallino verde
        "COMPATIBILE": "🔵",  # Pallino blu
        "ROTTA": "🔴",        # Pallino rosso
        "NUOVA": "🟣",        # Pallino viola
        "SCONOSCIUTA & OBSOLETA": "⚪️"  # Pallino bianco
    }

    # Verifica se lo status di una mod è cambiato
    for new_mod in new_state:
        for old_mod in old_state:
            if new_mod['Title'] == old_mod['Title'] and new_mod['Translator'] == old_mod['Translator']:  # Verifica il titolo e il traduttore
                # Gestione del caso in cui il valore di Status sia None
                new_status = (new_mod.get('Status') or '').strip().upper()  # Default a stringa vuota se None
                old_status = (old_mod.get('Status') or '').strip().upper()  # Default a stringa vuota se None

                if new_status != old_status:  # Controlla se lo status è cambiato
                    status_icon = status_icons.get(new_status, "⚪️")  # Ottieni l'icona corrispondente allo status, se non esiste, usa il pallino bianco
                    status_change_message = f"**TRADUZIONE MOD**\n\n{new_mod['Title']} ➜ {new_mod['Creator']}\n\nStato ➜ *{new_status}* {status_icon}\nTranslator ➜ {new_mod['Translator']}\n[SITO](https://pianetasimsito.github.io/PianetaSim/index.html)"
                    messages.append(status_change_message)
                break

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
    print("Monitorando le modifiche...")  # Debug print
    last_state = load_last_state()
    new_state = fetch_json(mods_url)

    if new_state:
        messages = compare_status_only(last_state, new_state)

        if messages:
            print("Modifiche di status rilevate! Inviando notifiche...")

            # Invio dei messaggi Telegram
            for message in messages:
                send_telegram_message(message, group_id, topic_id)  # Invio del messaggio

            # Dopo l'invio dei messaggi, aggiorna lo stato su GitHub
            save_current_state(new_state)  # Salva lo stato aggiornato su GitHub
        else:
            print("Nessuna modifica dello status trovata.")
    else:
        print("Errore nel recupero delle informazioni sui mods.")

if __name__ == "__main__":
    try:
        asyncio.run(monitor_mods())  # Ensure that asyncio.run() is called properly
    except Exception as e:
        print(f"Errore nell'esecuzione del programma: {e}")
