import re

with open('server/src/routes/admin.ts', 'r') as f:
    content = f.read()

# Fix the exactOptionalPropertyTypes issue with Prisma by mapping undefined to null
content = content.replace(
"""        data: {
            orderId,
            action,
            adminId,
            details
        }""",
"""        data: {
            orderId,
            action,
            adminId: adminId || null,
            details: details || null
        }"""
)

with open('server/src/routes/admin.ts', 'w') as f:
    f.write(content)


with open('server/src/utils/invoice.ts', 'r') as f:
    content = f.read()

content = content.replace("resolve({buffer, url: invoiceUrl});", "resolve({buffer, ...(invoiceUrl && {url: invoiceUrl})});")

with open('server/src/utils/invoice.ts', 'w') as f:
    f.write(content)
