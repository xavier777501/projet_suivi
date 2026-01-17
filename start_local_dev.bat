@echo off
echo ========================================
echo    DEMARRAGE ENVIRONNEMENT LOCAL
echo ========================================

echo.
echo 1. Verification du backend...
cd back
python -c "import requests; print('Backend OK' if requests.get('http://localhost:8000/docs').status_code == 200 else 'Backend KO')" 2>nul
if errorlevel 1 (
    echo ❌ Backend non demarré. Demarrage...
    start "Backend FastAPI" cmd /k "python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
    timeout /t 5 /nobreak >nul
) else (
    echo ✅ Backend déjà démarré
)

echo.
echo 2. Verification du compte DE...
python init_de_account.py

echo.
echo 3. Test de connexion DE...
python -c "
import requests
try:
    response = requests.post('http://localhost:8000/api/auth/login', json={'email': 'de@genielogiciel.com', 'mot_de_passe': 'admin123'})
    print('✅ Connexion DE OK' if response.status_code == 200 else '❌ Connexion DE KO')
except:
    print('❌ Impossible de tester la connexion')
"

echo.
echo 4. Demarrage du frontend...
cd ..\front-react
echo Configuration API: http://localhost:8000
start "Frontend React" cmd /k "npm run dev"

echo.
echo ========================================
echo   ENVIRONNEMENT LOCAL DEMARRE
echo ========================================
echo.
echo 🌐 Frontend: http://localhost:5173
echo 🔧 Backend API: http://localhost:8000
echo 📚 Documentation API: http://localhost:8000/docs
echo.
echo 👤 Identifiants DE:
echo    Email: de@genielogiciel.com
echo    Mot de passe: admin123
echo.
echo Appuyez sur une touche pour fermer...
pause >nul