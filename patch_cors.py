import re

with open('server/src/index.ts', 'r') as f:
    content = f.read()

content = content.replace(
    "origin: process.env.FRONTEND_URL || 'http://localhost:5173',",
    "origin: ['http://localhost:5173', 'http://localhost:4173'],"
)

with open('server/src/index.ts', 'w') as f:
    f.write(content)
