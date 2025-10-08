import requests
import json
import base64
import asyncio
import os
import time
import math

# Recupera i valori dai segreti
telegram_token = os.getenv("TELEGRAM_TOKEN")
group_id = '-1001771715212'
topic_id = '79558'
github_token = os.getenv('GITHUB_TOKEN')

# URL dell'API GitHub per i file
repo_api_url_mods = 'https://api.github.com/repos/PianetaSimTS/PianetaSim/contents/Json/mods.json'
repo_api_url_state = 'https://api.github.com/repos/PianetaSimTS/PianetaSim/contents/Json/telegramstato/last_statemod.json'

# Funzione per scaricare un file JSON utilizzando l'API di GitHub
def fetch_json_from_github(api_url):
    try:
        headers = {
            "Authorization": f"token {github_token}",
            "Accept": "application/vnd.github.v3+json",
        }
        response = requests.get(api_url, headers=headers)
        response.raise_for_status()  # Rilancia l'eccezione per status code >= 400
        content = response.json()
        
        # Decodifica il contenuto in base64
        file_content = base64.b64decode(content['content']).decode('utf-8')
        return json.loads(file_content)
    except requests.exceptions.RequestException as e:
        print(f"Errore nel recuperare il file da GitHub: {e}")
        return None

# Funzione per caricare lo stato precedente
def load_last_state():
    print("Caricando lo stato precedente...")
    return fetch_json_from_github(repo_api_url_state) or []

# Funzione per salvare il nuovo stato su GitHub
def save_current_state(new_state):
    try:
        headers = {
            "Authorization": f"token {github_token}",
            "Accept": "application/vnd.github.v3+json",
        }

        # Recupera il SHA del file esistente
        current_file = requests.get(repo_api_url_state, headers=headers).json()
        sha = current_file['sha']

        # Codifica il contenuto in base64 mantenendo tutti i caratteri speciali
        content = base64.b64encode(json.dumps(new_state, indent=2, ensure_ascii=False).encode('utf-8')).decode('utf-8')

        # Aggiorna il file su GitHub
        data = {
            "message": "Aggiornamento stato mod con supporto per caratteri speciali",
            "content": content,
            "sha": sha,
        }

        response = requests.put(repo_api_url_state, headers=headers, json=data)
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

        # Nuovi campi per la gestione MOD/DLC/Descrizione IT/EN
        'MODIT': safe_strip(mod.get('MODIT')),
        'DLCIT': safe_strip(mod.get('DLCIT')),
        'DescrizioneIT': safe_strip(mod.get('DescrizioneIT')),
        'MODEN': safe_strip(mod.get('MODEN')),
        'DLCEN': safe_strip(mod.get('DLCEN')),
        'DescrizioneEN': safe_strip(mod.get('DescrizioneEN')),
    }

# Funzione per confrontare gli stati e generare il messaggio
def compare_status_only(old_state, new_state):
    messages = []

    # Normalizza lo stato vecchio e nuovo
    normalized_old = [normalize_mod(mod) for mod in old_state if normalize_mod(mod) is not None]
    normalized_new = [normalize_mod(mod) for mod in new_state if normalize_mod(mod) is not None]

    status_icons = {
        "AGGIORNATA": "🟢",
        "COMPATIBILE": "🔵",
        "ROTTA": "🔴",
        "NUOVA": "🟣",
        "SCONOSCIUTA & OBSOLETA": "⚪️"
    }

    old_mod_names = {mod['ModName'] for mod in normalized_old}

    for new_mod in normalized_new:
        if not all(key in new_mod and new_mod[key] for key in ['ModName', 'Author']):
            continue  # Salta se mancano campi essenziali

        # MOD NUOVA
        if new_mod['ModName'] not in old_mod_names:
            if 'Status' not in new_mod or not new_mod['Status']:
                new_mod['Status'] = "NUOVA"
            icon = status_icons.get(new_mod['Status'], "⚪️")
            messages.append(
                f"MOD AGGIUNTA AL SITO\n\n"
                f"*{new_mod['ModName']}* ➜ Di *{new_mod['Author']}*\n\n"
                f"Stato {icon} _{new_mod['Status']}_\n"
                f"Link [SITO](https://pianetasimts.github.io/PianetaSim/mod.html)"
            )

        else:
            # Cerca la versione vecchia
            old_mod = next(
                (mod for mod in normalized_old if mod['ModName'] == new_mod['ModName'] and mod['Author'] == new_mod['Author']),
                None
            )

            if old_mod:
                # Cambio di stato
                if new_mod.get('Status') != old_mod.get('Status') and "SCONOSCIUTA" not in new_mod['Status']:
                    icon = status_icons.get(new_mod['Status'], "⚪️")
                    messages.append(
                        f"MOD\n\n"
                        f"*{new_mod['ModName']}* ➜ Di *{new_mod['Author']}*\n\n"
                        f"Stato {icon} _{new_mod['Status']}_\n"
                        f"Link [SITO](https://pianetasimts.github.io/PianetaSim/mod.html)"
                    )

                # Cambio data (solo se compatibile o aggiornata)
                elif new_mod.get('DataUltimaModifica') != old_mod.get('DataUltimaModifica'):
                    if new_mod['Status'] in ["COMPATIBILE", "AGGIORNATA"]:
                        icon = status_icons.get(new_mod['Status'], "⚪️")
                        messages.append(
                            f"MOD\n\n"
                            f"*{new_mod['ModName']}* ➜ Di *{new_mod['Author']}*\n\n"
                            f"Stato {icon} _{new_mod['Status']}_\n"
                            f"Link [SITO](https://pianetasimts.github.io/PianetaSim/mod.html)"
                        )

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
        
def send_telegram_batch(messages, chat_id, topic_id, batch_size=20, delay=60):
    total = len(messages)
    for i in range(0, total, batch_size):
        batch = messages[i:i+batch_size]
        for message in batch:
            send_telegram_message(message, chat_id, topic_id)
            time.sleep(2)  # Ritardo tra i singoli messaggi per sicurezza
        if i + batch_size < total:
            print(f"Aspetto {delay} secondi per evitare limiti Telegram...")
            time.sleep(delay)
            
# Funzione per monitorare le modifiche
async def monitor_mods():
    print("Monitorando le modifiche...")
    last_state = load_last_state()
    new_state = fetch_json_from_github(repo_api_url_mods)

    if new_state:
      messages = compare_status_only(last_state, new_state)

      if messages:
        print("Modifiche di status rilevate! Inviando notifiche...")

        # Invio in batch dei messaggi Telegram per evitare rate limit
        send_telegram_batch(messages, group_id, topic_id)

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
