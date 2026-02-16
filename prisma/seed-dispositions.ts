import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDispositions() {
  console.log('Seeding dispositions...');

  // First Level Dispositions
  const contacted = await prisma.firstLevelDisposition.upsert({
    where: { name: 'Contacted' },
    update: {},
    create: {
      name: 'Contacted',
      description: 'Lead was successfully contacted',
      isActive: true,
    },
  });

  const notContacted = await prisma.firstLevelDisposition.upsert({
    where: { name: 'Not Contacted' },
    update: {},
    create: {
      name: 'Not Contacted',
      description: 'Lead was not contacted',
      isActive: true,
    },
  });

  console.log('✓ First level dispositions created');

  // Second Level Dispositions
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

  console.log('✓ Second level dispositions created');

  // Third Level Dispositions - No Sale Reasons
  const noSaleReasons = [
    { name: 'Not Interested', description: 'Lead expressed no interest in the product' },
    { name: 'Price Too High', description: 'Lead found the price unaffordable' },
    { name: 'Already Has Solution', description: 'Lead already has a similar product/service' },
    { name: 'Needs More Time', description: 'Lead needs more time to decide' },
    { name: 'Budget Constraints', description: 'Lead has budget limitations' },
  ];

  for (const reason of noSaleReasons) {
    await prisma.thirdLevelDisposition.upsert({
      where: { name_category: { name: reason.name, category: 'no_sale' } },
      update: {},
      create: {
        name: reason.name,
        description: reason.description,
        category: 'no_sale',
        isActive: true,
      },
    });
  }

  console.log('✓ Third level dispositions (No Sale) created');

  // Third Level Dispositions - Not Contacted Reasons
  const notContactedReasons = [
    { name: 'Wrong Number', description: 'Phone number is incorrect or invalid' },
    { name: 'No Answer', description: 'Lead did not answer the call' },
    { name: 'Voicemail', description: 'Call went to voicemail' },
    { name: 'Number Busy', description: 'Phone line was busy' },
    { name: 'Call Back Later', description: 'Lead requested to be called back later' },
  ];

  for (const reason of notContactedReasons) {
    await prisma.thirdLevelDisposition.upsert({
      where: { name_category: { name: reason.name, category: 'not_contacted' } },
      update: {},
      create: {
        name: reason.name,
        description: reason.description,
        category: 'not_contacted',
        isActive: true,
      },
    });
  }

  console.log('✓ Third level dispositions (Not Contacted) created');
  console.log('✅ Disposition seeding completed!');
}

seedDispositions()
  .catch((e) => {
    console.error('Error seeding dispositions:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
