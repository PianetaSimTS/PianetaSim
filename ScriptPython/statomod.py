import requests
import json
import base64
import asyncio
import os
import time
from typing import List

# Configurazione
TELEGRAM_TOKEN = '7390613815:AAEyjjGxBGdIaWGrCXR-8MSsjdtZ_tqxW1Y'
GROUP_ID = '-1001771715212'
TOPIC_ID = '79558'
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')

# URL GitHub
MODS_URL = 'https://raw.githubusercontent.com/PianetaSimTS/PianetaSim/main/Json/mods.json'
STATE_URL = 'https://raw.githubusercontent.com/PianetaSimTS/PianetaSim/main/Json/telegramstato/last_statemod.json'
REPO_API_URL = 'https://api.github.com/repos/PianetaSimTS/PianetaSim/contents/Json/telegramstato/last_statemod.json'

# Costanti per il rate limiting
BATCH_SIZE = 8  # Messaggi per batch
DELAY_WITHIN_BATCH = 1.2  # Secondi tra messaggi nello stesso batch
DELAY_BETWEEN_BATCHES = 25  # Secondi tra batch diversi

def fetch_json(url: str) -> dict:
    """Scarica un file JSON da un URL con gestione errori."""
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Errore nel fetch di {url}: {e}")
        return None

def load_last_state() -> List[dict]:
    """Carica lo stato precedente delle mod."""
    print("Caricamento stato precedente...")
    return fetch_json(STATE_URL) or []

def save_current_state(new_state: List[dict]) -> None:
    """Salva lo stato corrente su GitHub."""
    try:
        headers = {
            "Authorization": f"token {GITHUB_TOKEN}",
            "Accept": "application/vnd.github.v3+json"
        }
        
        # Ottieni SHA del file esistente
        current_file = requests.get(REPO_API_URL, headers=headers).json()
        content = base64.b64encode(
            json.dumps(new_state, indent=2, ensure_ascii=False).encode('utf-8')
        ).decode('utf-8')

        response = requests.put(
            REPO_API_URL,
            headers=headers,
            json={
                "message": "Auto-aggiornamento stato mod",
                "content": content,
                "sha": current_file['sha']
            }
        )
        response.raise_for_status()
        print("Stato salvato su GitHub")
    except Exception as e:
        print(f"Errore salvataggio stato: {e}")

def normalize_mod(mod: dict) -> dict:
    """Normalizza i dati di una mod per il confronto."""
    def safe_strip(value):
        return value.strip() if isinstance(value, str) else ''
    
    return {
        'Author': safe_strip(mod.get('Author')),
        'ModName': safe_strip(mod.get('ModName')),
        'Status': safe_strip(mod.get('Status', '')).upper(),
        'DataUltimaModifica': safe_strip(mod.get('DataUltimaModifica')),
        # ... (altri campi come nel tuo originale)
    }

def compare_status_only(old_state: List[dict], new_state: List[dict]) -> List[str]:
    """Genera i messaggi delle modifiche rilevate."""
    messages = []
    status_icons = {
        "AGGIORNATA": "🟢", "COMPATIBILE": "🔵", "ROTTA": "🔴",
        "NUOVA": "🟣", "SCONOSCIUTA & OBSOLETA": "⚪️"
    }

    old_mods = {mod['ModName']: mod for mod in map(normalize_mod, old_state) if mod}
    
    for new_mod in map(normalize_mod, new_state):
        if not new_mod or not all(k in new_mod for k in ['ModName', 'Author']):
            continue

        old_mod = old_mods.get(new_mod['ModName'])
        
        if not old_mod:  # Nuova mod
            status = new_mod.get('Status', 'NUOVA')
            icon = status_icons.get(status, "⚪️")
            messages.append(
                f"MOD AGGIUNTA AL SITO\n\n*{new_mod['ModName']}* ➜ Di *{new_mod['Author']}*\n\n"
                f"Stato {icon} _{status}_\nLink [SITO](https://pianetasimts.github.io/PianetaSim/index.html)"
            )
        elif (new_mod.get('Status') != old_mod.get('Status') and "SCONOSCIUTA" not in new_mod['Status']:
            icon = status_icons.get(new_mod['Status'], "⚪️")
            messages.append(
                f"MOD\n\n*{new_mod['ModName']}* ➜ Di *{new_mod['Author']}*\n\n"
                f"Stato {icon} _{new_mod['Status']}_\nLink [SITO](https://pianetasimts.github.io/PianetaSim/index.html)"
            )
        elif new_mod.get('DataUltimaModifica') != old_mod.get('DataUltimaModifica'):
            messages.append(
                f"MOD\n\n*{new_mod['ModName']}* ➜ Di *{new_mod['Author']}*\n\n"
                f"Stato 🟢 _AGGIORNATA_\nLink [SITO](https://pianetasimts.github.io/PianetaSim/index.html)"
            )

    return messages

def send_telegram_batch(messages: List[str]) -> None:
    """Invia messaggi in batch con rate limiting."""
    total_messages = len(messages)
    print(f"Preparando l'invio di {total_messages} messaggi in batch...")
    
    for i in range(0, total_messages, BATCH_SIZE):
        batch = messages[i:i+BATCH_SIZE]
        print(f"Inviando batch {i//BATCH_SIZE + 1}/{(total_messages-1)//BATCH_SIZE + 1}")
        
        for msg in batch:
            send_telegram_message(msg)
            time.sleep(DELAY_WITHIN_BATCH)
        
        if i + BATCH_SIZE < total_messages:
            print(f"Pausa di {DELAY_BETWEEN_BATCHES} secondi...")
            time.sleep(DELAY_BETWEEN_BATCHES)

def send_telegram_message(text: str) -> None:
    """Invia un singolo messaggio a Telegram."""
    url = f'https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage'
    payload = {
        'chat_id': GROUP_ID,
        'text': text,
        'message_thread_id': TOPIC_ID,
        'parse_mode': 'Markdown',
        'disable_web_page_preview': True
    }
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        print(f"Messaggio inviato: {text[:50]}...")
    except Exception as e:
        print(f"Errore invio Telegram: {e}")

async def monitor_mods():
    """Monitor principale."""
    print("Avvio monitoraggio...")
    last_state = load_last_state()
    new_state = fetch_json(MODS_URL)
    
    if not new_state:
        print("Errore: impossibile ottenere i dati delle mod")
        return

    messages = compare_status_only(last_state, new_state)
    
    if messages:
        print(f"Trovate {len(messages)} modifiche")
        send_telegram_batch(messages)
        save_current_state(new_state)
    else:
        print("Nessuna modifica rilevata")

if __name__ == "__main__":
    try:
        asyncio.run(monitor_mods())
    except Exception as e:
        print(f"Errore critico: {e}")
