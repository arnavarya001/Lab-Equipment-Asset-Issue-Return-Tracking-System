require('dotenv').config();
const mongoose = require('mongoose');
const BASE_URL = 'http://localhost:3000';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lab_equipment_db';

async function runTests() {
  console.log('🧪 Starting End-to-End System Tests...\n');
  await mongoose.connect(MONGO_URI);


  // Helper to maintain cookies across requests (session simulator)
  class SessionClient {
    constructor() {
      this.cookie = '';
    }

    async post(endpoint, data) {
      const body = new URLSearchParams(data).toString();
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Cookie: this.cookie
        },
        body,
        redirect: 'manual'
      });
      const setCookie = res.headers.get('set-cookie');
      if (setCookie) {
        this.cookie = setCookie.split(';')[0];
      }
      return res;
    }

    async get(endpoint) {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          Cookie: this.cookie
        },
        redirect: 'manual'
      });
      return res;
    }
  }

  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
    }
  }

  // 1. Test Unauthenticated Access Guard
  console.log('--- 1. Testing Unauthenticated Route Guards ---');
  const unauthClient = new SessionClient();
  const resAdminGuard = await unauthClient.get('/admin/dashboard');
  assert(resAdminGuard.status === 302 && resAdminGuard.headers.get('location') === '/login', 'Unauthenticated request to /admin/dashboard redirects to /login');

  const resReqGuard = await unauthClient.get('/requester/dashboard');
  assert(resReqGuard.status === 302 && resReqGuard.headers.get('location') === '/login', 'Unauthenticated request to /requester/dashboard redirects to /login');

  // 2. Test Admin Authentication & Flow
  console.log('\n--- 2. Testing Admin Authentication & Asset CRUD ---');
  const adminClient = new SessionClient();
  const adminLoginRes = await adminClient.post('/login', {
    email: 'admin@college.edu',
    password: 'password123'
  });
  assert(adminLoginRes.status === 302 && adminLoginRes.headers.get('location') === '/admin/dashboard', 'Admin login successful and redirects to /admin/dashboard');

  const adminDashRes = await adminClient.get('/admin/dashboard');
  const adminDashHtml = await adminDashRes.text();
  assert(adminDashRes.status === 200 && adminDashHtml.includes('Admin Dashboard'), 'Admin dashboard renders properly with metrics');

  // Create new asset as Admin
  const newAssetTag = `TST${Math.floor(100 + Math.random() * 900)}`;
  const addAssetRes = await adminClient.post('/admin/assets/add', {
    assetTag: newAssetTag,
    name: 'Spectrophotometer UV-Vis',
    category: 'Chemistry',
    location: 'Chemistry Lab 3',
    condition: 'OK',
    quantity: '5'
  });
  assert(addAssetRes.status === 302 && addAssetRes.headers.get('location') === '/admin/assets', 'Asset creation succeeds and redirects to asset list');

  const assetListRes = await adminClient.get('/admin/assets');
  const assetListHtml = await assetListRes.text();
  assert(assetListHtml.includes(newAssetTag), `Asset list displays newly created asset (${newAssetTag})`);

  // 3. Test Requester Authentication & Equipment Request
  console.log('\n--- 3. Testing Requester Flow & Stock Over-issue Prevention ---');
  const studentClient = new SessionClient();
  const studentLoginRes = await studentClient.post('/login', {
    email: 'student@college.edu',
    password: 'password123'
  });
  assert(studentLoginRes.status === 302 && studentLoginRes.headers.get('location') === '/requester/dashboard', 'Student login successful and redirects to /requester/dashboard');

  // Prevent accessing Admin route as Requester
  const studentForbiddenRes = await studentClient.get('/admin/dashboard');
  assert(studentForbiddenRes.status === 302 && studentForbiddenRes.headers.get('location') === '/login', 'Student blocked from accessing /admin/dashboard');

  // Fetch equipment list to find an available asset ID
  const Asset = require('./models/Asset');
  const testAsset = await Asset.findOne({ assetTag: newAssetTag });
  assert(testAsset && testAsset.availableQuantity === 5, 'Asset initially has 5 available units');

  // Test over-issuing prevention: try requesting 10 units when only 5 exist
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 5);
  const futureDateStr = futureDate.toISOString().split('T')[0];

  const overIssueRes = await studentClient.post('/requester/request', {
    assetId: testAsset._id.toString(),
    quantity: '10', // Exceeds 5!
    purpose: 'Attempting over-issue test',
    expectedReturnDate: futureDateStr
  });
  assert(overIssueRes.status === 302 && overIssueRes.headers.get('location').includes('/requester/request'), 'Server blocks request exceeding available stock');

  // Now submit valid request for 2 units
  const validReqRes = await studentClient.post('/requester/request', {
    assetId: testAsset._id.toString(),
    quantity: '2',
    purpose: 'Biochemical absorbance rate experiment',
    expectedReturnDate: futureDateStr
  });
  assert(validReqRes.status === 302 && validReqRes.headers.get('location') === '/requester/requests', 'Valid request submitted and redirects to My Requests');

  const Request = require('./models/Request');
  const createdRequest = await Request.findOne({ asset: testAsset._id, status: 'Pending' });
  assert(createdRequest && createdRequest.quantity === 2, 'Pending request recorded in MongoDB with requested quantity 2');

  // 4. Test Lab In-charge Approval, Issue, and Return
  console.log('\n--- 4. Testing Lab In-charge Approval, Issue, and Return Handling ---');
  const inchargeClient = new SessionClient();
  const inchargeLoginRes = await inchargeClient.post('/login', {
    email: 'incharge@college.edu',
    password: 'password123'
  });
  assert(inchargeLoginRes.status === 302 && inchargeLoginRes.headers.get('location') === '/lab-incharge/dashboard', 'Lab In-charge login successful');

  // Approve the pending request
  const approveRes = await inchargeClient.post(`/lab-incharge/request/${createdRequest._id}/approve`, {});
  assert(approveRes.status === 302, 'Lab In-charge approves request');

  const approvedDoc = await Request.findById(createdRequest._id);
  assert(approvedDoc.status === 'Approved', 'Request status transitioned to "Approved" in database');

  // Issue the equipment
  const issueRes = await inchargeClient.post(`/lab-incharge/request/${createdRequest._id}/issue`, {});
  assert(issueRes.status === 302 && issueRes.headers.get('location') === '/lab-incharge/returns', 'Equipment issued and redirects to active returns page');

  // Verify stock decrement in database
  const assetAfterIssue = await Asset.findById(testAsset._id);
  assert(assetAfterIssue.availableQuantity === 3, `Asset available quantity decremented from 5 to 3 (actual: ${assetAfterIssue.availableQuantity})`);

  // Record Return with condition 'OK'
  const returnRes = await inchargeClient.post(`/lab-incharge/request/${createdRequest._id}/return`, {
    returnCondition: 'OK',
    remarks: 'Cleaned and returned in proper condition'
  });
  assert(returnRes.status === 302, 'Return recorded successfully');

  const assetAfterReturn = await Asset.findById(testAsset._id);
  assert(assetAfterReturn.availableQuantity === 5, `Asset available quantity restored to 5 after OK return (actual: ${assetAfterReturn.availableQuantity})`);

  const requestAfterReturn = await Request.findById(createdRequest._id);
  assert(requestAfterReturn.status === 'Returned' && requestAfterReturn.returnCondition === 'OK', 'Request marked Returned with returnCondition OK');

  console.log(`\n==============================================`);
  console.log(`🎯 Test Results: ${passed} / ${total} tests PASSED!`);
  console.log(`==============================================\n`);

  process.exit(passed === total ? 0 : 1);
}

runTests().catch((err) => {
  console.error('Test Runner Failed:', err);
  process.exit(1);
});
