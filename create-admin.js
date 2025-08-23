const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUsers() {
  console.log('🌱 Creating admin users...');

  try {
    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123!', 12);
    const agentPassword = await bcrypt.hash('agent123!', 12);

    // Create admin user
    await prisma.user.upsert({
      where: { email: 'admin@nexus.com' },
      update: {},
      create: {
        email: 'admin@nexus.com',
        username: 'admin_nexus',
        password: adminPassword,
        name: 'Admin User',
        role: 'ADMIN',
        status: 'ACTIVE'
      }
    });

    // Create agent user
    await prisma.user.upsert({
      where: { email: 'agent@nexus.com' },
      update: {},
      create: {
        email: 'agent@nexus.com',
        username: 'agent_nexus',
        password: agentPassword,
        name: 'Agent User',
        role: 'AGENT',
        status: 'ACTIVE'
      }
    });

    console.log('✅ Admin users created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin: admin@nexus.com / admin123!');
    console.log('Agent: agent@nexus.com / agent123!');
    console.log('\nOr use usernames:');
    console.log('Admin: admin_nexus / admin123!');
    console.log('Agent: agent_nexus / agent123!');

  } catch (error) {
    console.error('❌ Error creating users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUsers();
