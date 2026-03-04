console.log("🔥 main.js carregou");

// ============================
// ELEMENTOS BÁSICOS
// ============================
const menuBtn = document.getElementById("menuBtn");
const nav = document.getElementById("nav");
const year = document.getElementById("year");
const form = document.getElementById("contactForm");
const formMsg = document.getElementById("formMsg");

if (year) year.textContent = new Date().getFullYear();

if (menuBtn && nav) {
    menuBtn.addEventListener("click", () => {
        nav.classList.toggle("open");
    });

    document.querySelectorAll("#nav a").forEach((a) => {
        a.addEventListener("click", () => nav.classList.remove("open"));
    });
}

if (form) {
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const data = new FormData(form);
        const name = data.get("name") || "aventureiro";
        const msg = data.get("msg") || "";

        form.reset();
        if (formMsg) formMsg.textContent = `Valeu, ${name}! Sua mensagem foi enviada (simulação).`;
        console.log({ name, msg });
    });
}

const copyIpBtn = document.getElementById("copyIpBtn");
const serverIp = document.getElementById("serverIp");

if (copyIpBtn && serverIp) {
    copyIpBtn.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(serverIp.textContent.trim());
            copyIpBtn.textContent = "Copiado!";
            setTimeout(() => (copyIpBtn.textContent = "Copiar"), 1200);
        } catch {
            copyIpBtn.textContent = "Falhou";
            setTimeout(() => (copyIpBtn.textContent = "Copiar"), 1200);
        }
    });
}

