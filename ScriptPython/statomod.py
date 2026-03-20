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

        print(f"📡 Fetching da: {api_url}")
        response = requests.get(api_url, headers=headers)
        response.raise_for_status()

        content = response.json()
        file_content = base64.b64decode(content['content']).decode('utf-8')
        
        print(f"✅ Dati recuperati da: {api_url}")
        return json.loads(file_content)

    except requests.exceptions.RequestException as e:
        print(f"❌ Errore recupero file GitHub: {e}")
        return None


# -------------------------------
# CARICA STATO PRECEDENTE
# -------------------------------
def load_last_state():
    print("📂 Caricando stato precedente...")
    last_state = fetch_json_from_github(repo_api_url_state) or []
    print(f"📊 Stato precedente: {len(last_state)} mod trovate")
    return last_state


# -------------------------------
# SALVA STATO
# -------------------------------
def save_current_state(new_state):
    try:
        print("💾 Salvataggio nuovo stato su GitHub...")
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

        print("✅ Stato salvato su GitHub")

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
    
    print(f"🔄 Mod normalizzata: {normalized['ModName']} di {normalized['Author']}")
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
    print("\n🔍 INIZIO CONFRONTO MODIFICHE")
    print(f"📊 Stato vecchio: {len(old_state)} mod")
    print(f"📊 Stato nuovo: {len(new_state)} mod")

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
    print(f"🔑 Chiavi vecchie mod: {len(old_mod_keys)}")

    # Controllo MOD NUOVE
    print("\n🔎 Verifica mod nuove...")
    for new_mod in normalized_new:
        mod_key = (new_mod["ModName"], new_mod["Author"])
        
        if not new_mod["ModName"] or not new_mod["Author"]:
            print(f"⚠️ Mod ignorata (nome o autore vuoto): {new_mod}")
            continue

        icon_mod = status_icons.get(new_mod["Status"], "⚪️")
        icon_tr = status_icons.get(new_mod["Translation"], "⚪️")

        # ----------------------------
        # MOD NUOVA
        # ----------------------------
        if mod_key not in old_mod_keys:
            print(f"\n✨ MOD NUOVA TROVATA:")
            print(f"   Nome: {new_mod['ModName']}")
            print(f"   Autore: {new_mod['Author']}")
            print(f"   Status: {new_mod['Status']}")
            print(f"   Traduzione: {new_mod['Translation']}")
            print(f"   Traduttore: {new_mod['Traduttore']}")

            message_mod = (
                f"🧩  <b>MOD AGGIUNTA AL SITO</b>\n\n"
                f"<b>{new_mod['ModName']}</b> ➜ di <b>{new_mod['Author']}</b>\n\n"
                f"Stato {icon_mod} <u><i>{new_mod['Status']}</i></u>\n"
                f'Link <a href="https://pianetasimts.github.io/PianetaSim/mod.html">SITO</a>'
            )
            messages.append(message_mod)
            print(f"✅ Messaggio MOD NUOVA creato")

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
                print(f"✅ Messaggio TRADUZIONE NUOVA creato")

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
            print(f"⚠️ Mod non trovata nel vecchio stato: {mod_key}")
            continue

        # Cambio MOD
        mod_changed = (new_mod["Status"] != old_mod["Status"] or 
                      new_mod["DataUltimaModifica"] != old_mod["DataUltimaModifica"])
        
        if mod_changed:
            print(f"\n📝 MODIFICA MOD TROVATA per: {new_mod['ModName']}")
            print(f"   Status: {old_mod['Status']} ➜ {new_mod['Status']}")
            print(f"   Data modifica: {old_mod['DataUltimaModifica']} ➜ {new_mod['DataUltimaModifica']}")

            messages.append(
                f"🧩  <b>MOD</b>\n\n"
                f"<b>{new_mod['ModName']}</b> ➜ di <b>{new_mod['Author']}</b>\n\n"
                f"Stato {icon_mod} <u><i>{new_mod['Status']}</i></u>\n"
                f'Link <a href="https://pianetasimts.github.io/PianetaSim/mod.html">SITO</a>'
            )
            print(f"✅ Messaggio MODIFICHE MOD creato")

        # Cambio TRADUZIONE (stato o data)
        translation_changed = ((new_mod["Translation"] != old_mod["Translation"] or 
                               new_mod["DataTraduzione"] != old_mod["DataTraduzione"]) 
                              and new_mod["Traduttore"])
        
        if translation_changed:
            print(f"\n📝 MODIFICA TRADUZIONE TROVATA per: {new_mod['ModName']}")
            print(f"   Stato trad: {old_mod['Translation']} ➜ {new_mod['Translation']}")
            print(f"   Data trad: {old_mod['DataTraduzione']} ➜ {new_mod['DataTraduzione']}")
            print(f"   Traduttore: {new_mod['Traduttore']}")

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
            print(f"✅ Messaggio MODIFICHE TRADUZIONE creato")

    print(f"\n📨 TOTALE MESSAGGI CREATI: {len(messages)}")
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
        print(f"📤 Invio messaggio Telegram (lunghezza: {len(message)} caratteri)")
        response = requests.post(url, data=payload)
        response.raise_for_status()
        print("✅ Messaggio inviato con successo")

    except requests.exceptions.RequestException as e:
        print(f"❌ Errore Telegram: {e}")


