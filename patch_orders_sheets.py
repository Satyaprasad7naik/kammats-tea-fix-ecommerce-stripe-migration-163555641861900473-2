import re

with open('server/src/routes/orders.ts', 'r') as f:
    content = f.read()

# Add import for appendOrderRow
if "import { appendOrderRow }" not in content:
    content = content.replace(
        "import { sendCustomerConfirmationEmail, sendAdminNotificationEmail } from '../utils/communications';",
        "import { sendCustomerConfirmationEmail, sendAdminNotificationEmail } from '../utils/communications';\nimport { appendOrderRow } from '../utils/sheets';"
    )

# Add appendOrderRow call in the background task
if "await appendOrderRow(orderResult.order);" not in content:
    content = content.replace(
        "// 3. Log Success",
        "// 3. Sync to Google Sheets\n            await appendOrderRow(orderResult.order);\n\n            // 4. Log Success"
    )

with open('server/src/routes/orders.ts', 'w') as f:
    f.write(content)
