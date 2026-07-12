@echo off
echo Starting backend (FastAPI)...

start "Backend Server" cmd /k "cd /d "%~dp0backend" && call venv\Scripts\activate && uvicorn main:app --reload"

echo Waiting for backend to boot up...
timeout /t 3 /nobreak > nul

echo Starting frontend...
start "Frontend Server" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo Done. Backend and frontend are running in separate windows.