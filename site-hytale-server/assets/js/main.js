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

