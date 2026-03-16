import requests
import json
import base64
import os

telegram_token = os.getenv("TELEGRAM_TOKEN")
group_id = '-1001516258837'
topic_id = '26621'

github_token = os.getenv('GITHUB_TOKEN')
repo_owner = 'PianetaSimTS'
repo_name = 'PianetaSim'

headers = {
    "Authorization": f"token {github_token}",
    "Accept": "application/vnd.github.v3+json"
}

mods_path = 'Json/animazioniww18.json'
state_path = 'Json/telegramstato/last_stateanimazioni.json'

# -------------------------------
# FETCH JSON DA GITHUB
# -------------------------------
def fetch_github_json(path):
    url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/contents/{path}"
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        content_json = response.json()
        decoded = base64.b64decode(content_json['content']).decode('utf-8')
        return json.loads(decoded)
    except requests.exceptions.RequestException as e:
        print(f"Errore recuperando {path}: {e}")
        return None

# -------------------------------
# CARICA STATO PRECEDENTE
# -------------------------------
def load_last_state():
    print("Caricando stato precedente...")
    return fetch_github_json(state_path) or []

# -------------------------------
# SALVA STATO
# -------------------------------
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
        print("Stato aggiornato su GitHub")
    except requests.exceptions.RequestException as e:
        print(f"Errore aggiornamento GitHub: {e}")

# -------------------------------
# NORMALIZZAZIONE DATI
# -------------------------------
def normalize_mod(mod):
    def safe(value):
        return str(value).strip() if value is not None else ''
    return {
        "Autore": safe(mod.get("Autore")),
        "Status": safe(mod.get("Status")).upper(),
        "Link": safe(mod.get("Link")),
        "DataAggiornamento": safe(mod.get("DataAggiornamento"))
    }

# -------------------------------
# CONFRONTO ANIMAZIONI
# -------------------------------
def compare_status_only(old_state, new_state):
    messages = []
    normalized_old = [normalize_mod(m) for m in old_state]
    normalized_new = [normalize_mod(m) for m in new_state]

    status_icons = {
        "COMPATIBILE": "🩵",
        "AGGIORNATA": "💚",
        "ROTTA": "💔",
        "NUOVA": "💜",
        "SCONOSCIUTA": "🩶",
        "OBSOLETA": "🤎",
        "NON NECESSARIA": "🧡",
        "INCLUSA": "💛",
        "IN LAVORAZIONE": "🩷",
        "DA CONTROLLARE": "🖤",
        "DA AGGIORNARE": "💙"
    }

    old_authors = {m["Autore"] for m in normalized_old}

    for new_mod in normalized_new:
        if not new_mod["Autore"]:
            continue

        status = new_mod["Status"] if new_mod["Status"] else "NUOVA"
        icon = status_icons.get(status, "⚪️")

        # --------------------------------
        # NUOVA ANIMAZIONE O MODIFICATA
        # --------------------------------
        is_new = new_mod["Autore"] not in old_authors
        old_mod = next(
            (m for m in normalized_old if m["Autore"] == new_mod["Autore"]),
            None
        )

        # Solo se nuova o se cambia stato/data
        if is_new or (old_mod and (new_mod["Status"] != old_mod["Status"] or new_mod["DataAggiornamento"] != old_mod["DataAggiornamento"])):
            messages.append(
                f"🌶 <b>ANIMAZIONE</b>\n\n"
                f"<b>{new_mod['Autore']} ➜ Data {new_mod['DataAggiornamento']}</b>\n\n"
                f"<b>Stato {icon} {status}</b>\n\n"
                f"Link <a href=\"https://pianetasimts.github.io/PianetaSim/animazioniww18.html\">SITO</a>"
            )

    return messages

# -------------------------------
# TELEGRAM
# -------------------------------
def send_telegram_message(message, chat_id, topic_id):
    url = f"https://api.telegram.org/bot{telegram_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message,
        "message_thread_id": topic_id,
        "disable_web_page_preview": True,
        "parse_mode": "HTML"
    }
    try:
        response = requests.post(url, data=payload)
        response.raise_for_status()
        print("Messaggio inviato")
    except requests.exceptions.RequestException as e:
        print(f"Errore Telegram: {e}")

# -------------------------------
# MONITOR
# -------------------------------
def monitor_mods():
    print("Monitorando animazioni...")
    last_state = load_last_state()
    new_state = fetch_github_json(mods_path)
    if new_state:
        messages = compare_status_only(last_state, new_state)
        if messages:
            print("Modifiche rilevate")
            for message in messages:
                send_telegram_message(message, group_id, topic_id)
            save_current_state(new_state)
        else:
            print("Nessuna modifica trovata")
    else:
        print("Errore recupero animazioni")

# -------------------------------
# MAIN
# -------------------------------
if __name__ == "__main__":
    try:
        monitor_mods()
    except Exception as e:
        print(f"Errore esecuzione: {e}")
