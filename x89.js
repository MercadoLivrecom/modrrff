/* ============================================================
   X89 RECON SUITE v1.0
   Canal: X89modps
   Carrega Eruda + sniffer completo + storage dump
   Uso: <script src="https://x89modps.netlify.app/x89.js"></script>
   ============================================================ */

(function () {
    'use strict';

    // Evita carregar duas vezes
    if (window.__X89_LOADED) return;
    window.__X89_LOADED = true;

    // ============ BANNER ============
    console.log(
        '%c╔══════════════════════════════════════╗\n' +
        '║        X89 RECON SUITE v1.0         ║\n' +
        '║         Canal: X89modps             ║\n' +
        '╚══════════════════════════════════════╝',
        'color:#0ff;font-weight:bold;font-family:monospace'
    );

    // ============ ARMAZENAMENTO GLOBAL ============
    window.__X89 = {
        requests: [],
        responses: [],
        websockets: [],
        inputs: [],
        forms: [],
        m3u8: [],
        tokens: {},
        storage: {},
        startTime: Date.now(),
        version: '1.0',
        canal: 'X89modps'
    };

    // ============ 1. ERUDA ============
    (function loadEruda() {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/eruda@latest/eruda.min.js';
        s.onload = function () {
            try {
                eruda.init();
                eruda.show();
                console.log('%c[ERUDA] Ativado', 'color:#0f0');
                // Navega direto pra aba console
                setTimeout(() => {
                    try { eruda.get('console').show(); } catch (e) {}
                }, 500);
            } catch (e) {
                console.error('[ERUDA] Falha:', e);
            }
        };
        s.onerror = function () {
            console.warn('[ERUDA] Não conseguiu carregar');
        };
        document.head.appendChild(s);
    })();

    // ============ 2. LOGGER DE FETCH ============
    (function hookFetch() {
        const _fetch = window.fetch;
        if (!_fetch) return;

        window.fetch = function (...args) {
            const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url) || '';
            const method = (args[1] && args[1].method) || 'GET';
            const body = args[1] && args[1].body ? String(args[1].body).slice(0, 500) : null;
            const headers = args[1] && args[1].headers ? args[1].headers : null;

            const entry = {
                tipo: 'fetch',
                metodo: method,
                url: url,
                body: body,
                headers: headers,
                tempo: Date.now()
            };
            window.__X89.requests.push(entry);

            // Detecta m3u8
            if (typeof url === 'string' && (url.includes('.m3u8') || url.includes('.ts'))) {
                window.__X89.m3u8.push(url);
                console.log('%c🎬 [M3U8]', 'color:#f0f;font-weight:bold', url);
            }

            console.log(
                '%c[FETCH] ' + method,
                'color:#0ff;font-weight:bold',
                url
            );

            return _fetch.apply(this, args).then(resp => {
                window.__X89.responses.push({
                    tipo: 'fetch',
                    url: url,
                    status: resp.status,
                    tempo: Date.now()
                });
                console.log(
                    '%c[RESP] ' + resp.status,
                    resp.status >= 400 ? 'color:#f80' : 'color:#0f0',
                    url
                );
                return resp;
            }).catch(err => {
                console.error('[FETCH ERRO]', url, err);
                throw err;
            });
        };
    })();

    // ============ 3. LOGGER DE XHR ============
    (function hookXHR() {
        const _open = XMLHttpRequest.prototype.open;
        const _send = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function (method, url) {
            this.__x89 = { method, url, tempo: Date.now() };
            window.__X89.requests.push({
                tipo: 'xhr',
                metodo: method,
                url: url,
                tempo: Date.now()
            });

            if (typeof url === 'string' && (url.includes('.m3u8') || url.includes('.ts'))) {
                window.__X89.m3u8.push(url);
                console.log('%c🎬 [M3U8]', 'color:#f0f;font-weight:bold', url);
            }

            console.log(
                '%c[XHR] ' + method,
                'color:#ff0;font-weight:bold',
                url
            );
            return _open.apply(this, arguments);
        };

        XMLHttpRequest.prototype.send = function (body) {
            const self = this;
            if (body) {
                console.log('%c[XHR BODY]', 'color:#ff0', String(body).slice(0, 300));
            }
            this.addEventListener('load', function () {
                window.__X89.responses.push({
                    tipo: 'xhr',
                    url: self.__x89 ? self.__x89.url : '',
                    status: self.status
                });
                console.log(
                    '%c[XHR RESP] ' + self.status,
                    self.status >= 400 ? 'color:#f80' : 'color:#0f0',
                    self.__x89 ? self.__x89.url : ''
                );
            });
            return _send.apply(this, arguments);
        };
    })();

    // ============ 4. SNIFFER DE WEBSOCKET ============
    (function hookWS() {
        if (!window.WebSocket) return;
        const _WS = window.WebSocket;

        window.WebSocket = function (...args) {
            const ws = new _WS(...args);
            console.log('%c[WS OPEN]', 'color:#0ff;font-weight:bold', args[0]);

            ws.addEventListener('message', function (e) {
                window.__X89.websockets.push({
                    dir: 'in',
                    url: args[0],
                    data: String(e.data).slice(0, 1000),
                    tempo: Date.now()
                });
                console.log('%c[WS IN]', 'color:#0f0', String(e.data).slice(0, 200));
            });

            const _send = ws.send.bind(ws);
            ws.send = function (data) {
                window.__X89.websockets.push({
                    dir: 'out',
                    url: args[0],
                    data: String(data).slice(0, 1000),
                    tempo: Date.now()
                });
                console.log('%c[WS OUT]', 'color:#ff0', String(data).slice(0, 200));
                return _send(data);
            };

            return ws;
        };
        window.WebSocket.prototype = _WS.prototype;
    })();

    // ============ 5. KEYLOGGER DE INPUTS ============
    document.addEventListener('input', function (e) {
        const t = e.target;
        if (!t || !t.tagName) return;
        const nome = t.name || t.id || t.type || 'campo';
        const valor = t.value;
        window.__X89.inputs.push({
            campo: nome,
            valor: valor,
            tipo: t.type,
            tempo: Date.now()
        });
        console.log(
            '%c[INPUT] ' + nome,
            'color:#f0f;font-weight:bold',
            '=',
            valor
        );
    }, true);

    // ============ 6. INTERCEPTOR DE FORMULÁRIO ============
    document.addEventListener('submit', function (e) {
        const f = e.target;
        if (!f || !f.tagName || f.tagName !== 'FORM') return;
        const obj = {};
        try {
            const fd = new FormData(f);
            fd.forEach((v, k) => { obj[k] = v; });
        } catch (err) {}
        window.__X89.forms.push({
            action: f.action,
            method: f.method,
            dados: obj,
            tempo: Date.now()
        });
        console.log(
            '%c[FORM SUBMIT]',
            'color:#f80;font-weight:bold',
            f.action,
            obj
        );
    }, true);

    // ============ 7. DUMP DE STORAGE ============
    (function dumpStorage() {
        const dump = {};

        // Cookies
        dump.cookies = document.cookie;

        // LocalStorage
        try {
            dump.localStorage = {};
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                dump.localStorage[k] = localStorage.getItem(k);
            }
        } catch (e) { dump.localStorage = {}; }

        // SessionStorage
        try {
            dump.sessionStorage = {};
            for (let i = 0; i < sessionStorage.length; i++) {
                const k = sessionStorage.key(i);
                dump.sessionStorage[k] = sessionStorage.getItem(k);
            }
        } catch (e) { dump.sessionStorage = {}; }

        window.__X89.storage = dump;

        console.log('%c=== COOKIES ===', 'color:#0ff;font-weight:bold');
        console.log(document.cookie || '(vazio)');

        console.log('%c=== LOCALSTORAGE ===', 'color:#0ff;font-weight:bold');
        console.log(JSON.stringify(dump.localStorage, null, 2));

        console.log('%c=== SESSIONSTORAGE ===', 'color:#0ff;font-weight:bold');
        console.log(JSON.stringify(dump.sessionStorage, null, 2));
    })();

    // ============ 8. CAÇADOR DE TOKENS EM GLOBAIS ============
    (function huntTokens() {
        const alvo = /token|auth|user|key|api|session|jwt|secret|bearer|login|senha|password|id/i;
        const achados = {};

        Object.keys(window).forEach(k => {
            if (!alvo.test(k)) return;
            try {
                const v = window[k];
                if (v === null || v === undefined) return;
                if (typeof v === 'function') return;
                if (typeof v === 'object') {
                    // Copia rasa, só campos simples
                    const copia = {};
                    Object.keys(v).slice(0, 50).forEach(kk => {
                        const vv = v[kk];
                        if (typeof vv === 'string' || typeof vv === 'number' || typeof vv === 'boolean') {
                            copia[kk] = vv;
                        }
                    });
                    if (Object.keys(copia).length) achados[k] = copia;
                } else {
                    achados[k] = v;
                }
            } catch (e) {}
        });

        window.__X89.tokens = achados;

        console.log('%c=== POSSÍVEIS TOKENS/CHAVES ===', 'color:#0ff;font-weight:bold');
        if (Object.keys(achados).length === 0) {
            console.log('(nada encontrado)');
        } else {
            Object.keys(achados).forEach(k => {
                console.log('%c' + k, 'color:#0f0;font-weight:bold', '=', achados[k]);
            });
        }
    })();

    // ============ 9. HUD FLUTUANTE ============
    (function hud() {
        const h = document.createElement('div');
        h.id = '__x89_hud';
        h.style.cssText =
            'position:fixed;top:8px;right:8px;z-index:2147483647;' +
            'background:rgba(0,0,0,0.85);color:#0ff;font:11px monospace;' +
            'padding:8px 10px;border-radius:6px;border:1px solid #0ff;' +
            'pointer-events:auto;line-height:1.5;white-space:pre;' +
            'box-shadow:0 0 20px rgba(0,255,255,0.4)';
        h.title = 'Clique pra ver o console do Eruda';
        h.onclick = function () {
            try { eruda.show(); eruda.get('console').show(); } catch (e) {}
        };
        document.body.appendChild(h);

        setInterval(function () {
            const x = window.__X89;
            const uptime = Math.floor((Date.now() - x.startTime) / 1000);
            h.textContent =
                '⚡ X89 RECON\n' +
                '─────────────\n' +
                'Req:   ' + x.requests.length + '\n' +
                'Resp:  ' + x.responses.length + '\n' +
                'WS:    ' + x.websockets.length + '\n' +
                'Input: ' + x.inputs.length + '\n' +
                'Form:  ' + x.forms.length + '\n' +
                'M3U8:  ' + x.m3u8.length + '\n' +
                '─────────────────\n' +
                'Tempo: ' + uptime + 's\n' +
                '📺 X89modps';
        }, 1000);
    })();

    // ============ 10. COMANDOS MANUAIS ============
    window.x89 = {
        // Mostra tudo
        dump: function () {
            console.log('%c=== DUMP COMPLETO X89 ===', 'color:#0ff;font-weight:bold');
            console.log(JSON.stringify(window.__X89, null, 2));
            return window.__X89;
        },
        // Lista m3u8 capturados
        m3u8: function () {
            console.log('%c=== M3U8 CAPTURADOS ===', 'color:#f0f;font-weight:bold');
            window.__X89.m3u8.forEach((u, i) => console.log(i + 1 + '.', u));
            return window.__X89.m3u8;
        },
        // Mostra tokens achados
        tokens: function () {
            console.log('%c=== TOKENS ===', 'color:#0f0;font-weight:bold');
            console.log(window.__X89.tokens);
            return window.__X89.tokens;
        },
        // Salva tudo num arquivo JSON
        save: function () {
            const blob = new Blob([JSON.stringify(window.__X89, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'x89_dump_' + Date.now() + '.json';
            a.click();
            console.log('%c[OK] Arquivo salvo', 'color:#0f0');
        },
        // Limpa tudo
        reset: function () {
            window.__X89.requests = [];
            window.__X89.responses = [];
            window.__X89.websockets = [];
            window.__X89.inputs = [];
            window.__X89.forms = [];
            window.__X89.m3u8 = [];
            window.__X89.tokens = {};
            console.log('%c[OK] Resetado', 'color:#0f0');
        },
        // Mostra o Eruda
        eruda: function () {
            try { eruda.show(); } catch (e) { console.error('Eruda não carregou'); }
        },
        // Ajuda
        help: function () {
            console.log(`
%c⚡ X89 RECON - Comandos disponíveis:
%c
  x89.dump()    -> Mostra tudo que foi capturado
  x89.m3u8()    -> Lista os .m3u8/.ts capturados
  x89.tokens()  -> Mostra tokens/chaves achados
  x89.save()    -> Baixa um JSON com tudo
  x89.reset()   -> Limpa os dados
  x89.eruda()   -> Abre o Eruda
  x89.help()    -> Mostra essa ajuda

  Objeto completo: window.__X89
`,
                'color:#0ff;font-weight:bold;font-size:14px',
                'color:#0f0;font-family:monospace;font-size:13px'
            );
        }
    };

    // ============ FIM ============
    console.log(
        '%c✅ X89 RECON SUITE carregado!\n' +
        'Digite x89.help() pra ver os comandos.',
        'color:#0f0;font-weight:bold;font-size:13px'
    );

})();