import re

with open('server/src/index.ts', 'r') as f:
    content = f.read()

if "import { startBackgroundWorker } from './utils/worker';" not in content:
    content = content.replace(
        "const PORT = process.env.PORT || 5000;",
        "const PORT = process.env.PORT || 5000;\nimport { startBackgroundWorker } from './utils/worker';\nstartBackgroundWorker();"
    )

with open('server/src/index.ts', 'w') as f:
    f.write(content)