// ============================
// NAV ATIVO POR SCROLL (Hytale)
// - destaca o link atual conforme você rola a página
// - não quebra o menu mobile
// ============================
(() => {
    if (!nav) return;

    const links = Array.from(nav.querySelectorAll("a[href^='#']"));
    const sectionIds = links
        .map((a) => a.getAttribute("href"))
        .filter(Boolean)
        .map((h) => h.replace("#", ""))
        .filter((id) => id.length > 0);

    const sections = sectionIds
        .map((id) => document.getElementById(id))
        .filter(Boolean);

    if (!links.length || !sections.length) return;

    const setActiveById = (id) => {
        links.forEach((a) => {
            const hrefId = a.getAttribute("href")?.replace("#", "");
            a.classList.toggle("active", hrefId === id);
        });
    };

    const getCurrentSectionId = () => {
        // offset pra considerar topbar
        const y = window.scrollY + 110;

        // se estiver no topo, remove ativo ou deixa o primeiro
        if (window.scrollY < 40) return sections[0]?.id;

        let current = sections[0].id;

        for (const s of sections) {
            const top = s.offsetTop;
            const bottom = top + s.offsetHeight;

            if (y >= top && y < bottom) {
                current = s.id;
                break;
            }
        }

        return current;
    };

    let ticking = false;
    const onScroll = () => {
        if (ticking) return;
        ticking = true;

        requestAnimationFrame(() => {
            setActiveById(getCurrentSectionId());
            ticking = false;
        });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();
})();

// ============================
// STATUS FAKE (ONLINE/OFFLINE)
// ============================
(() => {
    const statusText = document.getElementById("statusText");
    const statusRow = document.querySelector(".statusCard .statusRow");
    const dot = document.querySelector(".statusCard .dot");
    const badge = document.querySelector(".statusCard .statusBadge");

    if (!statusRow) return;

    function setStatus(isOnline) {
        if (dot) dot.classList.toggle("online", isOnline);

        const line = statusRow.querySelector("span:last-child");
        if (line) {
            line.innerHTML = `Servidor: <strong>${isOnline ? "online" : "indisponível"}</strong>`;
        }

        if (statusText) {
            statusText.textContent = isOnline ? "IP do servidor (online):" : "IP do servidor:";
        }

        if (badge) {
            badge.textContent = isOnline ? "SEASON 1" : "OFFLINE";
        }
    }

    // começa offline e alterna (fake)
    let online = false;
    setStatus(online);

    setInterval(() => {
        online = !online;
        setStatus(online);
    }, 12000);
})();

// =========================================================
// FIRE SPARKS (Canvas) — REALISTA + NÃO ATRAPALHA LEITURA
// - Fica atrás do conteúdo (cards/texto), então não “passa por cima”
// - Mais sutil, partículas pequenas, menos “bolotas”
// - Foco nas bordas e parte de baixo, menos no centro
// =========================================================
(() => {
    "use strict";

    const isAuthPage = document.body.classList.contains("authPage");

    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const isMobile = matchMedia?.("(max-width: 720px)")?.matches ?? false;

    const CONFIG = {
        enabled: true,

        // intensidade geral (0.6 bem leve, 1 padrão)
        intensity: prefersReducedMotion ? 0.35 : (isMobile ? (isAuthPage ? 0.55 : 0.85) : (isAuthPage ? 0.65 : 1.00)),

        // Partículas por segundo (já ajustado para não poluir)
        baseSpawnRate: prefersReducedMotion ? 12 : (isMobile ? (isAuthPage ? 18 : 26) : (isAuthPage ? 22 : 30)),

        // Teto de partículas
        maxParticles: prefersReducedMotion ? 45 : (isMobile ? (isAuthPage ? 80 : 120) : (isAuthPage ? 110 : 150)),

        // Aparência (mais realista)
        core: "rgba(255, 220, 150, 0.95)",
        glow: "rgba(255, 140, 60, 0.28)",
        ember: "rgba(255, 120, 60, 0.16)",

        // Física
        gravity: -18,           // sobe
        drag: 0.988,
        windStrength: 7,        // bem suave
        swirl: 0.65,

        // Vida e tamanho (menor = mais realista)
        lifeSec: [0.65, 1.45],
        radiusPx: [0.5, 1.6],
        glowMul: 6.0,

        // “Evitar texto”: reduz densidade no centro do viewport
        avoidCenter: true,
        centerSafeRadius: 0.36, // 0.36 = 36% do menor lado do viewport

        // “Spawn”: mais nas bordas e embaixo (área vazia)
        spawnBottomFromPx: 18,
        edgeBias: 0.72,         // 0..1 (quanto maior, mais nas bordas)

        // performance
        autoReduceOnSlow: true,
    };

    if (!CONFIG.enabled) return;

    // cria canvas overlay (atrás do conteúdo)
    const canvas = document.createElement("canvas");
    canvas.id = "fireSparksCanvas";
    canvas.setAttribute("aria-hidden", "true");

    Object.assign(canvas.style, {
        position: "fixed",
        inset: "0",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: "1",          // IMPORTANTE: fica entre fundo (0) e conteúdo (2)
        mixBlendMode: "screen",
        opacity: "1",
    });

    const mount = () => {
        const body = document.body;
        if (!body) return false;
        body.appendChild(canvas);
        return true;
    };

    if (!mount()) {
        document.addEventListener("DOMContentLoaded", () => mount(), { once: true });
    }

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0;

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = Math.floor(window.innerWidth);
        h = Math.floor(window.innerHeight);
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    window.addEventListener("resize", resize, { passive: true });
    resize();

    // helpers
    const particles = [];
    const rand = (min, max) => min + Math.random() * (max - min);
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    function biasedEdgeX() {
        const u = Math.random();
        const edge = Math.random() < 0.5 ? Math.pow(u, 1.8) : 1 - Math.pow(u, 1.8);
        const mix = CONFIG.edgeBias;
        return (1 - mix) * u + mix * edge;
    }

    function spawnParticle(extraBoost = 0) {
        const x = biasedEdgeX() * w;
        const y = h - CONFIG.spawnBottomFromPx;

        const speedUp = rand(90, 170) * (0.85 + CONFIG.intensity * 0.25) + extraBoost;
        const angle = rand(-Math.PI * 0.62, -Math.PI * 0.38);
        const vx = Math.cos(angle) * rand(8, 45);
        const vy = Math.sin(angle) * speedUp;

        const life = rand(CONFIG.lifeSec[0], CONFIG.lifeSec[1]);
        const r = rand(CONFIG.radiusPx[0], CONFIG.radiusPx[1]) * (0.9 + CONFIG.intensity * 0.18);

        particles.push({
            x, y, vx, vy,
            life, age: 0,
            r,
            seed: Math.random() * 1000,
            flick: rand(0.9, 1.15),
        });
    }

    let spawnRate = CONFIG.baseSpawnRate * CONFIG.intensity;
    let maxP = CONFIG.maxParticles;

    let last = performance.now();
    let acc = 0;
    let windT = 0;

    let fpsSamples = [];
    let slowMode = false;

    const centerSafe = () => {
        const minSide = Math.min(w, h);
        return minSide * CONFIG.centerSafeRadius;
    };

    function tick(now) {
        const dt = Math.min((now - last) / 1000, 0.033);
        last = now;

        const fps = 1 / Math.max(dt, 0.00001);
        fpsSamples.push(fps);
        if (fpsSamples.length > 40) fpsSamples.shift();
        const avgFps = fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length;

        if (CONFIG.autoReduceOnSlow) {
            if (!slowMode && avgFps < 45) {
                slowMode = true;
                spawnRate *= 0.7;
                maxP = Math.floor(maxP * 0.75);
            } else if (slowMode && avgFps > 56) {
                slowMode = false;
                spawnRate = CONFIG.baseSpawnRate * CONFIG.intensity;
                maxP = CONFIG.maxParticles;
            }
        }

        acc += dt * spawnRate;
        while (acc >= 1) {
            acc -= 1;
            if (particles.length < maxP) spawnParticle();
        }

        ctx.clearRect(0, 0, w, h);

        ctx.save();
        ctx.globalCompositeOperation = "lighter";

        windT += dt;
        const wind = Math.sin(windT * 0.7) * CONFIG.windStrength;

        const cx = w / 2;
        const cy = h / 2;
        const safeR = CONFIG.avoidCenter ? centerSafe() : 0;

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.age += dt;

            if (p.age >= p.life) {
                particles.splice(i, 1);
                continue;
            }

            const t = p.age / p.life;
            const easeOut = 1 - Math.pow(t, 2.2);
            let alpha = clamp(easeOut, 0, 1);

            if (CONFIG.avoidCenter) {
                const dx = p.x - cx;
                const dy = p.y - cy;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < safeR) {
                    const k = clamp((d / safeR), 0, 1);
                    alpha *= (0.15 + 0.85 * k);
                }
            }

            const swirl = Math.sin((p.seed + p.age * 9.0) * CONFIG.swirl) * 0.55;

            p.vx += (wind * 0.10 + swirl) * dt;
            p.vy += CONFIG.gravity * dt;
            p.vx *= CONFIG.drag;
            p.vy *= CONFIG.drag;

            p.x += p.vx * dt;
            p.y += p.vy * dt;

            const coreR = p.r * (0.9 + Math.sin((p.seed + p.age * 16) * p.flick) * 0.07);
            const glowR = coreR * CONFIG.glowMul;

            ctx.globalAlpha = alpha * 0.30;
            ctx.fillStyle = CONFIG.glow;
            ctx.beginPath();
            ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = alpha * 0.85;
            ctx.fillStyle = CONFIG.core;
            ctx.beginPath();
            ctx.arc(p.x, p.y, coreR, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = alpha * 0.16;
            ctx.fillStyle = CONFIG.ember;
            ctx.beginPath();
            ctx.arc(p.x - p.vx * 0.02, p.y - p.vy * 0.02, coreR * 2.0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
        requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);

    window.FireSparks = {
        setIntensity(v) {
            CONFIG.intensity = clamp(Number(v) || 1, 0, 3);
            spawnRate = CONFIG.baseSpawnRate * CONFIG.intensity;
            maxP = CONFIG.maxParticles;
        },
        stop() {
            canvas.remove();
        },
    };
})();


// ============================
// AUTH PAGE (auth.html)
// - Página dedicada para login/cadastro
// - Se backend existir: usa /api/auth/* e /oauth2/authorization/google
// ============================
(() => {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const tabLogin = document.getElementById("tabLogin");
    const tabRegister = document.getElementById("tabRegister");
    const authMsg = document.getElementById("authMsg");
    const googleBtn = document.getElementById("googleBtn");

    // se não estiver na auth.html, sai
    if (!loginForm && !registerForm) return;

    const API_BASE = (window.__API_BASE__ ?? "").toString().replace(/\/$/, "");

    const setMsg = (txt, ok = false) => {
        if (!authMsg) return;
        authMsg.textContent = txt || "";
        authMsg.style.color = ok ? "rgba(180, 255, 210, .95)" : "rgba(255, 190, 190, .95)";
    };

    const setTab = (mode) => {
        const isLogin = mode === "login";
        if (tabLogin) tabLogin.classList.toggle("active", isLogin);
        if (tabRegister) tabRegister.classList.toggle("active", !isLogin);
        if (loginForm) loginForm.hidden = !isLogin;
        if (registerForm) registerForm.hidden = isLogin;
        setMsg("");
    };

    const api = async (path, options = {}) => {
        const url = `${API_BASE}${path}`;
        const res = await fetch(url, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {}),
            },
            credentials: "include",
        });

        const ct = res.headers.get("content-type") || "";
        const data = ct.includes("application/json") ? await res.json().catch(() => ({})) : await res.text();

        if (!res.ok) {
            const msg = (data && data.message) ? data.message : (typeof data === "string" ? data : "Erro na requisição");
            throw new Error(msg);
        }
        return data;
    };

    const isNickValid = (nick) => /^[A-Za-z0-9_]{3,16}$/.test(nick);

    const captchaCfg = window.__CAPTCHA__ || { enabled: false };

    // ============================
    // CAPTCHA (reCAPTCHA v3 / Invisible v2 | hCaptcha Invisible)
    // ============================
    let hcWidgets = { login: null, register: null };
    let hcPending = null;

    window.initHCaptcha = function () {
        try {
            if (!captchaCfg?.enabled || captchaCfg?.provider !== "hcaptcha") return;
            if (!window.hcaptcha) return;

            const siteKey = captchaCfg?.hcaptcha?.siteKey || "";
            if (!siteKey || siteKey.includes("COLOQUE_")) return;

            const loginBox = document.getElementById("hcLogin");
            const regBox = document.getElementById("hcRegister");

            if (loginBox && hcWidgets.login === null) {
                hcWidgets.login = hcaptcha.render(loginBox, {
                    sitekey: siteKey,
                    size: "invisible",
                    callback: (token) => {
                        if (hcPending) { hcPending.resolve(token); hcPending = null; }
                    },
                    "error-callback": () => {
                        if (hcPending) { hcPending.reject(new Error("Falha na verificação (hCaptcha).")); hcPending = null; }
                    },
                    "expired-callback": () => {}
                });
            }

            if (regBox && hcWidgets.register === null) {
                hcWidgets.register = hcaptcha.render(regBox, {
                    sitekey: siteKey,
                    size: "invisible",
                    callback: (token) => {
                        if (hcPending) { hcPending.resolve(token); hcPending = null; }
                    },
                    "error-callback": () => {
                        if (hcPending) { hcPending.reject(new Error("Falha na verificação (hCaptcha).")); hcPending = null; }
                    },
                    "expired-callback": () => {}
                });
            }
        } catch (e) {
            // silencioso: captcha é opcional visualmente
        }
    };

    const ensureRecaptchaScriptKey = () => {
        const sk = captchaCfg?.recaptcha?.siteKey || "";
        const tag = document.getElementById("recaptchaScript");
        if (!tag) return;
        if (!sk || sk.includes("COLOQUE_")) return;
        const want = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(sk)}`;
        if (tag.getAttribute("src") !== want) tag.setAttribute("src", want);
    };

    const getCaptchaToken = async (action) => {
        if (!captchaCfg?.enabled) return { token: null, provider: null, action: null };

        const provider = (captchaCfg?.provider || "").toLowerCase();

        // reCAPTCHA
        if (provider === "recaptcha") {
            const siteKey = captchaCfg?.recaptcha?.siteKey || "";
            const mode = (captchaCfg?.recaptcha?.mode || "v3").toLowerCase();

            if (!siteKey || siteKey.includes("COLOQUE_")) {
                throw new Error("Captcha não configurado (reCAPTCHA siteKey).");
            }

            ensureRecaptchaScriptKey();

            // v3 (invisível por padrão)
            if (mode === "v3") {
                if (!window.grecaptcha) throw new Error("reCAPTCHA ainda não carregou.");
                const token = await new Promise((resolve, reject) => {
                    window.grecaptcha.ready(() => {
                        window.grecaptcha.execute(siteKey, { action })
                            .then(resolve)
                            .catch(() => reject(new Error("Falha na verificação (reCAPTCHA).")));
                    });
                });
                return { token, provider: "recaptcha", action };
            }

            // Invisible v2
            // Requer render() e callback. Aqui usamos v3 por padrão.
            throw new Error("Modo reCAPTCHA não suportado no front (use v3).");
        }

        // hCaptcha (invisible)
        if (provider === "hcaptcha") {
            const siteKey = captchaCfg?.hcaptcha?.siteKey || "";
            if (!siteKey || siteKey.includes("COLOQUE_")) {
                throw new Error("Captcha não configurado (hCaptcha siteKey).");
            }
            if (!window.hcaptcha) throw new Error("hCaptcha ainda não carregou.");

            // garante que os widgets existam
            if (hcWidgets.login === null || hcWidgets.register === null) window.initHCaptcha();

            const widgetId = action === "register" ? hcWidgets.register : hcWidgets.login;
            if (widgetId === null || widgetId === undefined) throw new Error("hCaptcha não inicializado.");

            const token = await new Promise((resolve, reject) => {
                hcPending = { resolve, reject };
                try {
                    window.hcaptcha.execute(widgetId);
                    setTimeout(() => {
                        if (hcPending) { hcPending.reject(new Error("Tempo esgotado na verificação (hCaptcha).")); hcPending = null; }
                    }, 30000);
                } catch (e) {
                    hcPending = null;
                    reject(new Error("Falha ao iniciar hCaptcha."));
                }
            });

            try { window.hcaptcha.reset(widgetId); } catch (e) {}
            return { token, provider: "hcaptcha", action };
        }

        throw new Error("Captcha provider inválido.");
    };


    if (tabLogin) tabLogin.addEventListener("click", () => setTab("login"));
    if (tabRegister) tabRegister.addEventListener("click", () => setTab("register"));

    // default
    setTab("login");

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const fd = new FormData(loginForm);
            const login = String(fd.get("login") || "").trim();
            const password = String(fd.get("password") || "");

            if (!login || !password) {
                setMsg("Preenche usuário/e-mail e senha.");
                return;
            }

            try {
                setMsg("Entrando...", true);
                const cap = await getCaptchaToken("login");
                await api("/api/auth/login", {
                    method: "POST",
                    body: JSON.stringify({
                        ...{ login, password },
                        captchaToken: cap.token,
                        captchaProvider: cap.provider,
                        captchaAction: cap.action,
                    }),
                });

                // volta pro site e abre o painel (se existir)
                window.location.href = "./index.html#painel";
            } catch (err) {
                setMsg(err?.message || "Falha no login.");
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const fd = new FormData(registerForm);
            const username = String(fd.get("username") || "").trim(); // nick do Hytale
            const email = String(fd.get("email") || "").trim();
            const password = String(fd.get("password") || "");

            if (!username || !email || !password) {
                setMsg("Preenche nick do Hytale, e-mail e senha.");
                return;
            }

            if (!isNickValid(username)) {
                setMsg("Nick inválido. Use 3-16 caracteres: letras, números ou _");
                return;
            }

            try {
                setMsg("Criando conta...", true);
                const cap = await getCaptchaToken("register");
                await api("/api/auth/register", {
                    method: "POST",
                    body: JSON.stringify({
                        ...{ username, email, password },
                        captchaToken: cap.token,
                        captchaProvider: cap.provider,
                        captchaAction: cap.action,
                    }),
                });

                // login automático
                await api("/api/auth/login", {
                    method: "POST",
                    body: JSON.stringify({ login: email, password }),
                });

                window.location.href = "./index.html#painel";
            } catch (err) {
                setMsg(err?.message || "Falha ao cadastrar.");
            }
        });
    }

    if (googleBtn) {
        googleBtn.addEventListener("click", (e) => {
            e.preventDefault();
            // deixa pronto pro backend depois
            window.location.href = `${API_BASE}/oauth2/authorization/google`;
        });
    }
})();


// ============================
// TRANSIÇÕES (Página/Scroll) — Hytale
// ============================

(() => {
    "use strict";

    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    // cria overlays sem depender de HTML
    const ensureEl = (id) => {
        let el = document.getElementById(id);
        if (!el) {
            el = document.createElement("div");
            el.id = id;
            el.setAttribute("aria-hidden", "true");
            document.body.appendChild(el);
        }
        return el;
    };

    const isSameOrigin = (url) => {
        try { return new URL(url, location.href).origin === location.origin; }
        catch { return false; }
    };

    // ---------- Page Transition ----------
    const initPageTransition = () => {
        if (prefersReducedMotion) return;

        ensureEl("pageTransition");

        // entrada: mostra e some (bem rápido, premium)
        document.body.classList.add("pt-load");
        setTimeout(() => document.body.classList.remove("pt-load"), 650);

        // saída: intercepta links para outra página do site (html)
        document.addEventListener("click", (e) => {
            const a = e.target?.closest?.("a[href]");
            if (!a) return;

            // não intercepta: nova aba, download, target, âncoras na mesma página, ou externos
            if (a.hasAttribute("download")) return;
            if (a.target && a.target !== "_self") return;
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

            const href = a.getAttribute("href");
            if (!href || href.startsWith("#")) return;
            if (!isSameOrigin(a.href)) return;

            const u = new URL(a.href, location.href);
            const samePage = u.pathname === location.pathname;

            // se for só hash na mesma página, deixa rolar normal
            if (samePage && u.hash) return;

            // só anima quando troca de página
            if (u.pathname === location.pathname) return;

            e.preventDefault();

            ensureEl("pageTransition");
            document.body.classList.add("pt-active");

            // pequena janela pra animação “pegar”
            const delay = 620;

            setTimeout(() => {
                location.href = u.href;
            }, delay);
        }, { capture: true });
    };

    // ---------- Scroll Warp ----------
    const initScrollWarp = () => {
        if (prefersReducedMotion) return;

        ensureEl("scrollTransition");

        let lastY = window.scrollY;
        let lastT = performance.now();
        let timer = null;

        const trigger = () => {
            document.body.classList.add("scroll-warp");
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => document.body.classList.remove("scroll-warp"), 360);
        };

        window.addEventListener("scroll", () => {
            const now = performance.now();
            const y = window.scrollY;

            const dy = Math.abs(y - lastY);
            const dt = Math.max(now - lastT, 1);

            // velocidade aproximada (px/ms)
            const v = dy / dt;

            // thresholds: scroll “rápido”
            if (dy > 220 && dt < 180) trigger();
            else if (v > 2.0 && dy > 120) trigger();

            lastY = y;
            lastT = now;
        }, { passive: true });
    };

    // boot (garante body pronto)
    const boot = () => {
        try {
            // initPageTransition(); // desativado (pedido)
            initScrollWarp();
        } catch (err) {
            // não quebra nada do site em caso de erro
            console.warn("Transições: falha ao iniciar", err);
        }
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot, { once: true });
    } else {
        boot();
    }
})();


// ============================
// SCROLL REVEAL (IntersectionObserver)
// - Ao descer: aparece
// - Ao subir: some (remove classe quando sai do viewport)
// ============================
(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduce) return; // CSS já garante tudo visível

    // Seletores do que deve “revelar”
    const selectors = [
        ".hero__inner > *",
        ".section",
        ".card",
        ".vipPlan",
        ".social-link",
        ".staff",
        ".chip",
        ".ipBox",
        ".statusRow",
        ".faqItem",
        ".footer__grid > *"
    ];

    const nodes = new Set();
    selectors.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => nodes.add(el));
    });

    // Não aplicar em elementos do topo que devem ficar sempre “prontos”
    const blacklist = [
        ".topbar",
        ".topbar *",
    ];

    const isBlacklisted = (el) => {
        return blacklist.some((b) => el.matches?.(b));
    };

    // Aplica classe base
    const arr = Array.from(nodes).filter((el) => el && !isBlacklisted(el));

    // Alterna variações para grids (esquerda/direita) de forma automática
    let gridIndex = 0;
    arr.forEach((el) => {
        // evita colocar reveal em elementos que já são “containers” vazios
        if (el.classList.contains("reveal")) return;

        el.classList.add("reveal");

        // Itens pequenos ganham “pop”
        if (el.classList.contains("chip") || el.classList.contains("faqItem")) {
            el.classList.add("reveal--pop");
            return;
        }

        // Alterna esquerda/direita para dar dinâmica
        if (el.classList.contains("card") || el.classList.contains("vipPlan") || el.classList.contains("social-link")) {
            el.classList.add((gridIndex++ % 2 === 0) ? "reveal--left" : "reveal--right");
        }
    });

    const io = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            const el = entry.target;
            if (entry.isIntersecting) {
                el.classList.add("reveal--in");
            } else {
                // some ao sair da viewport (subindo ou descendo)
                el.classList.remove("reveal--in");
            }
        }
    }, {
        threshold: 0.15,
        rootMargin: "-10% 0px -10% 0px"
    });

    arr.forEach((el) => io.observe(el));
})();


// ============================
// REVEAL ON SCROLL (IntersectionObserver)
// ============================
(function initRevealOnScroll() {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    // Se o navegador não suportar, mostra tudo
    if (!("IntersectionObserver" in window)) {
        items.forEach(el => el.classList.add("is-visible"));
        return;
    }

    const io = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
            } else {
                entry.target.classList.remove("is-visible");
            }
        });
    }, {
        threshold: 0.18,
        rootMargin: "0px 0px -10% 0px"
    });

    items.forEach(el => io.observe(el));
})();



// ============================
// CAPTCHA ANTI-ROBO
// ============================

let captchaAnswer = 0;

function generateCaptcha() {
    const n1 = Math.floor(Math.random() * 10) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    captchaAnswer = n1 + n2;

    const question = document.getElementById("captchaQuestion");
    if (question) {
        question.textContent = "Verificação: quanto é " + n1 + " + " + n2 + " ?";
    }
}

document.addEventListener("DOMContentLoaded", () => {

    generateCaptcha();

    const forms = document.querySelectorAll("form");

    forms.forEach(form => {
        form.addEventListener("submit", function(e) {

            const input = document.getElementById("captchaInput");
            if (!input) return;

            if (parseInt(input.value) !== captchaAnswer) {
                e.preventDefault();
                alert("Verificação incorreta. Tente novamente.");
                generateCaptcha();
                input.value = "";
            }
        });
    });
});

