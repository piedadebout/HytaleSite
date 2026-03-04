# ChronosBR — Rodar Login/Cadastro (Windows)

## 1) Pré-requisitos
- Java 17 instalado (confirmar com `java -version`)
- (Opcional) Maven instalado. **Se seu `mvn` não funcionar no terminal**, use os scripts abaixo que já tentam achar o Maven.

## 2) Subir o Backend (API)
### Jeito mais fácil (recomendado)
Dê duplo-clique em:
- `start-backend.bat`

Ele:
- entra na pasta `backend-java`
- tenta rodar `mvn spring-boot:run`
- se não achar `mvn`, tenta `MAVEN_HOME` / `C:\Maven\...` automaticamente

### Pelo terminal
Abra um terminal na pasta do projeto e rode:
```powershell
cd backend-java
mvn spring-boot:run
```

Quando subir, você deve ver algo como:
`Tomcat started on port(s): 8080`

## 3) Testar no Site
Abra:
- `site-hytale-server/auth.html`

Cadastre e depois faça login.

## 4) Se der erro de porta 8080 em uso
Execute:
```powershell
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

## 5) Observação sobre CAPTCHA
Para você conseguir testar agora, o backend está com captcha desativado por padrão.
Depois a gente liga de novo com suas chaves.
Arquivo:
`backend-java/src/main/resources/application.properties`
