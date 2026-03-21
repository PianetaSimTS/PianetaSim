import requests
import json
import base64
import asyncio
import os
import time
from datetime import datetime

# -------------------------------
# CONFIG
# -------------------------------
telegram_token = os.getenv("TELEGRAM_TOKEN")
group_id = '-1001771715212'
topic_id = '79558'
github_token = os.getenv('GITHUB_TOKEN')

repo_api_url_mods = 'https://api.github.com/repos/PianetaSimTS/PianetaSim/contents/Json/mods18.json'
repo_api_url_state = 'https://api.github.com/repos/PianetaSimTS/PianetaSim/contents/Json/telegramstato/last_statemod18.json'


# -------------------------------
# FETCH JSON DA GITHUB CON API
# -------------------------------
def fetch_json_from_github(api_url):
    """Recupera e decodifica il file JSON da GitHub usando l'API"""
    try:
        headers = {
            "Authorization": f"token {github_token}",
            "Accept": "application/vnd.github.v3+json",
        }
        
        response = requests.get(api_url, headers=headers)
        response.raise_for_status()
        
        file_data = response.json()
        
        # Decodifica il contenuto base64
        if 'content' in file_data:
            file_content = base64.b64decode(file_data['content']).decode('utf-8')
            return json.loads(file_content)
        else:
            print(f"❌ Nessun contenuto trovato in {api_url}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Errore nella richiesta a {api_url}: {e}")
        return None
    except json.JSONDecodeError as e:
        print(f"❌ Errore nel parsing JSON: {e}")
        return None


# -------------------------------
# CARICA STATO PRECEDENTE
# -------------------------------
def load_last_state():
    """Carica l'ultimo stato salvato"""
    last_state = fetch_json_from_github(repo_api_url_state)
    return last_state if last_state is not None else []


# -------------------------------
# SALVA STATO SU GITHUB VIA API
# -------------------------------
def save_current_state(new_state):
    """Salva il nuovo stato su GitHub usando l'API"""
    try:
        headers = {
            "Authorization": f"token {github_token}",
            "Accept": "application/vnd.github.v3+json",
        }
        
        # Prima recupera il file corrente per ottenere lo SHA
        current_response = requests.get(repo_api_url_state, headers=headers)
        current_response.raise_for_status()
        current_file = current_response.json()
        
        sha = current_file.get('sha')
        if not sha:
            print("❌ SHA non trovato per il file")
            return False
        
        # Prepara il nuovo contenuto
        new_content = json.dumps(new_state, indent=2, ensure_ascii=False)
        encoded_content = base64.b64encode(new_content.encode('utf-8')).decode('utf-8')
        
        # Prepara i dati per l'update
        update_data = {
            "message": f"Aggiornamento stato mod - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "content": encoded_content,
            "sha": sha,
        }
        
        # Invia l'update
        update_response = requests.put(repo_api_url_state, headers=headers, json=update_data)
        update_response.raise_for_status()
        
        print("✅ Stato salvato con successo su GitHub")
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Errore nell'aggiornamento di GitHub: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"   Dettaglio: {e.response.text}")
        return False


# -------------------------------
# NORMALIZZAZIONE DATI
# -------------------------------
def normalize_mod(mod):
    """Normalizza i dati di una mod per il confronto"""
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
    """Verifica se un valore di data è vuoto (None, stringa vuota, o solo spazi)"""
    if data_value is None:
        return True
    if isinstance(data_value, str):
        return data_value.strip() == ''
    return False


