# HytaleSite — ChronosBR

Site temático inspirado em **Hytale**, com **frontend (HTML/CSS/JS)** e **backend Java (Spring Boot)** para **login/cadastro**.

> Estrutura do projeto fica dentro da pasta **`ChronosBR/`**.

---

## ✅ Status

![repo](https://img.shields.io/badge/status-em%20desenvolvimento-blue)
![stack](https://img.shields.io/badge/stack-HTML%2FCSS%2FJS%20%2B%20Java%20(Spring%20Boot)-informational)
![auth](https://img.shields.io/badge/auth-JWT%20(HttpOnly%20Cookie)-success)

---

## 🧭 O que tem no repositório

📁 **`ChronosBR/site-hytale-server/`**  
Frontend do site (inclui `index.html` e `auth.html`).

📁 **`ChronosBR/backend-java/`**  
Backend Java (Spring Boot) com endpoints de autenticação + banco H2 local.

📄 **`ChronosBR/README_RODAR_LOGIN.md`**  
Guia rápido para rodar o login no Windows.

📜 Scripts:
- `ChronosBR/start-backend.bat`
- `ChronosBR/start-backend.ps1`

---

## ✨ Destaques

- Visual e atmosfera “fantasy premium” inspirado em Hytale
- Tela de autenticação pronta para testes (`auth.html`)
- Backend com:
  - cadastro e login
  - JWT armazenado em **cookie HttpOnly**
  - banco H2 local (arquivo)

---

## 🖼️ Preview

> Coloque prints aqui pra ficar bem “vitrine”.
> Crie uma pasta `docs/` na raiz e suba as imagens.

Exemplo:
- `docs/preview-home.png`
- `docs/preview-auth.png`

Depois descomente:

<!--
![Home](docs/preview-home.png)
![Auth](docs/preview-auth.png)
-->

---

## ▶️ Rodando rápido (Windows)

1) Suba o backend:
- vá em `ChronosBR/`
- execute `start-backend.bat` (ou `start-backend.ps1`)

2) Abra o frontend:
- `ChronosBR/site-hytale-server/auth.html`

Backend padrão:
- `http://localhost:8080`

Guia completo:
- `ChronosBR/README_RODAR_LOGIN.md`

---

## 🔗 Estrutura (atalhos)

- Frontend: `ChronosBR/site-hytale-server/`
- Backend: `ChronosBR/backend-java/`

---

## 🗺️ Roadmap (ideias)

- [ ] Melhorar responsividade (mobile)
- [ ] Animações ao rolar a página
- [ ] Loja / planos VIP no frontend
- [ ] Rotas protegidas (painel VIP, histórico, etc.)
- [ ] Deploy com reverse proxy (Nginx/Apache)

---

## 📄 Licença

Para qualquer tipo de uso, favor comunica antes.

---

## 👤 Autor

Fabiano — `piedadebout`
