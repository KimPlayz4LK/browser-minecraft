@echo off
echo Installing modules...
call npm install
echo Press any key to start the server.
pause
echo Starting server for localhost...
call node localhostServer.js
pause