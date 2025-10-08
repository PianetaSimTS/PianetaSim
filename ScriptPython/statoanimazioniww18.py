import requests
import json
import base64
import asyncio
import os

# Token e ID Telegram
telegram_token = os.getenv("TELEGRAM_TOKEN")
group_id = '-1001516258837'
topic_id = '26621'

# GitHub config
github_token = os.getenv('GITHUB_TOKEN')
repo_owner = 'PianetaSimTS'
repo_name = 'PianetaSim'
headers = {
    "Authorization": f"token {github_token}",
    "Accept": "application/vnd.github.v3+json"
}

# Percorsi dei file nel repo
mods_path = 'Json/animazioniww18.json'
state_path = 'Json/telegramstato/last_stateanimazioni.json'

def fetch_github_json(path):
    url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/contents/{path}"
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        content_json = response.json()
        decoded = base64.b64decode(content_json['content']).decode('utf-8')
        return json.loads(decoded)
    except requests.exceptions.RequestException as e:
        print(f"Errore recuperando {path} da GitHub: {e}")
        return None

def load_last_state():
    print("Caricando lo stato precedente...")
    return fetch_github_json(state_path) or []

def save_current_state(new_state):
    url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/contents/{state_path}"
    try:
        current_file = requests.get(url, headers=headers).json()
        sha = current_file['sha']

        content = base64.b64encode(
            json.dumps(new_state, indent=2, ensure_ascii=False).encode('utf-8')
        ).decode('utf-8')

        data = {
            "message": "Aggiornamento stato animazioni",
            "content": content,
            "sha": sha
        }

        response = requests.put(url, headers=headers, json=data)
        response.raise_for_status()
        print("Stato aggiornato con successo su GitHub.")
    except requests.exceptions.RequestException as e:
        print(f"Errore nell'aggiornamento del file su GitHub: {e}")

def normalize_mod(mod):
    return {
        'Autore': str(mod.get('Autore', '')).strip() if mod.get('Autore') else '',
        'Status': str(mod.get('Status', '')).strip().upper() if mod.get('Status') else '',
        'Link': str(mod.get('Link', '')).strip() if mod.get('Link') else '',
        'DataAggiornamento': str(mod.get('DataAggiornamento', '')).strip() if mod.get('DataAggiornamento') else '',
        'Note': str(mod.get('Note', '')).strip() if mod.get('Note') else '',
    }

def compare_status_only(old_state, new_state):
    messages = []

    normalized_old = [normalize_mod(mod) for mod in old_state]
    normalized_new = [normalize_mod(mod) for mod in new_state]

    status_icons = {
        "AGGIORNATA": "🟢",
        "COMPATIBILE": "🔵",
        "ROTTA": "🔴",
        "NUOVA": "🟣",
        "SCONOSCIUTA & OBSOLETA": "⚪️"
    }

    old_authors = {mod['Autore'] for mod in normalized_old}

    for new_mod in normalized_new:
        # Caso: autore già presente nello stato precedente
        if new_mod['Autore'] in old_authors:
            for old_mod in normalized_old:
                if new_mod['Autore'] == old_mod['Autore']:
                    # Notifica se cambia lo stato o la data di aggiornamento
                    if new_mod['Status'] != old_mod['Status'] or new_mod['DataAggiornamento'] != old_mod['DataAggiornamento']:
                        icon = status_icons.get(new_mod['Status'].upper(), "⚪️")
                        msg = (
                            f"ANIMAZIONE\n\n"
                            f"*{new_mod['Autore'].title()}* ➜ Data *{new_mod['DataAggiornamento']}*\n\n"
                            f"Stato {icon} _{new_mod['Status'].upper()}_\n"
                            f"Link [SITO](https://pianetasimts.github.io/PianetaSim/animazioniww18.html)"
                        )
                        messages.append(msg)
                    break

        # Caso: autore NON presente => nuova animazione
        else:
            # Se manca lo status, consideralo NUOVA
            status = new_mod['Status'].upper() if new_mod.get('Status') else "NUOVA"
            # Imposta lo status interno (opzionale, utile se poi salvi lo stato)
            new_mod['Status'] = status
            icon = status_icons.get(status, "⚪️")
            msg = (
                f"ANIMAZIONE AGGIUNTA AL SITO\n\n"
                f"*{new_mod['Autore'].title()}* ➜ Data *{new_mod['DataAggiornamento']}*\n\n"
                f"Stato {icon} _{status}_\n"
                f"Link [SITO](https://pianetasimts.github.io/PianetaSim/animazioniww18.html)"
            )
            messages.append(msg)

    return messages


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
        print(f"Messaggio inviato con successo: {message}")
    except requests.exceptions.RequestException as e:
        print(f"Errore nell'invio del messaggio a Telegram: {e}")

async def monitor_mods():
    print("Monitorando le modifiche...")
    last_state = load_last_state()
    new_state = fetch_github_json(mods_path)

    if new_state:
        messages = compare_status_only(last_state, new_state)
        if messages:
            print("Modifiche di status rilevate! Inviando notifiche...")
            for message in messages:
                send_telegram_message(message, group_id, topic_id)
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
