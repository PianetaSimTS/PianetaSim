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
mods_url = 'https://raw.githubusercontent.com/PianetaSimTS/PianetaSim/refs/heads/main/Json/programmi.json'
state_url = 'https://raw.githubusercontent.com/PianetaSimTS/PianetaSim/refs/heads/main/Json/telegramstato/last_stateprogrammi.json'
repo_api_url = 'https://api.github.com/repos/PianetaSimTS/PianetaSim/contents/Json/telegramstato/last_stateprogrammi.json'

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

        # Codifica il contenuto in base64 con l'indentazione per una visualizzazione leggibile
        content = base64.b64encode(json.dumps(new_state, indent=2).encode('utf-8')).decode('utf-8')

        # Aggiorna il file su GitHub
        data = {
            "message": "Aggiornamento stato mod",
            "content": content,
            "sha": sha,
        }

        response = requests.put(repo_api_url, headers=headers, json=data)
        response.raise_for_status()  # Rilancia l'eccezione se status code >= 400
        print("Stato aggiornato con successo su GitHub.")
    except requests.exceptions.RequestException as e:
        print(f"Errore nell'aggiornamento del file su GitHub: {e}")

# Funzione per confrontare solo lo stato e generare il messaggio
def compare_status_only(old_state, new_state):
    messages = []
    
    # Dizionario per i pallini di stato
    status_icons = {
        "AGGIORNATO": "🟢",
        "COMPATIBILE": "🔵",
        "ROTTO": "🔴",
        "NUOVO": "🟣",
        "SCONOSCIUTO & OBSOLETO": "⚪️"
    }

    # Creiamo un set con i nomi dei programmi esistenti nello stato precedente
    old_programs = {mod['programma'] for mod in old_state}

    for new_mod in new_state:
        new_program_name = new_mod['programma']
        new_status = new_mod.get('status', '').upper() if new_mod.get('status') else 'SCONOSCIUTO'
        new_date = new_mod.get('data_aggiornamento', 'Data non disponibile')

        if new_program_name not in old_programs:  # Programma NUOVO
            status_icon = status_icons.get("NUOVO", "🟣")
            message = f"PROGRAMMA\n\n*{new_program_name}* ➜ Data *{new_date}*\n\nStato {status_icon} _NUOVO_\nLink [SITO](https://pianetasimts.github.io/PianetaSim/index.html)"
            messages.append(message)
        else:
            # Trova il programma corrispondente nello stato precedente
            for old_mod in old_state:
                if new_program_name == old_mod['programma']:
                    old_status = old_mod.get('status', '').upper() if old_mod.get('status') else 'SCONOSCIUTO'

                    if new_status != old_status:  # Se lo stato è cambiato, invia il messaggio
                        status_icon = status_icons.get(new_status, "⚪️")
                        message = f"PROGRAMMA\n\n*{new_program_name}* ➜ Data *{new_date}*\n\nStato {status_icon} _{new_status}_\nLink [SITO](https://pianetasimts.github.io/PianetaSim/index.html)"
                        messages.append(message)
                    break  # Esci dal loop una volta trovato il programma corrispondente

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
