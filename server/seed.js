/**
 * Seed Script — Creates the default admin user
 * Run once: node seed.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.model.js';
import Book from './src/models/Book.model.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Create Admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@library.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('ℹ️  Admin already exists:', adminEmail);
    } else {
      await User.create({
        name: 'Library Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        phone: '9999999999',
      });
      console.log('✅ Admin created:', adminEmail, '| Password:', adminPassword);
    }

    // Seed sample books
    const booksCount = await Book.countDocuments();
    if (booksCount === 0) {
      await Book.insertMany([
        {
          title: 'The Pragmatic Programmer',
          author: 'David Thomas, Andrew Hunt',
          isbn: '978-0201616224',
          category: 'Technology',
          description: 'A guide to becoming a better programmer.',
          publisher: 'Addison-Wesley',
          publishedYear: 2019,
          totalCopies: 5,
          availableCopies: 5,
          finePerDay: 5,
        },
        {
          title: 'Clean Code',
          author: 'Robert C. Martin',
          isbn: '978-0132350884',
          category: 'Technology',
          description: 'A handbook of agile software craftsmanship.',
          publisher: 'Prentice Hall',
          publishedYear: 2008,
          totalCopies: 4,
          availableCopies: 4,
          finePerDay: 5,
        },
        {
          title: 'To Kill a Mockingbird',
          author: 'Harper Lee',
          isbn: '978-0061935466',
          category: 'Fiction',
          description: 'A classic novel of racial injustice and childhood.',
          publisher: 'HarperCollins',
          publishedYear: 1960,
          totalCopies: 6,
          availableCopies: 6,
          finePerDay: 3,
        },
        {
          title: 'Atomic Habits',
          author: 'James Clear',
          isbn: '978-0735211292',
          category: 'Self-Help',
          description: 'An easy way to build good habits and break bad ones.',
          publisher: 'Avery',
          publishedYear: 2018,
          totalCopies: 8,
          availableCopies: 8,
          finePerDay: 4,
        },
        {
          title: 'The Great Gatsby',
          author: 'F. Scott Fitzgerald',
          isbn: '978-0743273565',
          category: 'Fiction',
          description: 'A story of wealth, love, and the American dream.',
          publisher: 'Scribner',
          publishedYear: 1925,
          totalCopies: 5,
          availableCopies: 5,
          finePerDay: 3,
        },
        {
          title: 'Design Patterns',
          author: 'Gang of Four',
          isbn: '978-0201633610',
          category: 'Technology',
          description: 'Elements of Reusable Object-Oriented Software.',
          publisher: 'Addison-Wesley',
          publishedYear: 1994,
          totalCopies: 3,
          availableCopies: 3,
          finePerDay: 5,
        },
      ]);
      console.log('✅ Sample books seeded (6 books)');
    } else {
      console.log('ℹ️  Books already exist, skipping book seed.');
    }

    console.log('\n🎉 Seed complete!');
    console.log('─────────────────────────────');
    console.log('Admin Login:');
    console.log('  Email:   ', process.env.ADMIN_EMAIL || 'admin@library.com');
    console.log('  Password:', process.env.ADMIN_PASSWORD || 'Admin@123');
    console.log('─────────────────────────────');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
};

seedData();
