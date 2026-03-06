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