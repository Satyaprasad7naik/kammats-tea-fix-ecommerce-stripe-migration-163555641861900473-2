import re

with open('server/src/index.ts', 'r') as f:
    content = f.read()

# Add static file serving for uploads directory
if "express.static" not in content and "uploads" not in content:
    content = content.replace(
        "app.use(express.json());",
        "app.use(express.json());\nimport path from 'path';\napp.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));"
    )

with open('server/src/index.ts', 'w') as f:
    f.write(content)
