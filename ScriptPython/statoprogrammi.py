import requests
import json
import os
from telegram.ext import Application
import asyncio

# Recupera i valori dai segreti
telegram_token = '7390613815:AAEyjjGxBGdIaWGrCXR-8MSsjdtZ_tqxW1Y'
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
        response.raise_for_status()
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

def compare_status_only(old_state, new_state):
    messages = []
    
    status_icons = {
        "AGGIORNATO": "🟢",
        "COMPATIBILE": "🔵",
        "ROTTO": "🔴",
        "NUOVO": "🟣",
        "SCONOSCIUTO & OBSOLETO": "⚪️",
        "NON DISPONIBILE": "⚫️"
    }
    
    old_programs = {mod['programma'] for mod in old_state}
    
    for new_mod in new_state:
        new_program_name = new_mod['programma']
        new_status_windows = new_mod.get('statuswindows', 'SCONOSCIUTO').upper()
        new_status_macos = new_mod.get('statusmacos', 'SCONOSCIUTO').upper()
        new_date_windows = new_mod.get('data_aggiornamentowindows', 'Data non disponibile')
        new_date_macos = new_mod.get('data_aggiornamentomacos', 'Data non disponibile')

        if new_program_name not in old_programs:
            message = f"PROGRAMMA\n\n*{new_program_name}*\n\nWindows {status_icons.get(new_status_windows, '⚪️')} _{new_status_windows}_ Data ➜ *{new_date_windows}*\nmacOS {status_icons.get(new_status_macos, '⚪️')} _{new_status_macos}_ Data ➜ *{new_date_macos}*\n\nLink [SITO](https://pianetasimts.github.io/PianetaSim/index.html{new_mod.get('link_programma', '#')})"
            messages.append(message)
        else:
            for old_mod in old_state:
                if new_program_name == old_mod['programma']:
                    old_status_windows = old_mod.get('statuswindows', 'SCONOSCIUTO').upper()
                    old_status_macos = old_mod.get('statusmacos', 'SCONOSCIUTO').upper()
                    old_date_windows = old_mod.get('data_aggiornamentowindows', '')
                    old_date_macos = old_mod.get('data_aggiornamentomacos', '')

                    if new_status_windows != old_status_windows or new_status_macos != old_status_macos:
                        message = f"PROGRAMMA\n\n*{new_program_name}*\n\nWindows {status_icons.get(new_status_windows, '⚪️')} _{new_status_windows}_ Data ➜ *{new_date_windows}*\nmacOS {status_icons.get(new_status_macos, '⚪️')} _{new_status_macos}_ Data ➜ *{new_date_macos}*\n\nLink [SITO](https://pianetasimts.github.io/PianetaSim/index.html{new_mod.get('link_programma', '#')})"
                        messages.append(message)
                    elif new_date_windows != old_date_windows or new_date_macos != old_date_macos:
                        message = f"PROGRAMMA\n\n*{new_program_name}*\n\nWindows {status_icons.get('AGGIORNATO', '🟢')} _{new_status_windows}_ Data ➜ *{new_date_windows}*\nmacOS {status_icons.get('AGGIORNATO', '🟢')} _{new_status_macos}_ Data ➜ *{new_date_macos}*\n\nLink [SITO](https://pianetasimts.github.io/PianetaSim/index.html{new_mod.get('link_programma', '#')})"
                        messages.append(message)
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
