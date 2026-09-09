// Populates the database with enough demo data to walk through the full end-to-end use
// case (register -> stock-in -> stock-out -> transfer -> approval -> reports) without
// having to manually create everything through Postman first.
//
// Run with: npm run seed
// WARNING: this wipes all existing data in the configured MONGO_URI database.

require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Warehouse = require('../models/Warehouse');
const Item = require('../models/Item');
const StockBalance = require('../models/StockBalance');
const StockMovement = require('../models/StockMovement');
const TransferRequest = require('../models/TransferRequest');
const StockAdjustment = require('../models/StockAdjustment');

const { MOVEMENT_TYPES, TRANSFER_STATUS, ROLES } = require('./constants');

async function seed() {
  await connectDB();

  console.log('Clearing existing collections...');
  await Promise.all([
    User.deleteMany({}),
    Warehouse.deleteMany({}),
    Item.deleteMany({}),
    StockBalance.deleteMany({}),
    StockMovement.deleteMany({}),
    TransferRequest.deleteMany({}),
    StockAdjustment.deleteMany({}),
  ]);

  console.log('Creating warehouses...');
  const [northWh, southWh] = await Warehouse.create([
    { name: 'North Depot', location: 'Bengaluru North', capacity: 5000 },
    { name: 'South Depot', location: 'Bengaluru South', capacity: 3000 },
  ]);

  console.log('Creating users...');
  const passwordHash = await bcrypt.hash('Password123', 10);
  const [admin, manager, staff] = await User.create([
    { name: 'Ashwin Admin', email: 'admin@example.com', passwordHash, role: ROLES.ADMIN },
    {
      name: 'Meera Manager',
      email: 'manager@example.com',
      passwordHash,
      role: ROLES.MANAGER,
      warehouseId: northWh._id,
    },
    {
      name: 'Suresh Staff',
      email: 'staff@example.com',
      passwordHash,
      role: ROLES.STAFF,
      warehouseId: northWh._id,
    },
  ]);

  console.log('Creating items...');
  const [widget, gadget] = await Item.create([
    { sku: 'WGT-001', name: 'Standard Widget', category: 'Widgets', unit: 'pcs', unitPrice: 50, reorderPoint: 20 },
    { sku: 'GDT-002', name: 'Premium Gadget', category: 'Gadgets', unit: 'pcs', unitPrice: 250, reorderPoint: 10 },
  ]);

  console.log('Recording stock-in movements...');
  const stockInEvents = [
    { warehouseId: northWh._id, itemId: widget._id, quantity: 100, reference: 'BATCH-001' },
    { warehouseId: northWh._id, itemId: gadget._id, quantity: 40, reference: 'BATCH-002' },
    { warehouseId: southWh._id, itemId: widget._id, quantity: 15, reference: 'BATCH-003' },
  ];

  for (const evt of stockInEvents) {
    const balance = await StockBalance.findOneAndUpdate(
      { warehouseId: evt.warehouseId, itemId: evt.itemId },
      { $inc: { quantity: evt.quantity } },
      { new: true, upsert: true }
    );
    await StockMovement.create({
      warehouseId: evt.warehouseId,
      itemId: evt.itemId,
      type: MOVEMENT_TYPES.IN,
      quantity: evt.quantity,
      balanceAfter: balance.quantity,
      reference: evt.reference,
      createdBy: staff._id,
    });
  }

  console.log('Recording one stock-out movement...');
  {
    const balance = await StockBalance.findOneAndUpdate(
      { warehouseId: northWh._id, itemId: widget._id },
      { $inc: { quantity: -10 } },
      { new: true }
    );
    await StockMovement.create({
      warehouseId: northWh._id,
      itemId: widget._id,
      type: MOVEMENT_TYPES.OUT,
      quantity: 10,
      balanceAfter: balance.quantity,
      reference: 'SALE-1001',
      createdBy: staff._id,
    });
  }

  console.log('Creating one pending transfer request (North -> South, Gadgets)...');
  await TransferRequest.create({
    fromWarehouseId: northWh._id,
    toWarehouseId: southWh._id,
    itemId: gadget._id,
    quantity: 5,
    status: TRANSFER_STATUS.PENDING,
    requestedBy: staff._id,
  });

  console.log('Seed complete. Demo accounts (all use password: Password123):');
  console.log(`  Admin:   ${admin.email}`);
  console.log(`  Manager: ${manager.email}`);
  console.log(`  Staff:   ${staff.email}`);

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
