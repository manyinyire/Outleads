"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Start seeding ...');
        // Create SBUs
        const insuranceSbu = yield prisma.sbu.upsert({
            where: { name: 'Insurance' },
            update: {},
            create: { name: 'Insurance' },
        });
        const microfinanceSbu = yield prisma.sbu.upsert({
            where: { name: 'Microfinance' },
            update: {},
            create: { name: 'Microfinance' },
        });
        const bankSbu = yield prisma.sbu.upsert({
            where: { name: 'Bank' },
            update: {},
            create: { name: 'Bank' },
        });
        const crownBankSbu = yield prisma.sbu.upsert({
            where: { name: 'Crown Bank' },
            update: {},
            create: { name: 'Crown Bank' },
        });
        console.log('SBUs created.');
        // Clear existing products to avoid conflicts
        yield prisma.sbuProduct.deleteMany({});
        yield prisma.product.deleteMany({});
        console.log('Existing products cleared.');
        // Create Products and SubProducts in a hierarchy
        const finance = yield prisma.product.create({
            data: { name: 'Finance', description: 'Financial products and services' },
        });
        const insurance = yield prisma.product.create({
            data: { name: 'Insurance', description: 'Insurance products' },
        });
        const investment = yield prisma.product.create({
            data: { name: 'Investment', description: 'Investment products' },
        });
        const banking = yield prisma.product.create({
            data: { name: 'Banking', description: 'Banking products and services' },
        });
        // Finance Children
        const businessLoans = yield prisma.product.create({
            data: {
                name: 'Business Loans',
                description: 'Flexible financing solutions for business growth.',
                parentId: finance.id,
            },
        });
        yield prisma.product.createMany({
            data: [
                { name: 'Working Capital Loans', parentId: businessLoans.id },
                { name: 'Equipment Finance', parentId: businessLoans.id },
                { name: 'Trade Finance', parentId: businessLoans.id },
            ],
        });
        const personalLoans = yield prisma.product.create({
            data: {
                name: 'Personal Loans',
                description: 'Personal financing for your needs.',
                parentId: finance.id,
            },
        });
        yield prisma.product.createMany({
            data: [
                { name: 'Salary Advance', parentId: personalLoans.id },
                { name: 'Emergency Loans', parentId: personalLoans.id },
            ],
        });
        // Insurance Children
        const motorInsurance = yield prisma.product.create({
            data: {
                name: 'Motor Insurance',
                description: 'Comprehensive vehicle protection.',
                parentId: insurance.id,
            },
        });
        yield prisma.product.createMany({
            data: [
                { name: 'Comprehensive Cover', parentId: motorInsurance.id },
                { name: 'Third Party', parentId: motorInsurance.id },
                { name: 'Passenger Insurance', parentId: motorInsurance.id },
            ],
        });
        const businessInsurance = yield prisma.product.create({
            data: {
                name: 'Business Insurance',
                description: 'Protect your business assets and operations.',
                parentId: insurance.id,
            },
        });
        yield prisma.product.createMany({
            data: [
                { name: 'Professional Indemnity', parentId: businessInsurance.id },
                { name: 'Public Liability', parentId: businessInsurance.id },
                { name: 'Property Insurance', parentId: businessInsurance.id },
            ],
        });
        // Investment Children
        const mutualFunds = yield prisma.product.create({
            data: {
                name: 'Mutual Funds',
                description: 'Diversified investment portfolios.',
                parentId: investment.id,
            },
        });
        yield prisma.product.createMany({
            data: [
                { name: 'Equity Funds', parentId: mutualFunds.id },
                { name: 'Bond Funds', parentId: mutualFunds.id },
                { name: 'Money Market Funds', parentId: mutualFunds.id },
            ],
        });
        const retirementPlans = yield prisma.product.create({
            data: {
                name: 'Retirement Plans',
                description: 'Secure your financial future.',
                parentId: investment.id,
            },
        });
        yield prisma.product.createMany({
            data: [
                { name: 'Pension Plans', parentId: retirementPlans.id },
                { name: 'Annuities', parentId: retirementPlans.id },
            ],
        });
        // Banking Children
        const bankAccounts = yield prisma.product.create({
            data: {
                name: 'Business Accounts',
                description: 'Banking solutions for businesses.',
                parentId: banking.id,
            },
        });
        yield prisma.product.createMany({
            data: [
                { name: 'Current Account', parentId: bankAccounts.id },
                { name: 'Savings Account', parentId: bankAccounts.id },
                { name: 'Foreign Currency Account', parentId: bankAccounts.id },
            ],
        });
        const creditCards = yield prisma.product.create({
            data: {
                name: 'Credit Cards',
                description: 'Flexible payment solutions.',
                parentId: banking.id,
            },
        });
        yield prisma.product.createMany({
            data: [
                { name: 'Business Credit Card', parentId: creditCards.id },
                { name: 'Corporate Card', parentId: creditCards.id },
            ],
        });
        console.log('Products hierarchy created.');
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
            yield prisma.sector.upsert({
                where: { name: sectorName },
                update: {},
                create: { name: sectorName },
            });
        }
        console.log('Business sectors created.');
        // Link SBUs to Products
        yield prisma.sbuProduct.createMany({
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
    });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));
