@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0backend-java"

REM 1) Tenta usar mvn do PATH
where mvn >nul 2>&1
if %errorlevel%==0 (
  echo [ChronosBR] Usando Maven do PATH...
  mvn spring-boot:run
  goto :eof
)

REM 2) Tenta MAVEN_HOME
if not "%MAVEN_HOME%"=="" (
  if exist "%MAVEN_HOME%\bin\mvn.cmd" (
    echo [ChronosBR] Usando Maven do MAVEN_HOME...
    "%MAVEN_HOME%\bin\mvn.cmd" spring-boot:run
    goto :eof
  )
)

REM 3) Tenta caminhos comuns (C:\Maven\...\bin\mvn.cmd)
for /d %%D in ("C:\Maven\*") do (
  if exist "%%D\bin\mvn.cmd" (
    echo [ChronosBR] Usando Maven encontrado em: %%D
    "%%D\bin\mvn.cmd" spring-boot:run
    goto :eof
  )
  REM Alguns usuários extraem como C:\Maven\apache-maven-3.9.12-bin\apache-maven-3.9.12\bin
  for /d %%E in ("%%D\*") do (
    if exist "%%E\bin\mvn.cmd" (
      echo [ChronosBR] Usando Maven encontrado em: %%E
      "%%E\bin\mvn.cmd" spring-boot:run
      goto :eof
    )
  )
)

echo.
echo [ChronosBR] ERRO: Nao encontrei o Maven (mvn).
echo 1) Verifique se o Maven esta instalado, OU
echo 2) Defina a variavel MAVEN_HOME apontando para a pasta do Maven, OU
echo 3) Instale o Maven em C:\Maven\...
echo.
pause
exit /b 1
