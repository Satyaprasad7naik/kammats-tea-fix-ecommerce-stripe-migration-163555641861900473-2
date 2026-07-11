import re

with open('server/src/routes/orders.ts', 'r') as f:
    content = f.read()

# Add import for sendWhatsAppInvoice
if "import { sendWhatsAppInvoice" not in content:
    content = content.replace(
        "import { sendCustomerConfirmationEmail, sendAdminNotificationEmail } from '../utils/communications';",
        "import { sendCustomerConfirmationEmail, sendAdminNotificationEmail, sendWhatsAppInvoice } from '../utils/communications';"
    )

# Add sendWhatsAppInvoice call in the background task
if "await sendWhatsAppInvoice(orderResult.order, customerPdfData.url);" not in content:
    content = content.replace(
        "// We could also trigger whatsapp API here if we had keys",
        "// 5. Send WhatsApp Invoice\n            await sendWhatsAppInvoice(orderResult.order, customerPdfData.url);"
    )

with open('server/src/routes/orders.ts', 'w') as f:
    f.write(content)
