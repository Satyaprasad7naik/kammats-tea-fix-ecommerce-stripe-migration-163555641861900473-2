import re

with open('server/prisma/schema.prisma', 'r') as f:
    content = f.read()

# Add indexes to Order model
indexes = """
  @@index([phone])
  @@index([paymentStatus])
  @@index([orderStatus])
  @@index([createdAt])
"""

content = content.replace("  items                 OrderItem[]\n}", "  items                 OrderItem[]\n" + indexes + "\n}")

with open('server/prisma/schema.prisma', 'w') as f:
    f.write(content)
