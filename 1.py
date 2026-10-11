import requests
from flask import Flask, request, jsonify, render_template_string
from bs4 import BeautifulSoup
import random
import time
import re

app = Flask(__name__)

# Configurações de Cabeçalho para parecer um navegador real
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    'Referer': 'https://www.google.com/'
}

# Assinaturas dos Gateways (Baseado no seu código anterior)
SIGNATURES = [
    {"name": "Stripe", "patterns": [r"js\.stripe\.com", r"stripe\.co", r"pk_live_\w+", r"api\.stripe\.com"]},
    {"name": "PayPal", "patterns": [r"paypalobjects\.com", r"www\.paypal\.com", r"sandbox\.paypal\.com"]},
    {"name": "Mercado Pago", "patterns": [r"mercadopago\.com", r"mpcheckout", r"mp-static", r"mp\.br"]},
    {"name": "PagSeguro", "patterns": [r"pagseguro\.uol\.com\.br", r"ws\.magazine\.luiza\.com\.br/pagseguro"]},
    {"name": "Hotmart", "patterns": [r"checkout\.hotmart\.com", r"hotmart\.com/login", r"phb-assets"]},
    {"name": "Kiwify", "patterns": [r"checkout\.kiwify\.com\.br", r"kiwify\.com\.br"]},
    {"name": "Eduzz", "patterns": [r"checkout\.eduzz\.com", r"eduzz\.com"]},
    {"name": "Braintree", "patterns": [r"braintreegateway\.com", r"btutil\.js", r"dropin/v1/"]},
    {"name": "Adyen", "patterns": [r"adyen\.com/webresources", r"adyen\.com/static"]},
    {"name": "Pagar.me", "patterns": [r"pagarme\.com", r"checkout\.pagarme\.com"]},
    {"name": "WooCommerce", "patterns": [r"wp-content/plugins/woocommerce", r"woocommerce"]}
]

def get_free_proxy():
    """Tenta obter uma lista de proxies gratuitos"""
    try:
        # Usando uma API pública de proxies (pode falhar se estiver sobrecarregada)
        url = "https://api.proxyscrape.com/?request=getproxies&proxytype=http&timeout=10000&country=all&ssl=all&anonymity=all"
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            proxies_list = response.text.strip().split('\r\n')
            if proxies_list:
                proxy = random.choice(proxies_list)
                return {"http": f"http://{proxy}", "https": f"http://{proxy}"}
    except Exception:
        pass
    return None

def scan_website(target_url):
    detected_gateways = []
    evidence = []
    
    # 1. Tentar com Proxy
    proxy = get_free_proxy()
    proxies_to_use = proxy if proxy else None
    
    if proxy:
        print(f"[+] Usando Proxy: {proxy['http']}")
    else:
        print("[!] Nenhum proxy disponível, tentando conexão direta...")

    try:
        # Faz a requisição
        resp = requests.get(
            target_url, 
            headers=HEADERS, 
            proxies=proxies_to_use, 
            timeout=15,
            allow_redirects=True
        )
        
        if resp.status_code != 200:
            return {"error": f"Erro HTTP: {resp.status_code}. O site pode estar bloqueando acessos."}

        html_content = resp.text
        soup = BeautifulSoup(html_content, 'lxml')
        
        # Combina HTML e scripts encontrados na página
        full_text = html_content
        
        # Busca por tags script para pegar URLs internas também
        for script in soup.find_all('script', src=True):
            full_text += " " + script.get('src', '')

        # Verifica assinaturas
        for sig in SIGNATURES:
            hits = 0
            found_evidence = []
            
            for pattern in sig["patterns"]:
                matches = re.findall(pattern, full_text, re.IGNORECASE)
                if matches:
                    hits += len(matches)
                    # Pega apenas os primeiros 2 exemplos para não poluir
                    found_evidence.extend(matches[:2])
            
            if hits > 0:
                detected_gateways.append({
                    "name": sig["name"],
                    "confidence": min(hits * 15, 100), # Calcula % fictícia baseada em ocorrências
                    "evidence": list(set(found_evidence))[:3] # Remove duplicatas
                })

        # Ordena por confiança
        detected_gateways.sort(key=lambda x: x["confidence"], reverse=True)

        return {
            "status": "success",
            "url_scanned": target_url,
            "proxy_used": proxy is not None,
            "results": detected_gateways
        }

    except requests.exceptions.Timeout:
        return {"error": "Tempo esgotado. O site pode estar lento ou o proxy caiu."}
    except requests.exceptions.ConnectionError:
        return {"error": "Erro de conexão. Verifique sua internet ou tente novamente (proxy pode ter caído)."}
    except Exception as e:
        return {"error": str(e)}

