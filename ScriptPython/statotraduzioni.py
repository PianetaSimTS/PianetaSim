import requests
import json
import os
from telegram.ext import Application
import asyncio

# Recupera i valori dai segreti
telegram_token = '7390613815:AAFZzCFSMnfomMqRXHkKzEqsrPo7Rh_0Yf4'
group_id = '-1001771715212'
github_token = os.getenv('GITHUB_TOKEN')

# URL dei file su GitHub
mods_url = 'https://raw.githubusercontent.com/PianetaSimTS/PianetaSim/refs/heads/main/Json/programmi.json'
state_url = 'https://raw.githubusercontent.com/PianetaSimTS/PianetaSim/refs/heads/main/Json/telegramstato/last_stateprogrammi.json'

# Funzione per inviare messaggi su Telegram
async def send_telegram_message(message: str):
    url = f"https://api.telegram.org/bot{telegram_token}/sendMessage"
    payload = {
        "chat_id": group_id,
        "text": message
    }
    response = requests.post(url, data=payload)
    if response.status_code == 200:
        print("Messaggio inviato con successo")
    else:
        print(f"Errore nell'invio del messaggio: {response.status_code}")

# Funzione per scaricare i file JSON
def download_json(url):
    headers = {'Authorization': f'token {github_token}'}
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Errore nel download del file: {response.status_code}")
        return None

# Funzione per confrontare due JSON
def compare_json(json1, json2):
    messages = []
    status_icons = {
        "AGGIORNATA": "🟢",
        "COMPATIBILE": "🔵",
        "ROTTA": "🔴",
        "NUOVA": "🟣",
        "DA AGGIORNARE": "⚪️",
        "SCONOSCIUTA & OBSOLETA": "⚪️"
    }
    
    for item1, item2 in zip(json1, json2):
        if item1["programma"] == item2["programma"]:
            # Confronta lo stato di Windows
            if item1["statuswindows"] != item2["statuswindows"]:
                messages.append(f"{item1['programma']}\n"
                                f"Stato Windows {status_icons.get(item2['statuswindows'], '')} {item2['statuswindows']}\n"
                                f"Link SITO: {item2['link_programma']}\n"
                                f"Ultimo aggiornamento Windows: {item2['data_aggiornamentowindows']}")
            
            # Confronta lo stato di macOS
            if item1["statusmacos"] != item2["statusmacos"]:
                messages.append(f"{item1['programma']}\n"
                                f"Stato macOS {status_icons.get(item2['statusmacos'], '')} {item2['statusmacos']}\n"
                                f"Link SITO: {item2['link_programma']}\n"
                                f"Ultimo aggiornamento macOS: {item2['data_aggiornamentomacos']}")
    
    return messages

# Funzione per aggiornare il file last_stateprogrammi.json
def update_state_file(json_data):
    headers = {'Authorization': f'token {github_token}'}
    response = requests.get(state_url, headers=headers)
    if response.status_code == 200:
        file_info = response.json()
        update_url = file_info['download_url']
        update_response = requests.put(update_url, json=json_data, headers=headers)
        if update_response.status_code == 200:
            print("File aggiornato con successo")
        else:
            print(f"Errore nell'aggiornamento del file: {update_response.status_code}")
    else:
        print(f"Errore nel recupero del file: {response.status_code}")

# Funzione principale
async def main():
    # Scarica i file JSON da GitHub
    json_mods = download_json(mods_url)
    json_state = download_json(state_url)
    
    if json_mods and json_state:
        # Confronta i JSON
        messages = compare_json(json_mods, json_state)
        
        if messages:
            # Invia i messaggi su Telegram
            for message in messages:
                await send_telegram_message(message)
            
            # Aggiorna il file state con i dati di programmi
            update_state_file(json_mods)

# Avvia l'app
if __name__ == '__main__':
    asyncio.run(main())
