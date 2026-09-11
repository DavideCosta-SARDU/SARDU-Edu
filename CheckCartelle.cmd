@echo off
setlocal
cd /d "%~dp0"

set "OUT=ListaCartelle-SARDU-EDU.txt"

echo Cartella principale: %CD% > "%OUT%"
echo. >> "%OUT%"

powershell.exe -NoProfile -Command ^
 "$root=(Get-Location).Path; Get-ChildItem -Directory | Sort-Object Name | ForEach-Object { $_.Name; Get-ChildItem -LiteralPath $_.FullName -Directory -ErrorAction SilentlyContinue | Sort-Object Name | ForEach-Object { '    ' + $_.Name } }" >> "%OUT%"

echo.
echo FATTO
echo Creato: %OUT%
echo.
pause