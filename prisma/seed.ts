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
  // Finance Products
  const businessLoans = await prisma.product.upsert({
    where: { name: 'Business Loans' },
    update: {},
    create: {
      name: 'Business Loans',
      description: 'Flexible financing solutions for business growth.',
      category: 'finance',
      subProducts: {
        create: [
          { name: 'Working Capital Loans' },
          { name: 'Equipment Finance' },
          { name: 'Trade Finance' },
        ],
      },
    },
  });

  const personalLoans = await prisma.product.upsert({
    where: { name: 'Personal Loans' },
    update: {},
    create: {
      name: 'Personal Loans',
      description: 'Personal financing for your needs.',
      category: 'finance',
      subProducts: {
        create: [
          { name: 'Salary Advance' },
          { name: 'Emergency Loans' },
        ],
      },
    },
  });

  // Insurance Products
  const motorInsurance = await prisma.product.upsert({
    where: { name: 'Motor Insurance' },
    update: {},
    create: {
      name: 'Motor Insurance',
      description: 'Comprehensive vehicle protection.',
      category: 'insurance',
      subProducts: {
        create: [
          { name: 'Comprehensive Cover' },
          { name: 'Third Party' },
          { name: 'Passenger Insurance' },
        ],
      },
    },
  });

  const businessInsurance = await prisma.product.upsert({
    where: { name: 'Business Insurance' },
    update: {},
    create: {
      name: 'Business Insurance',
      description: 'Protect your business assets and operations.',
      category: 'insurance',
      subProducts: {
        create: [
          { name: 'Professional Indemnity' },
          { name: 'Public Liability' },
          { name: 'Property Insurance' },
        ],
      },
    },
  });

  // Investment Products
  const mutualFunds = await prisma.product.upsert({
    where: { name: 'Mutual Funds' },
    update: {},
    create: {
      name: 'Mutual Funds',
      description: 'Diversified investment portfolios.',
      category: 'investment',
      subProducts: {
        create: [
          { name: 'Equity Funds' },
          { name: 'Bond Funds' },
          { name: 'Money Market Funds' },
        ],
      },
    },
  });

  const retirementPlans = await prisma.product.upsert({
    where: { name: 'Retirement Plans' },
    update: {},
    create: {
      name: 'Retirement Plans',
      description: 'Secure your financial future.',
      category: 'investment',
      subProducts: {
        create: [
          { name: 'Pension Plans' },
          { name: 'Annuities' },
        ],
      },
    },
  });

  // Banking Products
  const bankAccounts = await prisma.product.upsert({
    where: { name: 'Business Accounts' },
    update: {},
    create: {
      name: 'Business Accounts',
      description: 'Banking solutions for businesses.',
      category: 'banking',
      subProducts: {
        create: [
          { name: 'Current Account' },
          { name: 'Savings Account' },
          { name: 'Foreign Currency Account' },
        ],
      },
    },
  });

  const creditCards = await prisma.product.upsert({
    where: { name: 'Credit Cards' },
    update: {},
    create: {
      name: 'Credit Cards',
      description: 'Flexible payment solutions.',
      category: 'banking',
      subProducts: {
        create: [
          { name: 'Business Credit Card' },
          { name: 'Corporate Card' },
        ],
      },
    },
  });

  console.log('Products and SubProducts created.');

  // Create Business Sectors
  const sectors = [
    'Technology',
    'Healthcare',
    'Manufacturing',
    'Retail',
    'Construction',
    'Agriculture',
    'Education',
    'Transportation',
    'Real Estate',
    'Professional Services'
  ];

  for (const sectorName of sectors) {
    await prisma.sector.upsert({
      where: { name: sectorName },
      update: {},
      create: { name: sectorName },
    });
  }

  console.log('Business sectors created.');

  // Link SBUs to Products
  await prisma.sbuProduct.createMany({
    data: [
      // Insurance SBU
      { sbuId: insuranceSbu.id, productId: motorInsurance.id },
      { sbuId: insuranceSbu.id, productId: businessInsurance.id },

      // Microfinance SBU
      { sbuId: microfinanceSbu.id, productId: businessLoans.id },
      { sbuId: microfinanceSbu.id, productId: personalLoans.id },

      // Bank SBU
      { sbuId: bankSbu.id, productId: bankAccounts.id },
      { sbuId: bankSbu.id, productId: creditCards.id },

      // Crown Bank SBU
      { sbuId: crownBankSbu.id, productId: mutualFunds.id },
      { sbuId: crownBankSbu.id, productId: retirementPlans.id },
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
