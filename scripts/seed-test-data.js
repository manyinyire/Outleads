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
function seedTestData() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Checking existing data...');
            // Check if we already have data
            const leadCount = yield prisma.lead.count();
            const sectorCount = yield prisma.sector.count();
            const productCount = yield prisma.product.count();
            console.log(`Current counts - Leads: ${leadCount}, Sectors: ${sectorCount}, Products: ${productCount}`);
            // Create sectors if they don't exist
            if (sectorCount === 0) {
                console.log('Creating sectors...');
                yield prisma.sector.createMany({
                    data: [
                        { name: 'Technology' },
                        { name: 'Healthcare' },
                        { name: 'Finance' },
                        { name: 'Education' },
                        { name: 'Retail' },
                    ],
                });
            }
            // Create products if they don't exist
            if (productCount === 0) {
                console.log('Creating products...');
                yield prisma.product.createMany({
                    data: [
                        { name: 'CRM Software', description: 'Customer Relationship Management', category: 'software' },
                        { name: 'Financial Planning', description: 'Financial advisory services', category: 'finance' },
                        { name: 'Marketing Automation', description: 'Automated marketing tools', category: 'marketing' },
                    ],
                });
            }
            // Create test leads if none exist
            if (leadCount === 0) {
                console.log('Creating test leads...');
                const sectors = yield prisma.sector.findMany();
                const products = yield prisma.product.findMany();
                if (sectors.length > 0 && products.length > 0) {
                    // Create some test leads
                    const testLeads = [
                        {
                            fullName: 'John Doe',
                            email: 'john.doe@example.com',
                            phoneNumber: '+1-555-0101',
                            sectorId: sectors[0].id,
                        },
                        {
                            fullName: 'Jane Smith',
                            email: 'jane.smith@example.com',
                            phoneNumber: '+1-555-0102',
                            sectorId: sectors[1].id,
                        },
                        {
                            fullName: 'Bob Johnson',
                            email: 'bob.johnson@example.com',
                            phoneNumber: '+1-555-0103',
                            sectorId: sectors[2].id,
                        },
                    ];
                    for (const leadData of testLeads) {
                        const lead = yield prisma.lead.create({
                            data: leadData,
                        });
                        // Connect some products to the lead
                        yield prisma.lead.update({
                            where: { id: lead.id },
                            data: {
                                products: {
                                    connect: [{ id: products[0].id }],
                                },
                            },
                        });
                    }
                    console.log('Test leads created successfully!');
                }
            }
            // Final count
            const finalCounts = {
                leads: yield prisma.lead.count(),
                sectors: yield prisma.sector.count(),
                products: yield prisma.product.count(),
            };
            console.log('Final counts:', finalCounts);
        }
        catch (error) {
            console.error('Error seeding test data:', error);
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
seedTestData();
