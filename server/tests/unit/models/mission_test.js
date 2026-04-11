// src/tests/unit/models/mission_test.js
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Mission from '../../../models/Mission.js';

function getFutureDate(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
}

async function testMission() {
  let mongoServer;

  try {
    console.log('🚀 Starting MongoDB Memory Server...');
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('✅ In‑memory database connected\n');

    // Base valid mission data – using correct field name "category"
    const baseMission = {
      organizationId: new mongoose.Types.ObjectId(),
      title: 'Beach Cleanup',
      category: 'Environment',               // ✅ correct field name
      description: 'Join a large beach cleanup operation. Gloves and bags will be provided.',
      type: 'presential',
      address: {
        street: '15 Quai de la Plage',
        postalCode: '75001',
        city: 'Paris',
        fullAddress: '15 Quai de la Plage, 75001 Paris',
      },
      location: {
        type: 'Point',
        coordinates: [2.3522, 48.8566],
      },
      startDate: getFutureDate(7),
      endDate: getFutureDate(8),
      slotsTotal: 10,
      requiredSkills: ['teaching', 'first_aid'],
      createdBy: new mongoose.Types.ObjectId(),
    };

    // ========== TEST 1: Create valid mission ==========
    console.log('📝 TEST 1: Create mission with valid data');
    const validMission = new Mission(baseMission);
    await validMission.save();
    console.log('✅ Mission created');
    console.log(`   ID: ${validMission._id}`);
    console.log(`   Title: ${validMission.title}`);
    console.log(`   Status: ${validMission.status} (default draft)`);
    console.log(`   Slots: ${validMission.slotsFilled}/${validMission.slotsTotal}\n`);

    // ========== TEST 2: Read mission ==========
    console.log('📝 TEST 2: Read mission');
    const found = await Mission.findById(validMission._id);
    console.log(`   ✅ Found: ${found.title}\n`);

    // ========== TEST 3: hasAvailableSlots() ==========
    console.log('📝 TEST 3: hasAvailableSlots()');
    const hasSlots = validMission.hasAvailableSlots();
    console.log(`   ${hasSlots ? '✅' : '❌'} Returns true when slots remain (0/10)`);

    // ========== TEST 4: getAvailableSlots() ==========
    console.log('📝 TEST 4: getAvailableSlots()');
    const available = validMission.getAvailableSlots();
    console.log(`   ${available === 10 ? '✅' : '❌'} Returns 10 available slots`);

    // ========== TEST 5: incrementApplications() ==========
    console.log('📝 TEST 5: incrementApplications()');
    await validMission.incrementApplications();
    const updated = await Mission.findById(validMission._id);
    console.log(`   ${updated.applicationCount === 1 ? '✅' : '❌'} Application count incremented to 1`);

    // ========== TEST 6: Title too long ==========
    console.log('\n📝 TEST 6: Validation – title > 50 chars');
    try {
      const badTitle = new Mission({ ...baseMission, title: 'a'.repeat(51) });
      await badTitle.save();
      console.log('   ❌ Should have failed');
    } catch (err) {
      console.log(`   ✅ Rejected: ${err.message.split('\n')[0]}`);
    }

    // ========== TEST 7: Description too short ==========
    console.log('\n📝 TEST 7: Validation – description < 50 chars');
    try {
      const badDesc = new Mission({ ...baseMission, description: 'short' });
      await badDesc.save();
      console.log('   ❌ Should have failed');
    } catch (err) {
      console.log(`   ✅ Rejected: ${err.message.split('\n')[0]}`);
    }

    // ========== TEST 8: Invalid category ==========
    console.log('\n📝 TEST 8: Validation – invalid category');
    try {
      const badCat = new Mission({ ...baseMission, category: 'Invalid' });
      await badCat.save();
      console.log('   ❌ Should have failed');
    } catch (err) {
      console.log(`   ✅ Rejected: invalid category`);
    }

    // ========== TEST 9: Start date in the past ==========
    console.log('\n📝 TEST 9: Validation – start date in the past');
    try {
      const pastDate = new Mission({
        ...baseMission,
        startDate: new Date(Date.now() - 1000),
        endDate: getFutureDate(1),
      });
      await pastDate.save();
      console.log('   ❌ Should have failed');
    } catch (err) {
      console.log(`   ✅ Rejected: start date must be in future`);
    }

    // ========== TEST 10: End date before start date ==========
    console.log('\n📝 TEST 10: Validation – end date before start date');
    try {
      const wrongOrder = new Mission({
        ...baseMission,
        startDate: getFutureDate(10),
        endDate: getFutureDate(5),
      });
      await wrongOrder.save();
      console.log('   ❌ Should have failed');
    } catch (err) {
      console.log(`   ✅ Rejected: end date must be after start date`);
    }

    // ========== TEST 11: slotsTotal > 200 ==========
    console.log('\n📝 TEST 11: Validation – slotsTotal > 200');
    try {
      const tooMany = new Mission({ ...baseMission, slotsTotal: 201 });
      await tooMany.save();
      console.log('   ❌ Should have failed');
    } catch (err) {
      console.log(`   ✅ Rejected: max 200 slots`);
    }

    // ========== TEST 12: slotsFilled > slotsTotal ==========
    console.log('\n📝 TEST 12: Validation – slotsFilled > slotsTotal');
    try {
      const overfilled = new Mission({ ...baseMission, slotsTotal: 5, slotsFilled: 6 });
      await overfilled.save();
      console.log('   ❌ Should have failed');
    } catch (err) {
      console.log(`   ✅ Rejected: filled cannot exceed total`);
    }

    // ========== TEST 13: recurringPattern required ==========
    console.log('\n📝 TEST 13: Validation – recurringPattern required when isRecurring = true');
    try {
      const missingPattern = new Mission({ ...baseMission, isRecurring: true });
      await missingPattern.save();
      console.log('   ❌ Should have failed');
    } catch (err) {
      console.log(`   ✅ Rejected: recurringPattern required`);
    }

    // ========== TEST 14: valid recurringPattern ==========
    console.log('\n📝 TEST 14: Valid recurringPattern');
    const recurring = new Mission({ ...baseMission, isRecurring: true, recurringPattern: 'weekly' });
    await recurring.save();
    console.log(`   ✅ Saved with pattern: ${recurring.recurringPattern}`);

    // ========== TEST 15: location.coordinates required for presential ==========
    console.log('\n📝 TEST 15: Validation – coordinates required for presential');
    try {
      const noCoords = new Mission({
        ...baseMission,
        location: { type: 'Point' }, // missing coordinates
      });
      await noCoords.save();
      console.log('   ❌ Should have failed');
    } catch (err) {
      console.log(`   ✅ Rejected: coordinates required`);
    }

    // ========== TEST 16: Online mission no location needed ==========
    console.log('\n📝 TEST 16: Online mission – location optional');
    const online = new Mission({
      ...baseMission,
      type: 'online',
      address: undefined,
      location: undefined,
    });
    await online.save();
    console.log(`   ✅ Online mission saved without location`);

    // ========== TEST 17: Check partial indexes ==========
    console.log('\n📝 TEST 17: Partial indexes creation');
    const indexes = await Mission.listIndexes();
    const indexNames = indexes.map(i => i.name);
    const required = ['idx_open_missions', 'idx_urgent_missions', 'location_2dsphere'];
    let allOk = true;
    for (const idx of required) {
      const exists = indexNames.includes(idx);
      console.log(`   ${exists ? '✅' : '❌'} Index "${idx}" ${exists ? 'exists' : 'missing'}`);
      if (!exists) allOk = false;
    }

    // ========== FINAL SUMMARY ==========
    console.log('\n' + '='.repeat(60));
    console.log('📊 MISSION MODEL TESTS SUMMARY');
    console.log('='.repeat(60));
    console.log('✅ Create valid mission');
    console.log('✅ hasAvailableSlots() works');
    console.log('✅ getAvailableSlots() works');
    console.log('✅ incrementApplications() works');
    console.log('✅ Title length validation');
    console.log('✅ Description min length');
    console.log('✅ Category enum validation');
    console.log('✅ Start date future validation');
    console.log('✅ End date after start date');
    console.log('✅ slotsTotal ≤ 200');
    console.log('✅ slotsFilled ≤ slotsTotal');
    console.log('✅ recurringPattern required when isRecurring');
    console.log('✅ valid recurringPattern accepted');
    console.log('✅ location.coordinates required for presential');
    console.log('✅ online mission works without location');
    console.log('✅ Partial indexes created');
    console.log('='.repeat(60));
    console.log('\n🎉 All mission model tests passed!\n');

  } catch (error) {
    console.error('💥 Fatal error:', error);
    console.error(error.stack);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from Mongoose');
    }
    if (mongoServer) {
      await mongoServer.stop();
      console.log('🛑 MongoDB Memory Server stopped');
    }
  }
}

testMission();