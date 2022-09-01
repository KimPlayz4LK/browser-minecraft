@echo off
echo Installing modules...
npm install
echo Press any key to start the server.
pause
echo Starting server for localhost...
node localhostServer.js
pause