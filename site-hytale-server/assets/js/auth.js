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
                // const cap = await getCaptchaToken("register");
                await fetch("http://localhost:8080/auth/register", {
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