def send_telegram_batch(messages, chat_id, topic_id, batch_size=20, delay=60):
    total = len(messages)
    print(f"\n📦 INVIO BATCH DI {total} MESSAGGI")
    print(f"📊 Batch size: {batch_size}, Delay tra batch: {delay}s")

    for i in range(0, total, batch_size):
        batch = messages[i:i+batch_size]
        print(f"\n📨 Batch {i//batch_size + 1}/{(total-1)//batch_size + 1} ({len(batch)} messaggi)")

        for j, message in enumerate(batch, 1):
            print(f"   📤 Invio messaggio {j}/{len(batch)} del batch")
            send_telegram_message(message, chat_id, topic_id)
            if j < len(batch):
                print(f"   ⏱️ Attesa 2 secondi prima del prossimo messaggio")
                time.sleep(2)

        if i + batch_size < total:
            print(f"\n⏱️ Batch completato. Attesa {delay} secondi prima del prossimo batch...")
            time.sleep(delay)


# -------------------------------
# MONITOR MOD
# -------------------------------
async def monitor_mods():
    print("="*50)
    print("🚀 AVVIO MONITORAGGIO MOD")
    print("="*50)

    print("\n📥 Caricamento stato precedente...")
    last_state = load_last_state()
    
    print("\n📥 Caricamento nuovo stato...")
    new_state = fetch_json_from_github(repo_api_url_mods)

    if new_state:
        print("\n🔍 Confronto stati...")
        messages = compare_status_only(last_state, new_state)

        if messages:
            print(f"\n🎉 MODIFICHE RILEVATE! {len(messages)} messaggi da inviare")
            print("-" * 40)
            for i, msg in enumerate(messages, 1):
                print(f"\n📝 Messaggio {i}:")
                print(msg[:200] + "..." if len(msg) > 200 else msg)
            print("-" * 40)

            print("\n📤 Invio messaggi a Telegram...")
            send_telegram_batch(messages, group_id, topic_id)

            print("\n💾 Salvataggio nuovo stato...")
            save_current_state(new_state)

            print("\n✅ Monitoraggio completato con successo!")
        else:
            print("\nℹ️ Nessuna modifica trovata tra gli stati")
    else:
        print("\n❌ Errore recupero mods - impossibile procedere")

    print("\n" + "="*50)


# -------------------------------
# MAIN
# -------------------------------
if __name__ == "__main__":
    print("🏁 PROGRAMMA AVVIATO")
    print(f"📱 Telegram Group ID: {group_id}")
    print(f"📱 Telegram Topic ID: {topic_id}")
    print(f"🔑 GitHub Token: {'Presente' if github_token else 'NON PRESENTE'}")
    print(f"🔑 Telegram Token: {'Presente' if telegram_token else 'NON PRESENTE'}")
    print()

    try:
        asyncio.run(monitor_mods())
        print("🏁 PROGRAMMA TERMINATO NORMALMENTE")
    except Exception as e:
        print(f"❌ Errore esecuzione: {e}")
