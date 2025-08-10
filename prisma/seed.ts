import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // Create SBUs
  const insuranceSbu = await prisma.sbu.upsert({
    where: { name: 'Insurance' },
    update: {},
    create: { name: 'Insurance' },
  });

  const microfinanceSbu = await prisma.sbu.upsert({
    where: { name: 'Microfinance' },
    update: {},
    create: { name: 'Microfinance' },
  });

  const bankSbu = await prisma.sbu.upsert({
    where: { name: 'Bank' },
    update: {},
    create: { name: 'Bank' },
  });

  const crownBankSbu = await prisma.sbu.upsert({
    where: { name: 'Crown Bank' },
    update: {},
    create: { name: 'Crown Bank' },
  });

  console.log('SBUs created.');

  // Create Products and SubProducts
  const motorInsurance = await prisma.product.upsert({
    where: { name: 'Motor Insurance' },
    update: {},
    create: {
      name: 'Motor Insurance',
      description: 'Insurance for motor vehicles.',
      subProducts: {
        create: [
          { name: 'Comprehensive' },
          { name: 'Third Party' },
          { name: 'Passenger Insurance' },
        ],
      },
    },
  });

  const microInsurance = await prisma.product.upsert({
    where: { name: 'Micro Insurance' },
    update: {},
    create: {
      name: 'Micro Insurance',
      description: 'Insurance for low-income individuals.',
      subProducts: {
        create: [
          { name: 'Funeral Cover' },
          { name: 'Health Cash Plan' },
        ],
      },
    },
  });

  const businessAndAgric = await prisma.product.upsert({
    where: { name: 'Business & Agriculture' },
    update: {},
    create: {
      name: 'Business & Agriculture',
      description: 'Insurance for businesses and agricultural activities.',
      subProducts: {
        create: [
          { name: 'Assets All Risks' },
          { name: 'Crop & Livestock' },
        ],
      },
    },
  });

  const bankAccounts = await prisma.product.upsert({
    where: { name: 'Bank Accounts' },
    update: {},
    create: {
      name: 'Bank Accounts',
      description: 'Various types of bank accounts.',
      subProducts: {
        create: [
          { name: 'Current Account' },
          { name: 'Savings Account' },
        ],
      },
    },
  });

  const creditCards = await prisma.product.upsert({
    where: { name: 'Credit Cards' },
    update: {},
    create: {
      name: 'Credit Cards',
      description: 'Credit card services.',
      subProducts: {
        create: [
          { name: 'Platinum Card' },
          { name: 'Gold Card' },
        ],
      },
    },
  });

  console.log('Products and SubProducts created.');

  // Link SBUs to Products
  await prisma.sbuProduct.createMany({
    data: [
      // Insurance SBU
      { sbuId: insuranceSbu.id, productId: motorInsurance.id },
      { sbuId: insuranceSbu.id, productId: microInsurance.id },
      { sbuId: insuranceSbu.id, productId: businessAndAgric.id },

      // Bank SBU
      { sbuId: bankSbu.id, productId: bankAccounts.id },
      { sbuId: bankSbu.id, productId: creditCards.id },
    ],
    skipDuplicates: true,
  });

  console.log('SBU-Product links created.');

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
