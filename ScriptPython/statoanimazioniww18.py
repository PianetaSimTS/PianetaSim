import requests
import json
import base64
import asyncio
import os

# Recupera i valori dai segreti
telegram_token = '7390613815:AAFZzCFSMnfomMqRXHkKzEqsrPo7Rh_0Yf4'
group_id = '-1001516258837'
topic_id = '26621'
github_token = os.getenv('GITHUB_TOKEN')

# URL dei file su GitHub
mods_url = 'https://raw.githubusercontent.com/PianetaSimTS/PianetaSim/refs/heads/main/Json/animazioniww18.json'
state_url = 'https://raw.githubusercontent.com/PianetaSimTS/PianetaSim/refs/heads/main/Json/telegramstato/last_stateanimazioni.json'
repo_api_url = 'https://api.github.com/repos/PianetaSimTS/PianetaSim/contents/Json/telegramstato/last_stateanimazioni.json'

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
            "message": "Aggiornamento stato animazioni",
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
        'Autore': str(mod.get('Autore', '')).strip().lower() if mod.get('Autore') else '',
        'Status': str(mod.get('Status', '')).strip().lower() if mod.get('Status') else '',
        'Link': str(mod.get('Link', '')).strip() if mod.get('Link') else '',
        'DataAggiornamento': str(mod.get('DataAggiornamento', '')).strip() if mod.get('DataAggiornamento') else '',
        'Note': str(mod.get('Note', '')).strip() if mod.get('Note') else '',
    }

# Funzione per confrontare gli stati e generare il messaggio
def compare_status_only(old_state, new_state):
    messages = []

    # Normalizza lo stato vecchio e nuovo
    normalized_old = [normalize_mod(mod) for mod in old_state]
    normalized_new = [normalize_mod(mod) for mod in new_state]
    status_icons = {
        "AGGIORNATA": "🟢",  # Pallino verde
        "COMPATIBILE": "🔵",  # Pallino blu
        "ROTTA": "🔴",       # Pallino rosso
        "NUOVA": "🟣",       # Pallino viola
        "SCONOSCIUTA & OBSOLETA": "⚪️"  # Pallino bianco
    }

    # Confronta lo stato delle mod una per una
    for new_mod in normalized_new:
        for old_mod in normalized_old:
            if new_mod['Autore'] == old_mod['Autore']:  # Confronta per autore
                if new_mod['Status'] != old_mod['Status']:  # Controlla se lo status è cambiato
                    # Aggiungi il pallino corrispondente allo stato
                    status_icon = status_icons.get(new_mod['Status'].upper(), "⚪️")  # Usa il pallino predefinito se lo stato non è trovato

                    status_change_message = (
                        f"ANIMAZIONE\n\n"
                        f"*{new_mod['Autore'].title()}* ➜ Data: *{new_mod['DataAggiornamento']}*\n\n"
                        f"Stato {status_icon} _{new_mod['Status'].capitalize()}\n_"
                        f"Link [SITO](https://pianetasimts.github.io/PianetaSim/index.html)"
                    )
                    messages.append(status_change_message)
                break  # Interrompi il ciclo interno se l'autore corrisponde

    return messages

# Funzione per inviare un messaggio su Telegram
def send_telegram_message(message, chat_id, topic_id):
    url = f'https://api.telegram.org/bot{telegram_token}/sendMessage'

    payload = {
        'chat_id': chat_id,
        'text': message,
        'message_thread_id': topic_id,
        'parse_mode': 'Markdown',  # Usa Markdown per supporto caratteri
        'disable_web_page_preview': True
    }

    try:
        response = requests.post(url, data=payload)
        response.raise_for_status()  # Solleva un'eccezione per errori di invio
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
            for message in messages:
                send_telegram_message(message, group_id, topic_id)  # Invio del messaggio

            save_current_state(new_state)  # Salva il nuovo stato
        else:
            print("Nessuna modifica dello status trovata.")
    else:
        print("Errore nel recupero delle informazioni sui mods.")

if __name__ == "__main__":
    try:
        asyncio.run(monitor_mods())
    except Exception as e:
        print(f"Errore nell'esecuzione del programma: {e}")
