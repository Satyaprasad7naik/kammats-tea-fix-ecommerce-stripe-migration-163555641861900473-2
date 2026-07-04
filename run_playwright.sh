#!/bin/bash
cd server && npm run dev &
SERVER_PID=$!
sleep 5
cd ../client && npm run dev -- --port 4173 &
CLIENT_PID=$!
sleep 15
cd .. && npx playwright test > test_output.log 2>&1
echo "Playwright exited with $?"
cat test_output.log
kill $SERVER_PID
kill $CLIENT_PID