# Interface HTML Embutida (Estilo Hacker/Termux)
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mindle Scanner v2.0 (Python Backend)</title>
    <style>
        body { background-color: #0d0d0d; color: #00ff41; font-family: 'Courier New', monospace; padding: 20px; }
        h1 { text-shadow: 0 0 10px #00ff41; text-align: center; }
        .container { max-width: 600px; margin: 0 auto; background: #1a1a1a; padding: 20px; border: 1px solid #00ff41; box-shadow: 0 0 15px rgba(0,255,65,0.2); }
        input { width: 95%; padding: 12px; background: #000; border: 1px solid #333; color: #fff; margin-bottom: 15px; font-family: inherit; }
        button { width: 100%; padding: 12px; background: #00ff41; color: #000; border: none; font-weight: bold; cursor: pointer; font-family: inherit; }
        button:hover { background: #00cc33; }
        #output { margin-top: 20px; white-space: pre-wrap; background: #000; padding: 15px; border: 1px dashed #333; min-height: 100px; font-size: 0.9em; }
        .detected { color: #ffff00; font-weight: bold; }
        .error { color: #ff3333; }
        .loading { color: #00ccff; }
        .badge { background: #333; padding: 2px 6px; border-radius: 4px; font-size: 0.8em; }
    </style>
</head>
<body>
    <h1>[Mindle] Gateway Hunter v2.0</h1>
    <div class="container">
        <p style="text-align:center;">Insira a URL para análise profunda:</p>
        <input type="text" id="urlInput" placeholder="https://exemplo.com/checkout" />
        <button onclick="startScan()">ANALISAR ALVO</button>
        
        <div id="output"></div>
    </div>

<script>
async function startScan() {
    const url = document.getElementById('urlInput').value.trim();
    const out = document.getElementById('output');
    
    if(!url) { out.innerHTML = '<span class="error">[-] Digite uma URL válida!</span>'; return; }
    
    out.innerHTML = '<span class="loading">[+] Conectando ao backend Python...</span>\n';
    out.innerHTML += '<span class="loading">[+] Buscando proxy gratuito...</span>\n';
    
    try {
        const response = await fetch('/scan', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({url: url})
        });
        
        const data = await response.json();
        
        if(data.error) {
            out.innerHTML += `<span class="error">[-] Erro: ${data.error}</span>`;
        } else {
            out.innerHTML = `<span class="detected">[+] ANÁLISE CONCLUÍDA EM: ${data.url_scanned}</span>\n`;
            if(data.proxy_used) out.innerHTML += `<span class="loading">[!] Proxy utilizado para ocultar IP.</span>\n\n`;
            
            if(data.results.length === 0) {
                out.innerHTML += `<span class="error">[-] Nenhum gateway conhecido detectado.</span>`;
            } else {
                data.results.forEach(item => {
                    out.innerHTML += `\n<span class="detected">>> ${item.name}</span> (Confiança: ${item.confidence}%)\n`;
                    if(item.evidence.length > 0) {
                        out.innerHTML += `   Evidência: ${item.evidence.join(', ')}\n`;
                    }
                });
            }
        }
    } catch(e) {
        out.innerHTML += `<span class="error">[-] Falha na comunicação com o servidor local.</span>`;
    }
}
</script>
</body>
</html>
"""

@app.route('/')
def home():
    return render_template_string(HTML_TEMPLATE)

@app.route('/scan', methods=['POST'])
def api_scan():
    data = request.json
    url = data.get('url')
    if not url:
        return jsonify({"error": "URL não fornecida"}), 400
    
    # Garante que tenha http/https
    if not url.startswith('http'):
        url = 'https://' + url
        
    result = scan_website(url)
    return jsonify(result)

if __name__ == '__main__':
    print("\n[ Mindle Scanner Iniciado ]")
    print("[+] Acesse no navegador: http://localhost:5000")
    print("[+] Se estiver em outra máquina na mesma Wi-Fi, use: http://SEU_IP_LOCAL:5000")
    app.run(host='0.0.0.0', port=5000, debug=False)