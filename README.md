# Backend Java (Login/Cadastro) - ChronosBR

Esse backend expõe endpoints de autenticação em **/api/auth/** e grava usuários em um banco **H2** (arquivo local).
A sessão é feita via **JWT em cookie HttpOnly** (ou seja: o JS do navegador não consegue ler o token).

## Requisitos
- Java 17+
- Maven

## Rodar (dev)
No terminal, dentro da pasta `backend-java`:

```bash
# (Windows PowerShell)
$env:JWT_SECRET="coloque-um-segredo-bem-grande-aqui"
mvn spring-boot:run

# (Windows CMD)
set JWT_SECRET=coloque-um-segredo-bem-grande-aqui
mvn spring-boot:run
```

Backend sobe em: `http://localhost:8080`

## Frontend
O site chama por padrão:
- `http://localhost:8080/api/auth/*` (se você definir `window.__API_BASE__`)
- ou `/api/auth/*` (se você hospedar o site junto do backend / reverse proxy)

No `index.html`, você pode (opcional) configurar:

```html
<script>
  window.__API_BASE__ = "http://localhost:8080";
</script>
```

## Endpoints
- POST `/api/auth/register` { username, email, password }
- POST `/api/auth/login` { login, password }
- POST `/api/auth/logout`
- GET  `/api/auth/me`

## Observação importante (F12)
Não dá pra “esconder” HTML/CSS/JS do usuário no navegador: tudo que roda no client pode ser visto.
O que dá pra proteger é **segredo e regra**: JWT secret, hash de senha, validações e permissões ficam no backend.
