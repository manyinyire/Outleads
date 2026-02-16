import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSecondLevel() {
  console.log('Seeding second level dispositions...');

  const sale = await prisma.secondLevelDisposition.upsert({
    where: { name: 'Sale' },
    update: {},
    create: {
      name: 'Sale',
      description: 'Lead converted to sale',
      isActive: true,
    },
  });

  const noSale = await prisma.secondLevelDisposition.upsert({
    where: { name: 'No Sale' },
    update: {},
    create: {
      name: 'No Sale',
      description: 'Lead did not convert to sale',
      isActive: true,
    },
  });

  console.log('✓ Second level dispositions created:', { sale, noSale });
  console.log('✅ Second level seeding completed!');
}

seedSecondLevel()
  .catch((e) => {
    console.error('Error seeding second level dispositions:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
