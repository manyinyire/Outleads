import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    
    // First create or get an SBU
    let sbu = await prisma.sbu.findFirst({
      where: { name: 'IT' }
    });
    
    if (!sbu) {
      sbu = await prisma.sbu.create({
        data: { name: 'IT' }
      });
    }
    
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { username: 'admin' }
    });
    
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.username);
      return;
    }
    
    // Create admin user
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'ADMIN',
        status: 'ACTIVE',
        sbuId: sbu.id,
      },
      include: {
        sbu: true
      }
    });
    
    console.log('Admin user created successfully:');
    console.log(`- Username: ${admin.username}`);
    console.log(`- Name: ${admin.name}`);
    console.log(`- Role: ${admin.role}`);
    console.log(`- SBU: ${admin.sbu?.name}`);
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();