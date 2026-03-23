import requests
import json
import base64
import os
import time
from datetime import datetime

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
# FETCH JSON DA GITHUB VIA API
# -------------------------------
def fetch_github_json(path):
    """Recupera e decodifica il file JSON da GitHub usando l'API"""
    url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/contents/{path}"
    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        content_json = response.json()
        
        # Verifica che ci sia il contenuto
        if 'content' not in content_json:
            print(f"❌ Nessun contenuto trovato in {path}")
            return None
            
        decoded = base64.b64decode(content_json['content']).decode('utf-8')
        return json.loads(decoded)
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Errore recuperando {path}: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"   Dettaglio: {e.response.text}")
        return None
    except json.JSONDecodeError as e:
        print(f"❌ Errore nel parsing JSON di {path}: {e}")
        return None

# -------------------------------
# CARICA STATO PRECEDENTE
# -------------------------------
def load_last_state():
    """Carica l'ultimo stato salvato"""
    print("📊 Caricando stato precedente...")
    last_state = fetch_github_json(state_path)
    return last_state if last_state is not None else []

# -------------------------------
# SALVA STATO SU GITHUB VIA API
# -------------------------------
def save_current_state(new_state):
    """Salva il nuovo stato su GitHub usando l'API"""
    url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/contents/{state_path}"
    try:
        # Prima recupera il file corrente per ottenere lo SHA
        current_response = requests.get(url, headers=headers, timeout=30)
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
            "message": f"Aggiornamento stato animazioni - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "content": encoded_content,
            "sha": sha,
        }
        
        # Invia l'update
        update_response = requests.put(url, headers=headers, json=update_data, timeout=30)
        update_response.raise_for_status()
        
        print("✅ Stato aggiornato su GitHub")
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Errore aggiornamento GitHub: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"   Dettaglio: {e.response.text}")
        return False

# -------------------------------
# NORMALIZZAZIONE DATI
# -------------------------------
def normalize_mod(mod):
    """Normalizza i dati di un'animazione per il confronto"""
    def safe(value):
        return str(value).strip() if value is not None else ''
    
    return {
        "Autore": safe(mod.get("Autore")),
        "Status": safe(mod.get("Status")).upper(),
        "Link": safe(mod.get("Link")),
        "DataAggiornamento": safe(mod.get("DataAggiornamento"))
    }

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
# CONFRONTO ANIMAZIONI
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
        if is_new or (old_mod and (new_mod["Status"] != old_mod["Status"] or 
                                   new_mod["DataAggiornamento"] != old_mod["DataAggiornamento"])):
            
            # Costruisci il messaggio
            message = (
                f"🌶 <b>ANIMAZIONE</b>\n\n"
                f"<b>{new_mod['Autore']}</b>\n\n"
            )
            
            # Aggiungi la data solo se presente
            if not is_data_blank(new_mod['DataAggiornamento']):
                message += f"📅 Data: {new_mod['DataAggiornamento']}\n\n"
            
            message += (
                f"<b>Stato {icon} {status}</b>\n"
                f'Link <a href="https://pianetasimts.github.io/PianetaSim/animazioniww18.html">SITO</a>'
            )
            
            messages.append(message)

    return messages

# -------------------------------
# TELEGRAM
# -------------------------------
def send_telegram_message(message, chat_id, topic_id):
    """Invia un singolo messaggio Telegram"""
    url = f"https://api.telegram.org/bot{telegram_token}/sendMessage"
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
        print("✅ Messaggio inviato")
        return True
    except requests.exceptions.RequestException as e:
        print(f"❌ Errore Telegram: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"   Dettaglio: {e.response.text}")
        return False

def send_telegram_batch(messages, chat_id, topic_id, batch_size=20, delay=60):
    """Invia messaggi in batch con ritardi per evitare rate limiting"""
    total = len(messages)
    
    if total == 0:
        return
    
    print(f"📨 Invio {total} messaggi in batch...")
    
    for i in range(0, total, batch_size):
        batch = messages[i:i+batch_size]
        
        for j, message in enumerate(batch, 1):
            send_telegram_message(message, chat_id, topic_id)
            if j < len(batch):
                time.sleep(2)  # Pausa tra i messaggi nello stesso batch
        
        if i + batch_size < total:
            print(f"⏳ Batch {i//batch_size + 1} completato, attesa {delay} secondi...")
            time.sleep(delay)

# -------------------------------
# MONITOR
# -------------------------------
def monitor_mods():
    """Funzione principale di monitoraggio"""
    print("🔄 Avvio monitoraggio animazioni...")
    
    # Carica lo stato precedente
    last_state = load_last_state()
    print(f"📊 Stato precedente caricato: {len(last_state)} animazioni")
    
    # Recupera lo stato attuale
    new_state = fetch_github_json(mods_path)
    
    if new_state is None:
        print("❌ Errore nel recupero delle animazioni dal repository")
        return
    
    print(f"📊 Stato attuale: {len(new_state)} animazioni")
    
    # Confronta gli stati
    messages = compare_status_only(last_state, new_state)
    
    if messages:
        print(f"📨 Trovate {len(messages)} modifiche da notificare")
        
        # Invia i messaggi in batch
        send_telegram_batch(messages, group_id, topic_id)
        
        # Salva il nuovo stato
        if save_current_state(new_state):
            print("✅ Monitoraggio completato con successo!")
        else:
            print("⚠️ Modifiche notificate ma stato non salvato su GitHub")
    else:
        print("ℹ️ Nessuna modifica trovata tra gli stati")

# -------------------------------
# MAIN
# -------------------------------
if __name__ == "__main__":
    try:
        print("🚀 Avvio del programma...")
        monitor_mods()
        print("🏁 PROGRAMMA TERMINATO NORMALMENTE")
    except KeyboardInterrupt:
        print("\n⚠️ Programma interrotto dall'utente")
    except Exception as e:
        print(f"❌ Errore esecuzione: {e}")
        import traceback
        traceback.print_exc()
