import requests
import json
import os
import base64
import asyncio

# Recupera i valori dai segreti
telegram_token = os.getenv("TELEGRAM_TOKEN")
group_id = '-1001771715212'
topic_id = '79558'
github_token = os.getenv('GITHUB_TOKEN')

# URL dei file su GitHub
repo_api_url_mods = 'https://api.github.com/repos/PianetaSimTS/PianetaSim/contents/Json/programmi.json'
repo_api_url_state = 'https://api.github.com/repos/PianetaSimTS/PianetaSim/contents/Json/telegramstato/last_stateprogrammi.json'

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
    print("Caricando lo stato precedente...")
    return fetch_json(state_url) or []

# Funzione per salvare il nuovo stato su GitHub
def save_current_state(new_state):
    try:
        headers = {
            "Authorization": f"token {github_token}",
            "Accept": "application/vnd.github.v3+json",
        }

        current_file = requests.get(repo_api_url, headers=headers).json()
        sha = current_file['sha']

        content = base64.b64encode(json.dumps(new_state, indent=2).encode('utf-8')).decode('utf-8')

        data = {
            "message": "Aggiornamento stato mod",
            "content": content,
            "sha": sha,
        }

        response = requests.put(repo_api_url, headers=headers, json=data)
        response.raise_for_status()
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

    old_programs = {mod['programma']: mod for mod in old_state}

    for new_mod in new_state:
        name = new_mod['programma']
        new_win = new_mod.get('statuswindows', 'SCONOSCIUTO').upper()
        new_mac = new_mod.get('statusmacos', 'SCONOSCIUTO').upper()
        new_date_win = new_mod.get('data_aggiornamentowindows', 'Data non disponibile')
        new_date_mac = new_mod.get('data_aggiornamentomacos', 'Data non disponibile')
        link = new_mod.get('link_programmawindows') or new_mod.get('link_programma') or '#'

        old_mod = old_programs.get(name)

        if not old_mod:
            # Nuovo programma
            message = f"PROGRAMMA\n\n*{name}*\n\nWindows {status_icons.get(new_win, '⚪️')} _{new_win}_ Data ➜ *{new_date_win}*\nmacOS {status_icons.get(new_mac, '⚪️')} _{new_mac}_ Data ➜ *{new_date_mac}*\n\nLink [SITO]({link})"
            messages.append(message)
        else:
            old_win = old_mod.get('statuswindows', 'SCONOSCIUTO').upper()
            old_mac = old_mod.get('statusmacos', 'SCONOSCIUTO').upper()
            old_date_win = old_mod.get('data_aggiornamentowindows', '')
            old_date_mac = old_mod.get('data_aggiornamentomacos', '')

            # Verifica cambiamenti
            status_changed = new_win != old_win or new_mac != old_mac
            date_changed = new_date_win != old_date_win or new_date_mac != old_date_mac

            if status_changed or date_changed:
                message = f"PROGRAMMA\n\n*{name}*\n\nWindows {status_icons.get(new_win, '⚪️')} _{new_win}_ Data ➜ *{new_date_win}*\nmacOS {status_icons.get(new_mac, '⚪️')} _{new_mac}_ Data ➜ *{new_date_mac}*\n\nLink [SITO]({link})"
                messages.append(message)

    return messages

# Invia un messaggio Telegram
def send_telegram_message(message, chat_id, topic_id):
    url = f'https://api.telegram.org/bot{telegram_token}/sendMessage'
    payload = {
        'chat_id': chat_id,
        'text': message,
        'message_thread_id': topic_id,
        'parse_mode': 'Markdown',
        'disable_web_page_preview': True
    }
    try:
        response = requests.post(url, data=payload)
        response.raise_for_status()
        print("✅ Messaggio inviato:", message[:50])
    except requests.exceptions.RequestException as e:
        print(f"Errore nell'invio del messaggio a Telegram: {e}")

# Funzione principale
async def monitor_mods():
    print("Monitorando le modifiche...")
    last_state = load_last_state()
    new_state = fetch_json(mods_url)

    if new_state:
        messages = compare_status_only(last_state, new_state)

        if messages:
            print(f"🔔 {len(messages)} modifiche rilevate.")
            for msg in messages:
                send_telegram_message(msg, group_id, topic_id)
            save_current_state(new_state)
        else:
            print("Nessuna modifica rilevata.")
    else:
        print("Errore nel recupero dei dati dei programmi.")

if __name__ == "__main__":
    try:
        asyncio.run(monitor_mods())
    except Exception as e:
        print(f"Errore nell'esecuzione del programma: {e}")

