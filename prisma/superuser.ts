import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const superuser = await prisma.user.create({
    data: {
      username: 'superuser',
      name: 'Super User',
      email: 'superuser@example.com',
      role: 'ADMIN',
      status: 'ACTIVE',
      sbu: 'Executive'
    },
  })
  console.log({ superuser })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })