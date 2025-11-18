@echo off
echo ========================================
echo Installation Alliance Courtage Mobile
echo ========================================
echo.

echo [1/3] Installation des dependances Node.js...
call npm install
if errorlevel 1 (
    echo ERREUR: Installation npm a echoue
    pause
    exit /b 1
)

echo.
echo [2/3] Installation d'Expo (pour tester sur iPhone sans Mac)...
call npm install -g expo-cli
call npm install expo
call npx expo install

echo.
echo [3/3] Configuration terminee!
echo.
echo ========================================
echo Prochaines etapes:
echo ========================================
echo.
echo 1. Installer Expo Go sur votre iPhone (App Store)
echo 2. Trouver l'IP de votre PC: ipconfig
echo 3. Modifier mobile-app/src/api/config.ts avec votre IP
echo 4. Demarrer le backend: cd backend && npm start
echo 5. Demarrer Expo: cd mobile-app && npx expo start
echo 6. Scanner le QR code avec Expo Go sur iPhone
echo.
pause




