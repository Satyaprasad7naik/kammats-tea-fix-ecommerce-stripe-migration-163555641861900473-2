#!/bin/bash
kill $(lsof -t -i :5000) 2>/dev/null || true
kill $(lsof -t -i :5173) 2>/dev/null || true

cd server && npm run dev &
SERVER_PID=$!
sleep 5

cd ../client && npm run dev &
CLIENT_PID=$!
sleep 15

cd ..
npx playwright test --reporter=line
echo "Playwright exited with $?"

kill $SERVER_PID
kill $CLIENT_PID
