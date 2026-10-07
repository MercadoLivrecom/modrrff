/* ============================================================
   X89 RECON SUITE v1.2
   Canal: X89modps
   Novidades:
   - Explicação automática de cada dado capturado
   - Caçador de banco de dados exposto
   - Detector de credenciais em texto plano
   ============================================================ */

(function () {
    'use strict';

    if (window.__X89_LOADED) return;
    window.__X89_LOADED = true;

    console.log(
        '%c╔══════════════════════════════════════╗\n' +
        '║      X89 RECON SUITE v1.2           ║\n' +
        '║      Canal: X89modps                ║\n' +
        '╚══════════════════════════════════════╝',
        'color:#0ff;font-weight:bold;font-family:monospace'
    );

    // ============ FILTRO ============
    const IGNORAR = [
        'doubleclick.net', 'google-analytics.com', 'googletagmanager.com',
        'googleadservices.com', 'googlesyndication.com', 'gstatic.com',
        'facebook.com/tr', 'connect.facebook.net', 'hotjar.com', 'hotjar.io',
        'sentry.io', 'sentry-cdn.com', 'clarity.ms', 'mixpanel.com',
        'segment.io', 'amplitude.com', 'fullstory.com', 'logrocket.io',
        'newrelic.com', 'nr-data.net', 'datadoghq.com', 'bugsnag.com',
        'rollbar.com', 'raygun.io', 'cloudflareinsights.com',
        'cdn.jsdelivr.net', 'unpkg.com', 'cdnjs.cloudflare.com',
        'fonts.googleapis.com', 'fonts.gstatic.com',
        'analytics.tiktok.com', 'ads.tiktok.com', 'mc.yandex.ru',
        'bat.bing.com', 'analytics.twitter.com', 'static.ads-twitter.com',
        'sc-static.net', 'tr.snapchat.com', 'criteo.com', 'criteo.net',
        'adnxs.com', 'adsrvr.org', 'taboola.com', 'outbrain.com'
    ];

    function deveIgnorar(url) {
        if (!url) return false;
        const u = String(url).toLowerCase();
        return IGNORAR.some(d => u.includes(d));
    }

    // ============ TRADUTOR DE DADOS ============
    // Explica o que cada coisa é
    const EXPLICACOES = {
        // Cookies
        'phpsessid': '🍪 Cookie de sessão PHP. Serve pra manter você logado. Se vazar, outra pessoa pode assumir sua sessão.',
        'jsessionid': '🍪 Cookie de sessão Java (Tomcat/JSP). Mantém login ativo.',
        'asp.net_sessionid': '🍪 Cookie de sessão ASP.NET. Mantém login ativo.',
        'session': '🍪 Cookie de sessão genérico. Mantém login ativo.',
        'sessionid': '🍪 Cookie de sessão. Mantém login ativo.',
        'sid': '🍪 Cookie de sessão. Mantém login ativo.',
        'token': '🔑 Token de autenticação. Serve pra validar requisições. Se vazar, acesso liberado.',
        'jwt': '🔑 Token JWT. Contém dados do usuário assinados. Decodifica em jwt.io.',
        'access_token': '🔑 Token de acesso OAuth. Autoriza chamadas de API.',
        'refresh_token': '🔑 Token de refresh. Gera novos access tokens.',
        'bearer': '🔑 Token Bearer. Vai no header Authorization.',
        'csrf': '🛡️ Token CSRF. Protege contra ataques de formulário.',
        'xsrf': '🛡️ Token XSRF. Mesma função do CSRF.',
        'auth': '🔑 Cookie/token de autenticação.',
        'login': '👤 Dado de login. Pode ser usuário ou estado de autenticação.',
        'user': '👤 Dado de usuário. ID, nome ou perfil.',
        'uid': '👤 ID único do usuário.',
        'email': '📧 E-mail do usuário.',
        'admin': '⚠️ Indica conta de administrador. Alto valor.',
        'role': '👤 Papel/permissão do usuário (admin, user, guest).',
        'lang': '🌐 Idioma preferido. Não é sensível.',
        'theme': '🎨 Tema do site (dark/light). Não é sensível.',
        'cart': '🛒 Carrinho de compras. Pode ter dados de pagamento.',
        'checkout': '💳 Estado de checkout. Sensível.',
        'payment': '💳 Dados de pagamento. MUITO sensível.',
        'credit': '💳 Cartão de crédito. MUITO sensível.',
        'cvv': '💳 CVV do cartão. MUITO sensível.',
        'cpf': '📄 CPF do usuário. Dado pessoal (LGPD).',
        'phone': '📱 Telefone do usuário. Dado pessoal.',
        'address': '🏠 Endereço. Dado pessoal.',
        'api_key': '🔑 Chave de API. Dá acesso a serviços.',
        'apikey': '🔑 Chave de API. Dá acesso a serviços.',
        'secret': '🔑 Chave secreta. Usada pra assinar coisas.',
        'password': '🔑 Senha em texto plano. SE VIR ISSO, É OURO.',
        'passwd': '🔑 Senha. Cuidado.',
        'pwd': '🔑 Senha. Cuidado.',
        'hash': '🔒 Hash (MD5/SHA). Pode ser senha criptografada.',
        'md5': '🔒 Hash MD5. Fraco, quebrável em segundos.',
        'sha1': '🔒 Hash SHA1. Fraco, quebrável.',
        'sha256': '🔒 Hash SHA256. Forte, mas ainda atacável.',
        'bcrypt': '🔒 Hash bcrypt. Forte, difícil de quebrar.',
        'db': '🗄️ Referência a banco de dados.',
        'database': '🗄️ Referência a banco de dados.',
        'mysql': '🗄️ MySQL. Banco relacional comum.',
        'postgres': '🗄️ PostgreSQL. Banco relacional.',
        'mongo': '🗄️ MongoDB. Banco NoSQL.',
        'redis': '🗄️ Redis. Cache/key-value.',
        'aws': '☁️ Credencial da AWS. Pode dar acesso à infra.',
        's3': '☁️ Bucket S3. Pode ter arquivos expostos.',
        'firebase': '☁️ Credencial do Firebase. Dá acesso ao banco do app.',
        'stripe': '💳 Chave do Stripe. Dá acesso a pagamentos.',
        'paypal': '💳 Chave do PayPal. Dá acesso a pagamentos.',
        'mercadopago': '💳 Chave do Mercado Pago.',
        'pagseguro': '💳 Chave do PagSeguro.',
        'twilio': '📱 Chave do Twilio. Envia SMS/chamadas.',
        'sendgrid': '📧 Chave do SendGrid. Envia e-mails.',
        'mailgun': '📧 Chave do Mailgun. Envia e-mails.',
        'google': '🔍 Chave do Google (Maps, Analytics, etc).',
        'maps': '🗺️ Chave do Google Maps. Pode ter custo.',
        'recaptcha': '🛡️ Chave do reCAPTCHA.',
        'cloudflare': '☁️ Chave do Cloudflare.',
        'github': '🔑 Token do GitHub. Dá acesso a repositórios.',
        'gitlab': '🔑 Token do GitLab.',
        'openai': '🔑 Chave da OpenAI. Dá acesso à API paga.',
        'private': '🔒 Chave privada. MUITO sensível.',
        'public': '🔓 Chave pública. Geralmente OK.',
        'seed': '🌱 Seed de criptografia. MUITO sensível.'
    };

    function explicar(chave, valor) {
        if (!chave) return '';
        const k = String(chave).toLowerCase();
        for (const [termo, texto] of Object.entries(EXPLICACOES)) {
            if (k.includes(termo)) return texto;
        }
        // Análise pelo valor
        const v = String(valor || '');
        if (/^eyJ[A-Za-z0-9_-]+\./.test(v)) return '🔑 Valor é um JWT (JSON Web Token). Decodifica em jwt.io.';
        if (/^[a-f0-9]{32}$/i.test(v)) return '🔒 Valor é hash MD5 (32 chars hex). Pode ser senha.';
        if (/^[a-f0-9]{40}$/i.test(v)) return '🔒 Valor é hash SHA1 (40 chars hex). Pode ser senha.';
        if (/^[a-f0-9]{64}$/i.test(v)) return '🔒 Valor é hash SHA256 (64 chars hex). Forte, mas ainda pode ser senha.';
        if (/^\$2[aby]\$/.test(v)) return '🔒 Valor é hash bcrypt. Muito forte.';
        if (/^[A-Za-z0-9+/]{40,}={0,2}$/.test(v)) return '🔑 Valor parece ser token em base64. Pode ser chave de API.';
        if (/^\d{1,3}(\.\d{1,3}){3}$/.test(v)) return '🌐 Valor é um IP.';
        if (/^[a-f0-9]{8}-[a-f0-9]{4}-/.test(v)) return '🆔 Valor é UUID. Identificador único.';
        return '';
    }

    // ============ DB HUNTER ============
    // Lista de caminhos comuns de banco/backup/config expostos
    const DB_PATHS = [
        '.env', '.env.local', '.env.production', '.env.backup',
        'config.php', 'config.js', 'config.json', 'config.yml', 'config.yaml',
        'database.php', 'database.js', 'database.json', 'db.php', 'db.json',
        'wp-config.php', 'wp-config.php.bak', 'wp-config.php~',
        'configuration.php', 'settings.py', 'settings.php',
        'backup.sql', 'backup.zip', 'backup.tar.gz', 'backup.rar',
        'db.sql', 'dump.sql', 'database.sql', 'data.sql',
        'db_backup.sql', 'backup_db.sql', 'mysql.sql',
        'adminer.php', 'phpmyadmin/', 'pma/', 'mysql/',
        'admin/', 'administrator/', 'wp-admin/',
        '.git/config', '.git/HEAD', '.svn/entries',
        'composer.json', 'composer.lock', 'package.json', 'package-lock.json',
        'yarn.lock', 'Gemfile', 'Gemfile.lock', 'requirements.txt',
        'Dockerfile', 'docker-compose.yml', '.dockerignore',
        'robots.txt', 'sitemap.xml', '.htaccess', '.htpasswd',
        'web.config', 'crossdomain.xml', 'clientaccesspolicy.xml',
        'server-status', 'server-info', 'phpinfo.php', 'info.php',
        'test.php', 'debug.php', 'test.html', 'debug.log',
        'error.log', 'access.log', 'logs/', 'log/',
        'api/', 'api/v1/', 'api/v2/', 'swagger.json', 'openapi.json',
        'graphql', 'graphiql', 'playground',
        '.well-known/security.txt', 'security.txt',
        'credentials.json', 'secrets.json', 'keys.json',
        '.aws/credentials', '.ssh/id_rsa', '.ssh/id_rsa.pub',
        'id_rsa', 'id_rsa.pub', 'private.key', 'private.pem',
        'public.key', 'public.pem', 'cert.pem', 'cert.crt',
        'keystore.jks', 'keystore.p12', 'truststore.jks'
    ];

    window.__X89 = {
        requests: [],
        responses: [],
        websockets: [],
        inputs: [],
        forms: [],
        m3u8: [],
        tokens: {},
        storage: {},
        explicacoes: [],
        dbHunter: [],
        ignored: 0,
        startTime: Date.now(),
        version: '1.2',
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

            if (deveIgnorar(url)) {
                window.__X89.ignored++;
                return _fetch.apply(this, args);
            }

            const method = (args[1] && args[1].method) || 'GET';
            const body = args[1] && args[1].body ? String(args[1].body).slice(0, 500) : null;

            window.__X89.requests.push({
                tipo: 'fetch', metodo: method, url: url,
                body: body, tempo: Date.now()
            });

            if (typeof url === 'string' && (url.includes('.m3u8') || url.includes('.ts'))) {
                window.__X89.m3u8.push(url);
                console.log('%c🎬 [M3U8]', 'color:#f0f;font-weight:bold', url);
            }

            // Detecta path de DB
            if (typeof url === 'string') {
                const u = url.toLowerCase();
                DB_PATHS.forEach(p => {
                    if (u.includes(p)) {
                        window.__X89.dbHunter.push({ url, path: p, tempo: Date.now() });
                        console.log('%c🗄️ [DB HUNTER]', 'color:#f80;font-weight:bold', 'Path suspeito:', p, '→', url);
                    }
                });
            }

            console.log('%c[FETCH] ' + method, 'color:#0ff;font-weight:bold', url);

            return _fetch.apply(this, args).then(resp => {
                window.__X89.responses.push({ tipo: 'fetch', url, status: resp.status, tempo: Date.now() });
                console.log('%c[RESP] ' + resp.status, resp.status >= 400 ? 'color:#f80' : 'color:#0f0', url);
                return resp;
            }).catch(err => {
                if (!deveIgnorar(url)) {
                    console.error('[FETCH ERRO]', url, err.message || err);
                }
                throw err;
            });
        };
    })();

    // ============ 3. LOGGER DE XHR ============
    (function hookXHR() {
        const _open = XMLHttpRequest.prototype.open;
        const _send = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function (method, url) {
            this.__x89 = { method, url, tempo: Date.now(), ignorar: deveIgnorar(url) };

            if (!this.__x89.ignorar) {
                window.__X89.requests.push({ tipo: 'xhr', metodo: method, url, tempo: Date.now() });

                if (typeof url === 'string' && (url.includes('.m3u8') || url.includes('.ts'))) {
                    window.__X89.m3u8.push(url);
                    console.log('%c🎬 [M3U8]', 'color:#f0f;font-weight:bold', url);
                }

                if (typeof url === 'string') {
                    const u = url.toLowerCase();
                    DB_PATHS.forEach(p => {
                        if (u.includes(p)) {
                            window.__X89.dbHunter.push({ url, path: p, tempo: Date.now() });
                            console.log('%c🗄️ [DB HUNTER]', 'color:#f80;font-weight:bold', 'Path suspeito:', p, '→', url);
                        }
                    });
                }

                console.log('%c[XHR] ' + method, 'color:#ff0;font-weight:bold', url);
            } else {
                window.__X89.ignored++;
            }
            return _open.apply(this, arguments);
        };

        XMLHttpRequest.prototype.send = function (body) {
            const self = this;
            const ignorar = self.__x89 && self.__x89.ignorar;
            if (body && !ignorar) {
                console.log('%c[XHR BODY]', 'color:#ff0', String(body).slice(0, 300));
            }
            if (!ignorar) {
                this.addEventListener('load', function () {
                    window.__X89.responses.push({
                        tipo: 'xhr',
                        url: self.__x89 ? self.__x89.url : '',
                        status: self.status
                    });
                    console.log('%c[XHR RESP] ' + self.status,
                        self.status >= 400 ? 'color:#f80' : 'color:#0f0',
                        self.__x89 ? self.__x89.url : '');
                });
            }
            return _send.apply(this, arguments);
        };
    })();

    // ============ 4. WEBSOCKET ============
    (function hookWS() {
        if (!window.WebSocket) return;
        const _WS = window.WebSocket;
        window.WebSocket = function (...args) {
            const ws = new _WS(...args);
            const url = args[0] || '';
            if (deveIgnorar(url)) {
                window.__X89.ignored++;
                return ws;
            }
            console.log('%c[WS OPEN]', 'color:#0ff;font-weight:bold', url);
            ws.addEventListener('message', function (e) {
                window.__X89.websockets.push({ dir: 'in', url, data: String(e.data).slice(0, 1000), tempo: Date.now() });
                console.log('%c[WS IN]', 'color:#0f0', String(e.data).slice(0, 200));
            });
            const _send = ws.send.bind(ws);
            ws.send = function (data) {
                window.__X89.websockets.push({ dir: 'out', url, data: String(data).slice(0, 1000), tempo: Date.now() });
                console.log('%c[WS OUT]', 'color:#ff0', String(data).slice(0, 200));
                return _send(data);
            };
            return ws;
        };
        window.WebSocket.prototype = _WS.prototype;
    })();

    // ============ 5. KEYLOGGER COM EXPLICAÇÃO ============
    document.addEventListener('input', function (e) {
        const t = e.target;
        if (!t || !t.tagName) return;
        const nome = t.name || t.id || t.type || 'campo';
        const valor = t.value;
        const explicacao = explicar(nome, valor);

        window.__X89.inputs.push({
            campo: nome, valor, tipo: t.type,
            explicacao: explicacao, tempo: Date.now()
        });

        if (explicacao) {
            window.__X89.explicacoes.push({ origem: 'input', campo: nome, texto: explicacao });
            console.log('%c[INPUT] ' + nome, 'color:#f0f;font-weight:bold', '=', valor);
            console.log('%c   └─ ' + explicacao, 'color:#0fa;font-style:italic');
        } else {
            console.log('%c[INPUT] ' + nome, 'color:#f0f;font-weight:bold', '=', valor);
        }
    }, true);

    // ============ 6. FORM COM EXPLICAÇÃO ============
    document.addEventListener('submit', function (e) {
        const f = e.target;
        if (!f || f.tagName !== 'FORM') return;
        const obj = {};
        try {
            const fd = new FormData(f);
            fd.forEach((v, k) => { obj[k] = v; });
        } catch (err) {}

        console.log('%c[FORM SUBMIT]', 'color:#f80;font-weight:bold', f.action, obj);

        // Explica cada campo do form
        Object.entries(obj).forEach(([k, v]) => {
            const exp = explicar(k, v);
            if (exp) {
                console.log('%c   └─ ' + k + ': ' + exp, 'color:#0fa;font-style:italic');
            }
        });

        window.__X89.forms.push({
            action: f.action, method: f.method,
            dados: obj, tempo: Date.now()
        });
    }, true);

    // ============ 7. DUMP DE STORAGE COM EXPLICAÇÃO ============
    (function dumpStorage() {
        const dump = { cookies: document.cookie, localStorage: {}, sessionStorage: {} };

        try {
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                dump.localStorage[k] = localStorage.getItem(k);
            }
        } catch (e) {}

        try {
            for (let i = 0; i < sessionStorage.length; i++) {
                const k = sessionStorage.key(i);
                dump.sessionStorage[k] = sessionStorage.getItem(k);
            }
        } catch (e) {}

        window.__X89.storage = dump;

        console.log('%c=== COOKIES ===', 'color:#0ff;font-weight:bold');
        if (document.cookie) {
            document.cookie.split(';').forEach(c => {
                const [k, ...v] = c.trim().split('=');
                const exp = explicar(k, v.join('='));
                console.log('%c' + k, 'color:#0f0;font-weight:bold', '=', v.join('='));
                if (exp) console.log('%c   └─ ' + exp, 'color:#0fa;font-style:italic');
            });
        } else {
            console.log('(vazio)');
        }

        console.log('%c=== LOCALSTORAGE ===', 'color:#0ff;font-weight:bold');
        if (Object.keys(dump.localStorage).length) {
            Object.entries(dump.localStorage).forEach(([k, v]) => {
                const exp = explicar(k, v);
                console.log('%c' + k, 'color:#0f0;font-weight:bold', '=', v);
                if (exp) console.log('%c   └─ ' + exp, 'color:#0fa;font-style:italic');
            });
        } else {
            console.log('(vazio)');
        }

        console.log('%c=== SESSIONSTORAGE ===', 'color:#0ff;font-weight:bold');
        if (Object.keys(dump.sessionStorage).length) {
            Object.entries(dump.sessionStorage).forEach(([k, v]) => {
                const exp = explicar(k, v);
                console.log('%c' + k, 'color:#0f0;font-weight:bold', '=', v);
                if (exp) console.log('%c   └─ ' + exp, 'color:#0fa;font-style:italic');
            });
        } else {
            console.log('(vazio)');
        }
    })();

    // ============ 8. CAÇADOR DE TOKENS COM EXPLICAÇÃO ============
    (function huntTokens() {
        const alvo = /token|auth|user|key|api|session|jwt|secret|bearer|login|senha|password|id/i;
        const achados = {};

        Object.keys(window).forEach(k => {
            if (!alvo.test(k)) return;
            try {
                const v = window[k];
                if (v === null || v === undefined || typeof v === 'function') return;
                if (typeof v === 'object') {
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
            Object.entries(achados).forEach(([k, v]) => {
                const exp = explicar(k, typeof v === 'object' ? JSON.stringify(v) : v);
                console.log('%c' + k, 'color:#0f0;font-weight:bold', '=', v);
                if (exp) console.log('%c   └─ ' + exp, 'color:#0fa;font-style:italic');
            });
        }
    })();

    // ============ 9. DB HUNTER ATIVO ============
    // Testa paths comuns no domínio atual (em background)
    (async function scanDBPaths() {
        const base = location.origin;
        const testados = [];
        const achados = [];

        console.log('%c=== 🗄️ DB HUNTER ATIVO ===', 'color:#f80;font-weight:bold');
        console.log('%cTestando ' + DB_PATHS.length + ' paths comuns...', 'color:#0fa;font-style:italic');

        // Testa em lotes de 5 pra não floodar
        for (let i = 0; i < DB_PATHS.length; i += 5) {
            const lote = DB_PATHS.slice(i, i + 5);
            await Promise.all(lote.map(async p => {
                try {
                    const url = base + '/' + p;
                    const r = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
                    testados.push(p);
                    // Como é no-cors, não dá pra ler status, mas se não der erro é porque existe
                    if (r.type === 'opaque') {
                        achados.push(p);
                        window.__X89.dbHunter.push({ url, path: p, tipo: 'HEAD 200 (provável)' });
                        console.log('%c🗄️ [DB HUNTER]', 'color:#f80;font-weight:bold', 'Possível:', url);
                    }
                } catch (e) {
                    // Não existe
                }
            }));
            // Pausa pra não parecer ataque
            await new Promise(r => setTimeout(r, 300));
        }

        console.log('%c🗄️ DB HUNTER terminou. Testados: ' + testados.length, 'color:#0fa');
        if (achados.length) {
            console.log('%c🗄️ Paths que responderam:', 'color:#f80;font-weight:bold', achados);
        }
    })();

    // ============ 10. HUD ============
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
                '⚡ X89 RECON v1.2\n' +
                '─────────────\n' +
                'Req:    ' + x.requests.length + '\n' +
                'Resp:   ' + x.responses.length + '\n' +
                'WS:     ' + x.websockets.length + '\n' +
                'Input:  ' + x.inputs.length + '\n' +
                'Form:   ' + x.forms.length + '\n' +
                'M3U8:   ' + x.m3u8.length + '\n' +
                'DB:     ' + x.dbHunter.length + '\n' +
                'Explic: ' + x.explicacoes.length + '\n' +
                'Ignor:  ' + x.ignored + '\n' +
                '─────────────\n' +
                'Tempo:  ' + uptime + 's\n' +
                '📺 X89modps';
        }, 1000);
    })();

    // ============ 11. COMANDOS ============
    window.x89 = {
        dump: function () {
            console.log('%c=== DUMP COMPLETO ===', 'color:#0ff;font-weight:bold');
            console.log(JSON.stringify(window.__X89, null, 2));
            return window.__X89;
        },
        m3u8: function () {
            console.log('%c=== M3U8 ===', 'color:#f0f;font-weight:bold');
            window.__X89.m3u8.forEach((u, i) => console.log(i + 1 + '.', u));
            return window.__X89.m3u8;
        },
        tokens: function () {
            console.log('%c=== TOKENS ===', 'color:#0f0;font-weight:bold');
            Object.entries(window.__X89.tokens).forEach(([k, v]) => {
                const exp = explicar(k, typeof v === 'object' ? JSON.stringify(v) : v);
                console.log(k, '=', v);
                if (exp) console.log('   └─ ' + exp);
            });
            return window.__X89.tokens;
        },
        db: function () {
            console.log('%c=== 🗄️ DB HUNTER ===', 'color:#f80;font-weight:bold');
            if (window.__X89.dbHunter.length === 0) {
                console.log('(nada encontrado)');
            } else {
                window.__X89.dbHunter.forEach((d, i) => {
                    console.log(i + 1 + '.', d.path, '→', d.url);
                });
            }
            return window.__X89.dbHunter;
        },
        explicacoes: function () {
            console.log('%c=== EXPLICAÇÕES ===', 'color:#0fa;font-weight:bold');
            window.__X89.explicacoes.forEach((e, i) => {
                console.log(i + 1 + '. [' + e.origem + '] ' + e.campo + ': ' + e.texto);
            });
            return window.__X89.explicacoes;
        },
        explicar: function (chave, valor) {
            const exp = explicar(chave, valor);
            console.log('%c' + chave + ':', 'color:#0f0;font-weight:bold', valor);
            console.log('%c   └─ ' + (exp || '(sem explicação)'), 'color:#0fa;font-style:italic');
            return exp;
        },
        scanDB: function () {
            console.log('%c🗄️ Iniciando scan de DB manual...', 'color:#f80');
            DB_PATHS.forEach(async p => {
                try {
                    const r = await fetch(location.origin + '/' + p, { method: 'HEAD' });
                    if (r.status < 400) {
                        console.log('%c🗄️ ACHOU!', 'color:#f80;font-weight:bold', p, '→ status', r.status);
                        window.__X89.dbHunter.push({ url: location.origin + '/' + p, path: p, status: r.status });
                    }
                } catch (e) {}
            });
        },
        save: function () {
            const blob = new Blob([JSON.stringify(window.__X89, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'x89_dump_' + Date.now() + '.json';
            a.click();
            console.log('%c[OK] Arquivo salvo', 'color:#0f0');
        },
        reset: function () {
            ['requests', 'responses', 'websockets', 'inputs', 'forms', 'm3u8', 'explicacoes', 'dbHunter'].forEach(k => {
                window.__X89[k] = [];
            });
            window.__X89.tokens = {};
            window.__X89.ignored = 0;
            console.log('%c[OK] Resetado', 'color:#0f0');
        },
        eruda: function () {
            try { eruda.show(); } catch (e) { console.error('Eruda não carregou'); }
        },
        addFiltro: function (d) {
            if (!d) return;
            IGNORAR.push(d.toLowerCase());
            console.log('%c[OK] Filtro:', 'color:#0f0', d);
        },
        help: function () {
            console.log(`
%c⚡ X89 RECON v1.2 - Comandos:
%c
  x89.dump()          -> Tudo capturado
  x89.m3u8()          -> Lista os .m3u8
  x89.tokens()        -> Tokens com explicação
  x89.db()            -> Resultados do DB Hunter
  x89.explicacoes()   -> Todas as explicações
  x89.explicar(k,v)   -> Explica uma chave
  x89.scanDB()        -> Scan manual de DB
  x89.save()          -> Baixa JSON com tudo
  x89.reset()         -> Limpa
  x89.eruda()         -> Abre Eruda
  x89.addFiltro(dom)  -> Adiciona filtro
  x89.help()          -> Essa ajuda
`,
                'color:#0ff;font-weight:bold;font-size:14px',
                'color:#0f0;font-family:monospace;font-size:13px'
            );
        }
    };

    console.log(
        '%c✅ X89 RECON v1.2 carregado!\n' +
        'Novidades: explicações automáticas + DB Hunter\n' +
        'Digite x89.help() pra ver os comandos.',
        'color:#0f0;font-weight:bold;font-size:13px'
    );

})();