// Database Seeding Script: seed.js
// Populates realistic college equipment and test users for viva/demo

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Asset = require('./models/Asset');
const Request = require('./models/Request');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lab_equipment_db';

async function seedDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing collections
    await User.deleteMany({});
    await Asset.deleteMany({});
    await Request.deleteMany({});
    console.log('Cleared existing records.');

    // 1. Create Test Users
    const passwordHash = await bcrypt.hash('password123', 10);

    const admin = await User.create({
      name: 'Dr. Sarah Connor (Admin)',
      email: 'admin@college.edu',
      password: passwordHash,
      role: 'admin'
    });

    const incharge = await User.create({
      name: 'Prof. Alan Turing (Lab In-charge)',
      email: 'incharge@college.edu',
      password: passwordHash,
      role: 'lab-incharge'
    });

    const student = await User.create({
      name: 'John Doe (Student)',
      email: 'student@college.edu',
      password: passwordHash,
      role: 'requester'
    });

    console.log('Created Users:');
    console.log('  Admin:       admin@college.edu       / password123');
    console.log('  In-charge:   incharge@college.edu    / password123');
    console.log('  Requester:   student@college.edu     / password123');

    // 2. Create Sample Lab Equipment
    const assets = await Asset.create([
      {
        assetTag: 'OSC001',
        name: 'Digital Storage Oscilloscope 100MHz',
        category: 'Electronics',
        location: 'Electronics Lab 1',
        condition: 'OK',
        quantity: 8,
        availableQuantity: 7, // 1 unit is currently checked out
        maintenanceLogs: [
          {
            serviceDate: new Date('2026-08-15'),
            cost: 1200,
            nextServiceDue: new Date('2027-02-15'),
            notes: 'Annual probe calibration and internal testing'
          }
        ]
      },
      {
        assetTag: 'LAP001',
        name: 'Dell Latitude 3420 Core i5',
        category: 'Computer',
        location: 'Computer Lab 2',
        condition: 'OK',
        quantity: 12,
        availableQuantity: 10 // 2 units currently checked out
      },
      {
        assetTag: 'ARD001',
        name: 'Arduino Mega Embedded Robotics Kit',
        category: 'Embedded Systems',
        location: 'Robotics Lab',
        condition: 'OK',
        quantity: 20,
        availableQuantity: 19 // 1 unit checked out overdue
      },
      {
        assetTag: 'PRJ001',
        name: 'Epson EB-E01 XGA Projector',
        category: 'Audio-Visual',
        location: 'Seminar Hall B',
        condition: 'OK',
        quantity: 4,
        availableQuantity: 4
      },
      {
        assetTag: 'DMM001',
        name: 'Fluke 115 True-RMS Multimeter',
        category: 'Measurement',
        location: 'Physics Lab',
        condition: 'OK',
        quantity: 15,
        availableQuantity: 15
      }
    ]);

    console.log(`Created ${assets.length} sample institutional assets.`);

    // 3. Create Sample Issue & Return Cycles to populate dashboard counters
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const pastWeek = new Date();
    pastWeek.setDate(pastWeek.getDate() - 7);

    const futureWeek = new Date();
    futureWeek.setDate(futureWeek.getDate() + 7);

    // Active issue on schedule
    await Request.create({
      requester: student._id,
      asset: assets[0]._id, // Oscilloscope
      quantity: 1,
      purpose: 'Digital Signal Processing Project Lab Work',
      expectedReturnDate: futureWeek,
      status: 'Issued',
      issuedAt: pastWeek
    });

    // Active issue that is OVERDUE (expected return was yesterday)
    await Request.create({
      requester: student._id,
      asset: assets[2]._id, // Arduino Kit
      quantity: 1,
      purpose: 'Obstacle avoiding robot competition preparation',
      expectedReturnDate: yesterday, // Past date -> OVERDUE!
      status: 'Issued',
      issuedAt: pastWeek
    });

    // Returned item with Damaged condition to demonstrate damaged inventory tracking
    await Request.create({
      requester: student._id,
      asset: assets[1]._id, // Laptop
      quantity: 1,
      purpose: 'Hackathon programming session',
      expectedReturnDate: pastWeek,
      status: 'Returned',
      issuedAt: pastWeek,
      returnedAt: yesterday,
      returnCondition: 'Damaged',
      remarks: 'Keypad spacebar cracked during transport'
    });

    console.log('Created sample request cycles (including active issue, overdue, and damaged return).');
    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seedDatabase();
