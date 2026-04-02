import bcrypt from 'bcryptjs';
import pkg from '@prisma/client';
const { PrismaClient, Role } = pkg;

const prisma = new PrismaClient();

const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

async function main() {
  const adminPassword = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123456', 12);

  await prisma.user.upsert({
    where: { email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com' },
    update: {},
    create: {
      name: process.env.DEFAULT_ADMIN_NAME || 'Admin User',
      email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com',
      password: adminPassword,
      role: Role.ADMIN,
      phone: '+910000000000'
    }
  });

  const categoryNames = ['Electronics', 'Fashion', 'Home & Living', 'Beauty'];
  const categories = [];

  for (const name of categoryNames) {
    const category = await prisma.category.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: { name, slug: slugify(name), description: `${name} category` }
    });
    categories.push(category);
  }

  const existingProducts = await prisma.product.count();
  if (existingProducts === 0) {
    const admin = await prisma.user.findUnique({ where: { email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com' } });
    const sampleProducts = [
      {
        name: 'Noise Cancelling Headphones',
        slug: 'noise-cancelling-headphones',
        description: 'Premium wireless headphones with active noise cancellation and 30-hour battery life.',
        price: 8999,
        stock: 40,
        sku: 'ELEC-HDPHN-001',
        isFeatured: true,
        categoryId: categories[0].id,
        createdById: admin.id,
        images: {
          create: [{ url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80', publicId: 'seed-headphones', altText: 'Headphones' }]
        }
      },
      {
        name: 'Minimal Desk Lamp',
        slug: 'minimal-desk-lamp',
        description: 'Modern desk lamp with adjustable brightness and warm/cool light modes.',
        price: 2499,
        stock: 25,
        sku: 'HOME-LAMP-001',
        isFeatured: true,
        categoryId: categories[2].id,
        createdById: admin.id,
        images: {
          create: [{ url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=80', publicId: 'seed-lamp', altText: 'Desk lamp' }]
        }
      },
      {
        name: 'Everyday Sneakers',
        slug: 'everyday-sneakers',
        description: 'Comfortable and lightweight sneakers suitable for daily wear.',
        price: 3499,
        stock: 60,
        sku: 'FSHN-SHOE-001',
        isFeatured: false,
        categoryId: categories[1].id,
        createdById: admin.id,
        images: {
          create: [{ url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=80', publicId: 'seed-sneakers', altText: 'Sneakers' }]
        }
      }
    ];

    for (const product of sampleProducts) {
      await prisma.product.create({ data: product });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
