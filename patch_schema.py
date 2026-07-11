import re

with open('server/prisma/schema.prisma', 'r') as f:
    content = f.read()

# Add fields to Order model
order_fields = """
  pickupType            String   @default("STORE_PICKUP")
  invoiceVersion        Int      @default(1)
  invoiceUrl            String?
  whatsappStatus        String   @default("PENDING")
  sheetStatus           String   @default("PENDING")
  invoiceStatus         String   @default("GENERATED")
  paymentVerifiedAt     DateTime?
  paymentVerifiedBy     String?
  googleSheetRowId      String?
"""

content = re.sub(r'(model Order \{.*?)(\n  items\s+OrderItem\[\])', r'\1\n' + order_fields + r'\2', content, flags=re.DOTALL)

# Add AuditLog model
audit_log_model = """

model AuditLog {
  id        String   @id @default(cuid())
  orderId   String
  action    String
  adminId   String?
  details   String?
  createdAt DateTime @default(now())
}
"""

content += audit_log_model

with open('server/prisma/schema.prisma', 'w') as f:
    f.write(content)
