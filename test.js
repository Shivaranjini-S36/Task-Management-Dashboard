/**
 * Automated Test Suite for TaskFlow API
 * Self-contained test suite that boots the Express app and tests all endpoints
 */

const http = require('http');
const app = require('./server');

const TEST_PORT = 5001;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

let server;

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const postData = body ? JSON.stringify(body) : null;

    const options = {
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting TaskFlow API Test Suite...\n');
  let passed = 0;
  let failed = 0;

  // Start test server
  await new Promise((resolve) => {
    server = app.listen(TEST_PORT, '127.0.0.1', () => {
      console.log(`[Test Server] Running on http://127.0.0.1:${TEST_PORT}\n`);
      resolve();
    });
  });

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name}`);
      console.error(`   Error: ${err.message}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    await test('GET /api/health returns healthy', async () => {
      const res = await request('GET', '/api/health');
      if (res.status !== 200 || res.data.status !== 'healthy') {
        throw new Error(`Unexpected status ${res.status}: ${JSON.stringify(res.data)}`);
      }
    });

    // 2. Initial stats
    await test('GET /api/tasks/stats returns stat counts', async () => {
      const res = await request('GET', '/api/tasks/stats');
      if (res.status !== 200 || !res.data.stats) {
        throw new Error(`Stats missing: ${JSON.stringify(res.data)}`);
      }
    });

    // 3. Create task (Add Task)
    let createdTaskId = null;
    await test('POST /api/tasks creates a new task', async () => {
      const res = await request('POST', '/api/tasks', {
        name: 'FSWD Lab',
        description: 'on 26/11/26',
        reminderDate: '2026-11-19T11:01:00.000Z',
        status: 'Pending'
      });

      if (res.status !== 201 || !res.data.task) {
        throw new Error(`Task creation failed: ${JSON.stringify(res.data)}`);
      }
      createdTaskId = res.data.task._id || res.data.task.id;
    });

    // 4. Validation: Task name required
    await test('POST /api/tasks validates required task name', async () => {
      const res = await request('POST', '/api/tasks', {
        name: '   ',
        description: 'Invalid task'
      });
      if (res.status !== 400 || res.data.success !== false) {
        throw new Error(`Validation failed to block empty name: ${JSON.stringify(res.data)}`);
      }
    });

    // 5. Update task status (Pending -> In Progress)
    await test('PATCH /api/tasks/:id/status updates status to "In Progress"', async () => {
      const res = await request('PATCH', `/api/tasks/${createdTaskId}/status`, {
        status: 'In Progress'
      });
      if (res.status !== 200 || res.data.task.status !== 'In Progress') {
        throw new Error(`Status update failed: ${JSON.stringify(res.data)}`);
      }
    });

    // 6. Update task status (In Progress -> Completed)
    await test('PATCH /api/tasks/:id/status updates status to "Completed"', async () => {
      const res = await request('PATCH', `/api/tasks/${createdTaskId}/status`, {
        status: 'Completed'
      });
      if (res.status !== 200 || res.data.task.status !== 'Completed') {
        throw new Error(`Status update failed: ${JSON.stringify(res.data)}`);
      }
    });

    // 7. Edit task details
    await test('PUT /api/tasks/:id updates task details', async () => {
      const res = await request('PUT', `/api/tasks/${createdTaskId}`, {
        name: 'FSWD Lab Final Submission',
        description: 'Completed and submitted',
        status: 'Completed'
      });
      if (res.status !== 200 || res.data.task.name !== 'FSWD Lab Final Submission') {
        throw new Error(`Task update failed: ${JSON.stringify(res.data)}`);
      }
    });

    // 8. Search tasks
    await test('GET /api/tasks?search=Submission finds matching task', async () => {
      const res = await request('GET', '/api/tasks?search=Submission');
      if (res.status !== 200 || res.data.tasks.length === 0) {
        throw new Error(`Search failed: ${JSON.stringify(res.data)}`);
      }
    });

    // 9. Delete task
    await test('DELETE /api/tasks/:id removes the task', async () => {
      const res = await request('DELETE', `/api/tasks/${createdTaskId}`);
      if (res.status !== 200 || res.data.success !== true) {
        throw new Error(`Delete failed: ${JSON.stringify(res.data)}`);
      }
    });

    // 10. Audit History
    await test('GET /api/tasks/history/all returns audit history', async () => {
      const res = await request('GET', '/api/tasks/history/all');
      if (res.status !== 200 || !Array.isArray(res.data.history)) {
        throw new Error(`History endpoint failed: ${JSON.stringify(res.data)}`);
      }
    });

  } finally {
    if (server) {
      server.close();
    }
  }

  console.log('\n=======================================');
  console.log(`Summary: ${passed} passed, ${failed} failed`);
  console.log('=======================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
