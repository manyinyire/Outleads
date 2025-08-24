import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const permissions = [
    { id: 'dashboard', name: 'View Dashboard' },
    { id: 'leads', name: 'Manage Leads' },
    { id: 'campaigns', name: 'Manage Campaigns' },
    { id: 'reports', name: 'View Reports' },
    { id: 'users', name: 'Manage Users' },
    { id: 'products', name: 'Manage Products' },
    { id: 'product-categories', name: 'Manage Categories' },
    { id: 'sectors', name: 'Manage Sectors' },
    { id: 'sbus', name: 'Manage SBUs' },
    { id: 'settings', name: 'Manage Settings' },
  ]

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { id: permission.id },
      update: {},
      create: permission,
    })
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
