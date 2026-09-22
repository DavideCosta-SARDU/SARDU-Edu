@echo off
setlocal
cd /d "%~dp0"

set "OUT=ListaFiles-SARDU-EDU.txt"

echo Creazione lista file SARDU-Block...
echo Esclusione di tutte le cartelle node_modules...
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
 "$root=(Get-Location).Path; " ^
 "Get-ChildItem -LiteralPath $root -Recurse -File -ErrorAction SilentlyContinue | " ^
 "Where-Object { $_.FullName -notmatch '\\node_modules\\' } | " ^
 "Sort-Object FullName | " ^
 "ForEach-Object { $_.FullName.Substring($root.Length + 1) } | " ^
 "Set-Content -Encoding UTF8 '%OUT%'"

echo.
echo FATTO
echo Creato: %OUT%
echo.
pause
