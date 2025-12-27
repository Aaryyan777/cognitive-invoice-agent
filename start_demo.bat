@echo off
echo [1/2] Starting Backend API...
start powershell -NoExit -Command "cd flowbit-memory-agent; npx ts-node src/server.ts"
timeout /t 5
echo [2/2] Starting Frontend Dashboard...
start powershell -NoExit -Command "cd flowbit-memory-agent/dashboard; npm run dev"
echo Done! Open http://localhost:5173 to see the dashboard.
