import requests
import json
import base64
import asyncio
import os
from datetime import datetime

# -------------------------------
# CONFIG
# -------------------------------
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
# AGGIORNA SOLO IL FILE DI STATO
# -------------------------------
async def update_only_state_file():
    """Aggiorna solo il file last_statemod.json con i dati attuali delle mod"""
    print("🔄 Avvio aggiornamento file di stato...")
    
    # Recupera lo stato attuale delle mod
    current_mods = fetch_json_from_github(repo_api_url_mods)
    
    if current_mods is None:
        print("❌ Errore nel recupero delle mod dal repository")
        return False
    
    print(f"📊 Mod attuali recuperate: {len(current_mods)}")
    
    # Salva lo stato attuale come nuovo last_statemod.json
    if save_current_state(current_mods):
        print("✅ File last_statemod.json aggiornato con successo!")
        return True
    else:
        print("❌ Errore durante l'aggiornamento del file last_statemod.json")
        return False


# -------------------------------
# MAIN
# -------------------------------
if __name__ == "__main__":
    try:
        print("🚀 Avvio del programma...")
        success = asyncio.run(update_only_state_file())
        
        if success:
            print("🏁 PROGRAMMA TERMINATO CON SUCCESSO")
        else:
            print("🏁 PROGRAMMA TERMINATO CON ERRORI")
            
    except KeyboardInterrupt:
        print("\n⚠️ Programma interrotto dall'utente")
    except Exception as e:
        print(f"❌ Errore esecuzione: {e}")
        import traceback
        traceback.print_exc()
