import requests
import json
import base64
import asyncio
import os
import time

# -------------------------------
# CONFIG
# -------------------------------
telegram_token = os.getenv("TELEGRAM_TOKEN")
group_id = '-1001771715212'
topic_id = '79558'
github_token = os.getenv('GITHUB_TOKEN')

repo_api_url_mods = 'https://api.github.com/repos/PianetaSimTS/PianetaSim/contents/Json/mods.json'
repo_api_url_state = 'https://api.github.com/repos/PianetaSimTS/PianetaSim/contents/Json/telegramstato/last_statemod.json'


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
        return None


# -------------------------------
# CARICA STATO PRECEDENTE
# -------------------------------
def load_last_state():
    last_state = fetch_json_from_github(repo_api_url_state) or []
    return last_state


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
            "message": "Aggiornamento stato mod",
            "content": content,
            "sha": sha,
        }

        response = requests.put(repo_api_url_state, headers=headers, json=data)
        response.raise_for_status()

    except requests.exceptions.RequestException as e:
        print(f"❌ Errore aggiornamento GitHub: {e}")


# -------------------------------
# NORMALIZZAZIONE DATI
# -------------------------------
def normalize_mod(mod):
    def safe_strip(value):
        if value is None:
            return ''
        return str(value).strip()

    normalized = {
        "Author": safe_strip(mod.get("Author")),
        "ModName": safe_strip(mod.get("ModName")),
        "Status": safe_strip(mod.get("Status")).upper(),
        "Translation": safe_strip(mod.get("Translation")).upper(),
        "DataUltimaModifica": safe_strip(mod.get("DataUltimaModifica")),
        "Traduttore": safe_strip(mod.get("Traduttore")),
        "DataTraduzione": safe_strip(mod.get("DataTraduzione")),
    }
    
    return normalized


# -------------------------------
# FUNZIONE DI UTILITÀ PER VERIFICARE SE UNA DATA È VUOTA
# -------------------------------
def is_data_blank(data_value):
    """
    Verifica se un valore di data è vuoto (None, stringa vuota, o solo spazi)
    """
    if data_value is None:
        return True
    if isinstance(data_value, str):
        return data_value.strip() == ''
    return False


# -------------------------------
# CONFRONTO MOD
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

    old_mod_keys = {(m['ModName'], m['Author']) for m in normalized_old}


    # Controllo MOD NUOVE

    for new_mod in normalized_new:
        mod_key = (new_mod["ModName"], new_mod["Author"])
        
        if not new_mod["ModName"] or not new_mod["Author"]:
            continue

        icon_mod = status_icons.get(new_mod["Status"], "⚪️")
        icon_tr = status_icons.get(new_mod["Translation"], "⚪️")

        # ----------------------------
        # MOD NUOVA
        # ----------------------------
        if mod_key not in old_mod_keys:

            message_mod = (
                f"🧩  <b>MOD AGGIUNTA AL SITO</b>\n\n"
                f"<b>{new_mod['ModName']}</b> ➜ di <b>{new_mod['Author']}</b>\n\n"
                f"Stato {icon_mod} <u><i>{new_mod['Status']}</i></u>\n"
                f'Link <a href="https://pianetasimts.github.io/PianetaSim/mod.html">SITO</a>'
            )
            messages.append(message_mod)


            if new_mod["Traduttore"]:
                translation_message = (
                    f"💬  <b>TRADUZIONE {new_mod['Traduttore']}</b>\n\n"
                    f"<b>{new_mod['ModName']}</b> ➜ di <b>{new_mod['Author']}</b>\n\n"
                    f"Stato {icon_tr} <u><i>{new_mod['Translation']}</i></u>\n"
                )
                
                if not is_data_blank(new_mod['DataTraduzione']):
                    translation_message += f"Versione Traduzione: {new_mod['DataTraduzione']}\n\n"
                else:
                    translation_message += "\n"
                
                translation_message += f'Link <a href="https://pianetasimts.github.io/PianetaSim/mod.html">SITO</a>'
                
                messages.append(translation_message)


            continue

        # ----------------------------
        # MOD ESISTENTE
        # ----------------------------
        old_mod = next(
            (m for m in normalized_old
             if m["ModName"] == new_mod["ModName"]
             and m["Author"] == new_mod["Author"]),
            None
        )

        if not old_mod:
            continue

        # Cambio MOD
        mod_changed = (new_mod["Status"] != old_mod["Status"] or 
                      new_mod["DataUltimaModifica"] != old_mod["DataUltimaModifica"])
        
        if mod_changed:


            messages.append(
                f"🧩  <b>MOD</b>\n\n"
                f"<b>{new_mod['ModName']}</b> ➜ di <b>{new_mod['Author']}</b>\n\n"
                f"Stato {icon_mod} <u><i>{new_mod['Status']}</i></u>\n"
                f'Link <a href="https://pianetasimts.github.io/PianetaSim/mod.html">SITO</a>'
            )


        # Cambio TRADUZIONE (stato o data)
        translation_changed = ((new_mod["Translation"] != old_mod["Translation"] or 
                               new_mod["DataTraduzione"] != old_mod["DataTraduzione"]) 
                              and new_mod["Traduttore"])
        
        if translation_changed:


            translation_message = (
                f"💬  <b>TRADUZIONE di {new_mod['Traduttore']}</b>\n\n"
                f"<b>{new_mod['ModName']}</b> ➜ di <b>{new_mod['Author']}</b>\n\n"
                f"Stato {icon_tr} <u><i>{new_mod['Translation']}</i></u>\n"
            )
            
            if not is_data_blank(new_mod['DataTraduzione']):
                translation_message += f"Versione Traduzione: {new_mod['DataTraduzione']}\n\n"
            else:
                translation_message += "\n"
            
            translation_message += f'Link <a href="https://pianetasimts.github.io/PianetaSim/mod.html">SITO</a>'
            
            messages.append(translation_message)



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
        "disable_web_page_preview": True,
        "parse_mode": "HTML"
    }

    try:

        response = requests.post(url, data=payload)
        response.raise_for_status()


    except requests.exceptions.RequestException as e:
        print(f"❌ Errore Telegram: {e}")


def send_telegram_batch(messages, chat_id, topic_id, batch_size=20, delay=60):
    total = len(messages)


    for i in range(0, total, batch_size):
        batch = messages[i:i+batch_size]


        for j, message in enumerate(batch, 1):

            send_telegram_message(message, chat_id, topic_id)
            if j < len(batch):

                time.sleep(2)

        if i + batch_size < total:

            time.sleep(delay)


# -------------------------------
# MONITOR MOD
# -------------------------------
async def monitor_mods():



    last_state = load_last_state()

    new_state = fetch_json_from_github(repo_api_url_mods)

    if new_state:

        messages = compare_status_only(last_state, new_state)

        if messages:

            for i, msg in enumerate(messages, 1):

             send_telegram_batch(messages, group_id, topic_id)
             save_current_state(new_state)

            print("\n✅ Monitoraggio completato con successo!")
        else:
            print("\nℹ️ Nessuna modifica trovata tra gli stati")
    else:
        print("\n❌ Errore recupero mods - impossibile procedere")


# -------------------------------
# MAIN
# -------------------------------
if __name__ == "__main__":
    try:
        asyncio.run(monitor_mods())
        print("🏁 PROGRAMMA TERMINATO NORMALMENTE")
    except Exception as e:
        print(f"❌ Errore esecuzione: {e}")