# -------------------------------
# CONFRONTO MOD
# -------------------------------
def compare_status_only(old_state, new_state):
    """Confronta i due stati e genera i messaggi per le modifiche"""
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
        
        # MOD NUOVA
        if mod_key not in old_mod_keys:
            message_mod = (
                f"🔞  <b>MOD +18 AGGIUNTA AL SITO</b>\n\n"
                f"<b>{new_mod['ModName']}</b> ➜ di <b>{new_mod['Author']}</b>\n\n"
                f"Stato {icon_mod} <u><i>{new_mod['Status']}</i></u>\n"
                f'Link <a href="https://pianetasimts.github.io/PianetaSim/mod18.html">SITO</a>'
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
                
                translation_message += f'Link <a href="https://pianetasimts.github.io/PianetaSim/mod18.html">SITO</a>'
                messages.append(translation_message)
            
            continue
        
        # MOD ESISTENTE
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
                f"🔞  <b>MOD +18</b>\n\n"
                f"<b>{new_mod['ModName']}</b> ➜ di <b>{new_mod['Author']}</b>\n\n"
                f"Stato {icon_mod} <u><i>{new_mod['Status']}</i></u>\n"
                f'Link <a href="https://pianetasimts.github.io/PianetaSim/mod18.html">SITO</a>'
            )
        
        # Cambio TRADUZIONE
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
            
            translation_message += f'Link <a href="https://pianetasimts.github.io/PianetaSim/mod18.html">SITO</a>'
            messages.append(translation_message)
    
    return messages


# -------------------------------
# TELEGRAM
# -------------------------------
def send_telegram_message(message, chat_id, topic_id):
    """Invia un singolo messaggio Telegram"""
    url = f'https://api.telegram.org/bot{telegram_token}/sendMessage'
    
    payload = {
        "chat_id": chat_id,
        "text": message,
        "message_thread_id": topic_id,
        "disable_web_page_preview": True,
        "parse_mode": "HTML"
    }
    
    try:
        response = requests.post(url, data=payload, timeout=30)
        response.raise_for_status()
        return True
    except requests.exceptions.RequestException as e:
        print(f"❌ Errore Telegram: {e}")
        return False


def send_telegram_batch(messages, chat_id, topic_id, batch_size=20, delay=60):
    """Invia messaggi in batch con ritardi per evitare rate limiting"""
    total = len(messages)
    
    for i in range(0, total, batch_size):
        batch = messages[i:i+batch_size]
        
        for j, message in enumerate(batch, 1):
            send_telegram_message(message, chat_id, topic_id)
            if j < len(batch):
                time.sleep(2)  # Pausa tra i messaggi nello stesso batch
        
        if i + batch_size < total:
            print(f"📤 Batch {i//batch_size + 1} completato, attesa {delay} secondi...")
            time.sleep(delay)


# -------------------------------
# MONITOR MOD
# -------------------------------
async def monitor_mods():
    """Funzione principale di monitoraggio"""
    print("🔄 Avvio monitoraggio mod...")
    
    # Carica lo stato precedente
    last_state = load_last_state()
    print(f"📊 Stato precedente caricato: {len(last_state)} mod")
    
    # Recupera lo stato attuale
    new_state = fetch_json_from_github(repo_api_url_mods)
    
    if new_state is None:
        print("❌ Errore nel recupero delle mod dal repository")
        return
    
    print(f"📊 Stato attuale: {len(new_state)} mod")
    
    # Confronta gli stati
    messages = compare_status_only(last_state, new_state)
    
    if messages:
        print(f"📨 Trovate {len(messages)} modifiche da notificare")
        
        # Invia i messaggi
        send_telegram_batch(messages, group_id, topic_id)
        
        # Salva il nuovo stato
        if save_current_state(new_state):
            print("✅ Monitoraggio completato con successo!")
        else:
            print("⚠️ Modifiche notificate ma stato non salvato su GitHub")
    else:
        print("ℹ️ Nessuna modifica trovata tra gli stati")
        # Aggiorna comunque il timestamp dell'ultimo controllo
        if last_state:
            # Aggiungi un timestamp all'array per tracciare l'ultimo controllo
            timestamp_data = {"last_check": datetime.now().isoformat(), "data": last_state}
            # Non salviamo se non ci sono modifiche per evitare commit inutili
            pass


# -------------------------------
# MAIN
# -------------------------------
if __name__ == "__main__":
    try:
        print("🚀 Avvio del programma...")
        asyncio.run(monitor_mods())
        print("🏁 PROGRAMMA TERMINATO NORMALMENTE")
    except KeyboardInterrupt:
        print("\n⚠️ Programma interrotto dall'utente")
    except Exception as e:
        print(f"❌ Errore esecuzione: {e}")
        import traceback
        traceback.print_exc()
