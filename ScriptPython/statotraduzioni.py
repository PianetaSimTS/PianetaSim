import requests
import json
import base64
import asyncio
import os
from telegram.ext import Application

# Token Telegram
telegram_token = os.getenv("TELEGRAM_TOKEN")
group_id = '-1001771715212'
topic_id = '79558'

# Token GitHub
github_token = os.getenv('GITHUB_TOKEN')

# Info repository
repo_owner = "PianetaSimTS"
repo_name = "PianetaSim"

# Percorsi JSON
mods_path = "Json/traduzioni.json"
state_path = "Json/telegramstato/last_statetraduzioni.json"

def fetch_json_from_github(path):
    """Recupera un file JSON da GitHub usando l’API."""
    url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/contents/{path}"
    headers = {
        "Authorization": f"token {github_token}",
        "Accept": "application/vnd.github.v3+json",
    }

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        content = response.json()
        if 'content' in content:
            decoded = base64.b64decode(content['content']).decode('utf-8')
            return json.loads(decoded)
    except Exception as e:
        print(f"Errore nel recupero di {path} da GitHub: {e}")
    return None


def load_last_state():
    """Carica lo stato precedente."""
    print("Caricando lo stato precedente...")
    return fetch_json_from_github(state_path) or []


def save_current_state(new_state):
    """Salva lo stato aggiornato su GitHub."""
    url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/contents/{state_path}"
    headers = {
        "Authorization": f"token {github_token}",
        "Accept": "application/vnd.github.v3+json",
    }

    try:
        current_file = requests.get(url, headers=headers).json()
        sha = current_file['sha']

        content = base64.b64encode(json.dumps(new_state, indent=2, ensure_ascii=False).encode('utf-8')).decode('utf-8')
        data = {
            "message": "Aggiornamento stato traduzioni con versione inclusa",
            "content": content,
            "sha": sha,
        }

        response = requests.put(url, headers=headers, json=data)
        response.raise_for_status()
        print("Stato aggiornato con successo su GitHub.")
    except Exception as e:
        print(f"Errore nell'aggiornamento del file su GitHub: {e}")


def normalize_mod(mod):
    """Normalizza i dati delle traduzioni."""
    return {
        'Creator': mod.get('Creator', '').strip(),
        'Title': mod.get('Title', '').strip(),
        'ReleaseVersion': mod.get('ReleaseVersion', '').strip(),
        'CurrentVersion': mod.get('CurrentVersion', '').strip(),
        'Status': mod.get('Status', '').strip().upper(),
        'Translator': mod.get('Translator', '').strip(),
        'Link': mod.get('Link', '').strip() or '',
    }


def compare_status_only(old_state, new_state):
    """Confronta i due stati e genera i messaggi Telegram."""
    messages = []
    status_icons = {
        "AGGIORNATA": "🟢",
        "COMPATIBILE": "🔵",
        "ROTTA": "🔴",
        "NUOVA": "🟣",
        "DA AGGIORNARE": "⚪️",
        "SCONOSCIUTA & OBSOLETA": "⚪️"
    }

    old_mods = {(mod['Title'], mod['Translator']): mod for mod in old_state}

    for new_mod in new_state:
        new_key = (new_mod['Title'], new_mod['Translator'])
        new_status = (new_mod.get('Status') or '').strip().upper()
        new_release_version = (new_mod.get('ReleaseVersion') or '').strip()
        new_current_version = (new_mod.get('CurrentVersion') or '').strip()

        # 🔹 Caso: nuova traduzione
        if new_key not in old_mods:
            if not new_status:
                new_status = "NUOVA"
            elif new_status == "DA-AGGIORNARE":
                new_status = "DA AGGIORNARE"

            icon = status_icons.get(new_status, "⚪️")
            msg = (
                f"TRADUZIONE AGGIUNTA AL SITO\n\n"
                f"*{new_mod['Title']}* ➜ Di *{new_mod['Creator']}*\n\n"
                f"Stato {icon} *{new_status}*\n"
                f"Versione Mod: {new_release_version}\n"
                f"Link [SITO](https://pianetasimts.github.io/PianetaSim/traduzioni.html)"
            )
            messages.append(msg)

        # 🔹 Caso: traduzione già presente → verifica cambiamenti
        else:
            old_mod = old_mods[new_key]
            old_status = (old_mod.get('Status') or '').strip().upper()
            old_release_version = (old_mod.get('ReleaseVersion') or '').strip()
            old_current_version = (old_mod.get('CurrentVersion') or '').strip()

            # Confronta modifiche di stato o versione
            if (
                new_status != old_status
                or new_release_version != old_release_version
                or new_current_version != old_current_version
            ):
                if new_status == "DA-AGGIORNARE":
                    new_status = "DA AGGIORNARE"
                icon = status_icons.get(new_status, "⚪️")
                msg = (
                    f"TRADUZIONE MOD di _{new_mod['Translator']}_\n\n"
                    f"*{new_mod['Title']}* ➜ Di *{new_mod['Creator']}*\n\n"
                    f"Stato {icon} *{new_status}*\n"
                    f"Versione Mod: {new_release_version}\n"
                    f"Link [SITO](https://pianetasimts.github.io/PianetaSim/traduzioni.html)"
                )
                messages.append(msg)

    return messages


def send_telegram_message(message, chat_id, topic_id):
    """Invia un messaggio su Telegram."""
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
    except Exception as e:
        print(f"Errore nell'invio del messaggio a Telegram: {e}")


async def monitor_mods():
    """Monitora le modifiche alle traduzioni."""
    print("Monitorando le modifiche...")
    last_state = load_last_state()
    new_state = fetch_json_from_github(mods_path)

    if new_state:
        messages = compare_status_only(last_state, new_state)

        if messages:
            print("Modifiche rilevate! Inviando notifiche...")
            for message in messages:
                send_telegram_message(message, group_id, topic_id)
            save_current_state(new_state)
        else:
            print("Nessuna modifica trovata.")
    else:
        print("Errore nel recupero del file delle traduzioni.")


if __name__ == "__main__":
    try:
        asyncio.run(monitor_mods())
    except Exception as e:
        print(f"Errore nell'esecuzione del programma: {e}")
