with open('server/prisma/seed.ts', 'r') as f:
    content = f.read()

admin_seed = """
  console.log('Seeding admin...');
  const bcrypt = require('bcryptjs');
  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.admin.create({
    data: {
      username: 'admin',
      password: passwordHash
    }
  });
"""

content = content.replace("console.log('Seeding products...');", "console.log('Seeding products...');\n" + admin_seed)

with open('server/prisma/seed.ts', 'w') as f:
    f.write(content)
