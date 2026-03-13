import requests
import json
import base64
import asyncio
import os
import time

telegram_token = os.getenv("TELEGRAM_TOKEN")
group_id = '-1001771715212'
topic_id = '79558'
github_token = os.getenv('GITHUB_TOKEN')

repo_api_url_mods = 'https://api.github.com/repos/PianetaSimTS/PianetaSim/contents/Json/mods18.json'
repo_api_url_state = 'https://api.github.com/repos/PianetaSimTS/PianetaSim/contents/Json/telegramstato/last_statemod18.json'


# -------------------------------
# FETCH JSON DA GITHUB
# -------------------------------

def fetch_json_from_github(api_url):

    try:

        headers = {
            "Authorization": f"token {github_token}",
            "Accept": "application/vnd.github.v3+json",
        }

        response = requests.get(api_url, headers=headers)
        response.raise_for_status()

        content = response.json()

        file_content = base64.b64decode(content['content']).decode('utf-8')

        return json.loads(file_content)

    except requests.exceptions.RequestException as e:

        print(f"Errore GitHub: {e}")
        return None


# -------------------------------
# CARICA STATO
# -------------------------------

def load_last_state():

    print("Caricando stato precedente...")

    return fetch_json_from_github(repo_api_url_state) or []


# -------------------------------
# SALVA STATO
# -------------------------------

def save_current_state(new_state):

    try:

        headers = {
            "Authorization": f"token {github_token}",
            "Accept": "application/vnd.github.v3+json",
        }

        current_file = requests.get(repo_api_url_state, headers=headers).json()

        sha = current_file['sha']

        content = base64.b64encode(
            json.dumps(new_state, indent=2, ensure_ascii=False).encode('utf-8')
        ).decode('utf-8')

        data = {
            "message": "Aggiornamento stato mod18",
            "content": content,
            "sha": sha,
        }

        response = requests.put(repo_api_url_state, headers=headers, json=data)

        response.raise_for_status()

        print("Stato aggiornato su GitHub")

    except requests.exceptions.RequestException as e:

        print(f"Errore aggiornamento GitHub: {e}")


# -------------------------------
# NORMALIZZAZIONE MOD
# -------------------------------

def normalize_mod(mod):

    def safe_strip(value):

        if value is None:
            return ''

        return str(value).strip()

    return {

        "Author": safe_strip(mod.get("Author")),
        "ModName": safe_strip(mod.get("ModName")),
        "Status": safe_strip(mod.get("Status")).upper(),
        "SiteLink": safe_strip(mod.get("SiteLink")),
        "DataUltimaModifica": safe_strip(mod.get("DataUltimaModifica")),

        "Traduttore": safe_strip(mod.get("Traduttore")),
        "DataTraduzione": safe_strip(mod.get("DataTraduzione"))

    }


# -------------------------------
# CONFRONTO MOD
# -------------------------------

def compare_status_only(old_state, new_state):

    messages = []

    normalized_old = [normalize_mod(m) for m in old_state]
    normalized_new = [normalize_mod(m) for m in new_state]

    status_icons = {

        "AGGIORNATA": "🟢",
        "COMPATIBILE": "🔵",
        "ROTTA": "🔴",
        "NUOVA": "🟣",
        "SCONOSCIUTA & OBSOLETA": "⚪️"

    }

    old_mod_keys = {(m['ModName'], m['Author']) for m in normalized_old}

    for new_mod in normalized_new:

        if not new_mod["ModName"] or not new_mod["Author"]:
            continue

        icon = status_icons.get(new_mod["Status"], "⚪️")

        # ---------------------------
        # MOD NUOVA
        # ---------------------------

        if (new_mod["ModName"], new_mod["Author"]) not in old_mod_keys:

            messages.append(

                f"🔞 MOD +18\n\n"
                f"MOD AGGIUNTA AL SITO\n\n"
                f"{new_mod['ModName']} ➜ Di {new_mod['Author']}\n\n"
                f"Stato {icon} {new_mod['Status']}\n\n"
                f"Link SITO"
            )

        else:

            old_mod = next(

                (
                    m for m in normalized_old
                    if m["ModName"] == new_mod["ModName"]
                    and m["Author"] == new_mod["Author"]
                ),

                None
            )

            if not old_mod:
                continue

            # ---------------------------
            # CAMBIO STATUS
            # ---------------------------

            if new_mod["Status"] != old_mod["Status"]:

                messages.append(

                    f"🔞 MOD +18\n\n"
                    f"{new_mod['ModName']} ➜ Di {new_mod['Author']}\n\n"
                    f"Stato {icon} {new_mod['Status']}\n"
                    f"Versione Mod: {new_mod['DataUltimaModifica']}\n\n"
                    f"Link SITO"
                )

            # ---------------------------
            # CAMBIO VERSIONE
            # ---------------------------

            elif new_mod["DataUltimaModifica"] != old_mod["DataUltimaModifica"]:

                messages.append(

                    f"🔞 MOD +18\n\n"
                    f"{new_mod['ModName']} ➜ Di {new_mod['Author']}\n\n"
                    f"Stato {icon} {new_mod['Status']}\n"
                    f"Versione Mod: {new_mod['DataUltimaModifica']}\n\n"
                    f"Link SITO"
                )

            # ---------------------------
            # TRADUZIONE AGGIORNATA
            # ---------------------------

            elif new_mod["DataTraduzione"] != old_mod["DataTraduzione"]:

                if new_mod["Traduttore"]:

                    messages.append(

                        f"TRADUZIONE {new_mod['Traduttore']}\n\n"
                        f"{new_mod['ModName']} ➜ Di {new_mod['Author']}\n\n"
                        f"Stato {icon} {new_mod['Status']}\n"
                        f"Versione Mod: {new_mod['DataUltimaModifica']}\n\n"
                        f"Link SITO"
                    )

    return messages


# -------------------------------
# TELEGRAM
# -------------------------------

def send_telegram_message(message, chat_id, topic_id):

    url = f'https://api.telegram.org/bot{telegram_token}/sendMessage'

    payload = {

        "chat_id": chat_id,
        "text": message,
        "message_thread_id": topic_id,
        "disable_web_page_preview": True

    }

    try:

        response = requests.post(url, data=payload)

        response.raise_for_status()

        print("Messaggio inviato")

    except requests.exceptions.RequestException as e:

        print(f"Errore Telegram: {e}")


def send_telegram_batch(messages, chat_id, topic_id, batch_size=20, delay=60):

    total = len(messages)

    for i in range(0, total, batch_size):

        batch = messages[i:i+batch_size]

        for message in batch:

            send_telegram_message(message, chat_id, topic_id)

            time.sleep(2)

        if i + batch_size < total:

            print(f"Aspetto {delay} secondi")

            time.sleep(delay)


# -------------------------------
# MONITOR MOD
# -------------------------------

async def monitor_mods():

    print("Monitorando modifiche mods18...")

    last_state = load_last_state()

    new_state = fetch_json_from_github(repo_api_url_mods)

    if new_state:

        messages = compare_status_only(last_state, new_state)

        if messages:

            print("Modifiche rilevate")

            send_telegram_batch(messages, group_id, topic_id)

            save_current_state(new_state)

        else:

            print("Nessuna modifica trovata")

    else:

        print("Errore recupero mods18")


# -------------------------------
# MAIN
# -------------------------------

if __name__ == "__main__":

    try:

        asyncio.run(monitor_mods())

    except Exception as e:

        print(f"Errore esecuzione: {e}")