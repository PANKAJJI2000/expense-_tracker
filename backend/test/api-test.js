/**
 * ============================================================
 *  Expense Tracker - Automated API Testing Script
 *  Run: node test/api-test.js
 * ============================================================
 *  Tests all CRUD endpoints with dummy data:
 *    1. Auth (Signup, Login)
 *    2. Profile (Create, Get, Update, Delete by userId)
 *    3. Categories (Create, Get, Update, Delete, Top 5)
 *    4. Expenses (Create, Get, Summary, Update, Delete)
 *    5. Transactions (Create, Get, Summary, Update, Delete)
 *    6. Budgets (Create, Get, Update, Delete)
 * ============================================================
 */

const http = require("http");
const https = require("https");

// ─── CONFIG ──────────────────────────────────────────────────
const BASE_URL = process.env.API_URL || "http://localhost:5000/api";
const TEST_USER = {
  name: "TestUser2026",
  email: "testuser2026_" + Date.now() + "@example.com", // unique per run
  password: "Test@12345",
  phone: "+919876543210",
  gender: "male",
  currency: "INR",
};

// ─── State shared across tests ──────────────────────────────
let TOKEN = null;
let USER_ID = null;
let PROFILE_ID = null;
let CATEGORY_IDS = [];
let EXPENSE_ID = null;
let TRANSACTION_ID = null;
let BUDGET_ID = null;

// ─── Counters ───────────────────────────────────────────────
let passed = 0;
let failed = 0;
let skipped = 0;

// ─── HELPERS ─────────────────────────────────────────────────
function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const isHttps = url.protocol === "https:";
    const lib = isHttps ? https : http;

    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const payload = body ? JSON.stringify(body) : null;
    if (payload) headers["Content-Length"] = Buffer.byteLength(payload);

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers,
    };

    const req = lib.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({ status: res.statusCode, data: parsed });
      });
    });

    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function log(icon, msg) {
  console.log(`  ${icon}  ${msg}`);
}

async function test(name, fn) {
  try {
    await fn();
    passed++;
    log("✅", name);
  } catch (err) {
    failed++;
    log("❌", `${name} → ${err.message}`);
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}

function skip(name, reason) {
  skipped++;
  log("⏭️ ", `${name} (skipped: ${reason})`);
}

function section(title) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${"═".repeat(60)}`);
}

// ─── TEST SUITES ─────────────────────────────────────────────

async function testHealth() {
  section("🏥 HEALTH CHECK");
  await test("GET /health", async () => {
    const res = await request("GET", "/health");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.status, "Missing status field");
    log("📋", `DB: ${res.data.database} | Env: ${res.data.environment}`);
  });
}

// ──────────────────────────────────────────────────────────────
async function testAuth() {
  section("🔐 AUTHENTICATION");

  // 1 — Signup
  await test("POST /auth/signup — Register new user", async () => {
    const res = await request("POST", "/auth/signup", TEST_USER);
    assert(
      res.status === 201 || res.status === 200,
      `Expected 201, got ${res.status}: ${JSON.stringify(res.data)}`
    );
    assert(res.data.success, "success should be true");
    TOKEN = res.data.data?.token || res.data.token;
    USER_ID = res.data.data?.user?.id || res.data.data?.user?._id;
    assert(TOKEN, "No token returned");
    assert(USER_ID, "No userId returned");
    log("📋", `Token: ${TOKEN.substring(0, 30)}...`);
    log("📋", `User ID: ${USER_ID}`);
  });

  // 2 — Login
  await test("POST /auth/login — Login with credentials", async () => {
    const res = await request("POST", "/auth/login", {
      email: TEST_USER.email,
      password: TEST_USER.password,
    });
    assert(res.status === 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.data)}`);
    assert(res.data.success, "success should be true");
    // Refresh token from login
    TOKEN = res.data.data?.token || res.data.token || TOKEN;
    USER_ID = res.data.data?.user?.id || res.data.data?.user?._id || USER_ID;
    log("📋", `Login successful for: ${res.data.data?.user?.email}`);
  });

  // 3 — Signup duplicate should fail
  await test("POST /auth/signup — Duplicate email rejected", async () => {
    const res = await request("POST", "/auth/signup", TEST_USER);
    assert(
      res.status === 400,
      `Expected 400 for duplicate, got ${res.status}`
    );
  });

  // 4 — Login with wrong password
  await test("POST /auth/login — Wrong password rejected", async () => {
    const res = await request("POST", "/auth/login", {
      email: TEST_USER.email,
      password: "wrongpassword",
    });
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });
}

// ──────────────────────────────────────────────────────────────
async function testProfile() {
  section("👤 PROFILE MANAGEMENT (via /api/profiles/user/:userId)");

  if (!TOKEN || !USER_ID) {
    skip("Profile tests", "No auth token/userId");
    return;
  }

  // 1 — Create Profile
  await test("POST /profiles — Create profile", async () => {
    const res = await request(
      "POST",
      "/profiles",
      {
        userId: USER_ID,
        name: TEST_USER.name,
        email: TEST_USER.email,
        phone: TEST_USER.phone,
        gender: TEST_USER.gender,
        currency: TEST_USER.currency,
      },
      TOKEN
    );
    assert(
      res.status === 201 || res.status === 200,
      `Expected 201, got ${res.status}: ${JSON.stringify(res.data)}`
    );
    PROFILE_ID = res.data.data?._id || res.data.data?.id;
    log("📋", `Profile ID: ${PROFILE_ID}`);
  });

  // 2 — Get Profile by User ID
  await test("GET /profiles/user/:userId — Get profile by user ID", async () => {
    const res = await request("GET", `/profiles/user/${USER_ID}`, null, TOKEN);
    assert(res.status === 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.data)}`);
    assert(res.data.success, "success should be true");
    assert(res.data.data, "Should return profile data");
    log("📋", `Name: ${res.data.data.name}, Email: ${res.data.data.email}`);
  });

  // 3 — Get All Profiles
  await test("GET /profiles — Get all profiles", async () => {
    const res = await request("GET", "/profiles", null, TOKEN);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    log("📋", `Total profiles: ${res.data.count || res.data.data?.length}`);
  });

  // 4 — Update Profile by User ID
  await test("PUT /profiles/user/:userId — Update profile", async () => {
    const res = await request(
      "PUT",
      `/profiles/user/${USER_ID}`,
      {
        name: "Updated TestUser",
        phone: "+919999888877",
        gender: "male",
        currency: "USD",
      },
      TOKEN
    );
    assert(res.status === 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.data)}`);
    assert(res.data.success, "success should be true");
    log("📋", `Updated name: ${res.data.data?.profile?.name || res.data.data?.user?.name}`);
  });

  // 5 — Get updated profile to verify
  await test("GET /profiles/user/:userId — Verify update", async () => {
    const res = await request("GET", `/profiles/user/${USER_ID}`, null, TOKEN);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const name = res.data.data?.name;
    assert(name === "Updated TestUser", `Name should be 'Updated TestUser', got '${name}'`);
    log("📋", `Verified name: ${name}, currency: ${res.data.data?.currency}`);
  });

  // 6 — Get Profile by ID
  if (PROFILE_ID) {
    await test("GET /profiles/:id — Get profile by profile ID", async () => {
      const res = await request("GET", `/profiles/${PROFILE_ID}`, null, TOKEN);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      log("📋", `Profile found: ${res.data.data?.name}`);
    });
  }
}

// ──────────────────────────────────────────────────────────────
async function testCategories() {
  section("📂 CATEGORY MANAGEMENT");

  const dummyCategories = [
    { name: "Food & Dining", type: "expense", description: "Restaurants, groceries, snacks" },
    { name: "Transport", type: "expense", description: "Fuel, taxi, public transport" },
    { name: "Shopping", type: "expense", description: "Clothes, electronics, home items" },
    { name: "Entertainment", type: "expense", description: "Movies, games, subscriptions" },
    { name: "Healthcare", type: "expense", description: "Medicine, doctor visits, insurance" },
    { name: "Salary", type: "income", description: "Monthly salary" },
    { name: "Freelance", type: "income", description: "Freelance project income" },
  ];

  // 1 — Create categories
  for (const cat of dummyCategories) {
    await test(`POST /categories — Create "${cat.name}"`, async () => {
      const res = await request("POST", "/categories", cat);
      // 201 = created, 400 = already exists (both are acceptable)
      if (res.status === 400 && res.data.message?.includes("already exists")) {
        log("📋", `"${cat.name}" already exists, skipping`);
        // Try to find its ID
        const allRes = await request("GET", "/categories");
        if (allRes.status === 200) {
          const found = allRes.data.data?.find((c) => c.name === cat.name);
          if (found) CATEGORY_IDS.push(found._id);
        }
        return;
      }
      assert(
        res.status === 201 || res.status === 200,
        `Expected 201, got ${res.status}: ${JSON.stringify(res.data)}`
      );
      if (res.data.data?._id) CATEGORY_IDS.push(res.data.data._id);
      log("📋", `Created with ID: ${res.data.data?._id}`);
    });
  }

  // 2 — Get all categories
  await test("GET /categories — Get all categories", async () => {
    const res = await request("GET", "/categories");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const count = res.data.count || res.data.data?.length;
    log("📋", `Total categories: ${count}`);
    // Collect IDs if we don't have them
    if (CATEGORY_IDS.length === 0 && res.data.data) {
      CATEGORY_IDS = res.data.data.map((c) => c._id);
    }
  });

  // 3 — Filter by type
  await test("GET /categories?type=expense — Filter expense categories", async () => {
    const res = await request("GET", "/categories?type=expense");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    log("📋", `Expense categories: ${res.data.count || res.data.data?.length}`);
  });

  await test("GET /categories?type=income — Filter income categories", async () => {
    const res = await request("GET", "/categories?type=income");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    log("📋", `Income categories: ${res.data.count || res.data.data?.length}`);
  });

  // 4 — Get by ID
  if (CATEGORY_IDS.length > 0) {
    await test("GET /categories/:id — Get single category", async () => {
      const res = await request("GET", `/categories/${CATEGORY_IDS[0]}`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      log("📋", `Category: ${res.data.data?.name} (${res.data.data?.type})`);
    });
  }

  // 5 — Update category
  if (CATEGORY_IDS.length > 0) {
    await test("PUT /categories/:id — Update category", async () => {
      const res = await request("PUT", `/categories/${CATEGORY_IDS[0]}`, {
        name: "Food & Dining",
        description: "Updated: All food-related expenses",
        type: "expense",
      });
      assert(res.status === 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.data)}`);
      log("📋", `Updated: ${res.data.data?.name}`);
    });
  }
}

// ──────────────────────────────────────────────────────────────
async function testExpenses() {
  section("💰 EXPENSE MANAGEMENT (Auth Required)");

  if (!TOKEN) {
    skip("Expense tests", "No auth token");
    return;
  }

  const dummyExpenses = [
    { title: "Grocery Shopping", amount: 2500, date: "2026-02-15", category: "Food & Dining", fullName: TEST_USER.name, email: TEST_USER.email, phone: TEST_USER.phone },
    { title: "Uber Ride", amount: 350, date: "2026-02-14", category: "Transport", fullName: TEST_USER.name, email: TEST_USER.email, phone: TEST_USER.phone },
    { title: "Netflix Subscription", amount: 649, date: "2026-02-01", category: "Entertainment", fullName: TEST_USER.name, email: TEST_USER.email, phone: TEST_USER.phone },
    { title: "New Headphones", amount: 3999, date: "2026-02-10", category: "Shopping", fullName: TEST_USER.name, email: TEST_USER.email, phone: TEST_USER.phone },
    { title: "Doctor Visit", amount: 1500, date: "2026-02-12", category: "Healthcare", fullName: TEST_USER.name, email: TEST_USER.email, phone: TEST_USER.phone },
    { title: "Pizza Dinner", amount: 800, date: "2026-02-16", category: "Food & Dining", fullName: TEST_USER.name, email: TEST_USER.email, phone: TEST_USER.phone },
    { title: "Bus Pass", amount: 500, date: "2026-02-01", category: "Transport", fullName: TEST_USER.name, email: TEST_USER.email, phone: TEST_USER.phone },
    { title: "Movie Tickets", amount: 600, date: "2026-02-08", category: "Entertainment", fullName: TEST_USER.name, email: TEST_USER.email, phone: TEST_USER.phone },
  ];

  // 1 — Create expenses
  for (const exp of dummyExpenses) {
    await test(`POST /expenses — "${exp.title}" (₹${exp.amount})`, async () => {
      const res = await request("POST", "/expenses", exp, TOKEN);
      assert(
        res.status === 201 || res.status === 200,
        `Expected 201, got ${res.status}: ${JSON.stringify(res.data)}`
      );
      if (!EXPENSE_ID) EXPENSE_ID = res.data.data?._id;
      log("📋", `Created expense ID: ${res.data.data?._id}`);
    });
  }

  // 2 — Get all expenses
  await test("GET /expenses — Get all expenses", async () => {
    const res = await request("GET", "/expenses", null, TOKEN);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    log("📋", `Total expenses: ${res.data.count}`);
  });

  // 3 — Get current month expenses
  await test("GET /expenses?currentMonth=true — Current month", async () => {
    const res = await request("GET", "/expenses?currentMonth=true", null, TOKEN);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    log("📋", `Current month expenses: ${res.data.count}`);
  });

  // 4 — Get expense summary
  await test("GET /expenses/summary — Expense summary", async () => {
    const res = await request("GET", "/expenses/summary", null, TOKEN);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    log("📋", `Total: ₹${res.data.totalExpenses}`);
  });

  // 5 — Update expense
  if (EXPENSE_ID) {
    await test("PUT /expenses/:id — Update expense", async () => {
      const res = await request(
        "PUT",
        `/expenses/${EXPENSE_ID}`,
        { amount: 2800 },
        TOKEN
      );
      assert(res.status === 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.data)}`);
      log("📋", `Updated amount to ₹2800`);
    });
  }
}

// ──────────────────────────────────────────────────────────────
async function testTopCategories() {
  section("🏆 TOP CATEGORIES");

  // 1 — Lifetime
  await test("GET /categories/top — Top 5 (lifetime)", async () => {
    const res = await request("GET", "/categories/top?limit=5");
    assert(res.status === 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.data)}`);
    assert(res.data.success, "success should be true");
    log("📋", `Total expenses: ₹${res.data.totalExpenses}`);
    if (res.data.highestExpense) {
      log("📋", `Highest: ${res.data.highestExpense.category} (${res.data.highestExpense.percentage}%)`);
    }
    if (res.data.data) {
      res.data.data.forEach((cat) => {
        log("   ", `#${cat.rank} ${cat.category}: ₹${cat.totalAmount} (${cat.percentage}%)`);
      });
    }
  });

  // 2 — Monthly
  await test("GET /categories/top?period=monthly — Top 5 (monthly)", async () => {
    const res = await request("GET", "/categories/top?limit=5&period=monthly");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    log("📋", `Monthly top categories: ${res.data.count} results`);
  });

  // 3 — Weekly
  await test("GET /categories/top?period=weekly — Top 5 (weekly)", async () => {
    const res = await request("GET", "/categories/top?limit=5&period=weekly");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    log("📋", `Weekly top categories: ${res.data.count} results`);
  });
}

// ──────────────────────────────────────────────────────────────
async function testTransactions() {
  section("💳 TRANSACTION MANAGEMENT (Auth Required)");

  if (!TOKEN) {
    skip("Transaction tests", "No auth token");
    return;
  }

  const dummyTransactions = [
    { title: "Monthly Salary", amount: 50000, type: "income", category: "Salary", date: "2026-02-01" },
    { title: "Freelance Project", amount: 15000, type: "income", category: "Freelance", date: "2026-02-10" },
    { title: "Electricity Bill", amount: 1200, type: "expense", category: "Utilities", date: "2026-02-05" },
    { title: "Internet Bill", amount: 999, type: "expense", category: "Utilities", date: "2026-02-05" },
  ];

  // 1 — Create transactions
  for (const txn of dummyTransactions) {
    await test(`POST /transactions — "${txn.title}" (${txn.type}: ₹${txn.amount})`, async () => {
      const res = await request("POST", "/transactions", txn, TOKEN);
      assert(
        res.status === 201 || res.status === 200,
        `Expected 201, got ${res.status}: ${JSON.stringify(res.data)}`
      );
      if (!TRANSACTION_ID) TRANSACTION_ID = res.data.data?._id;
      log("📋", `Transaction ID: ${res.data.data?._id}`);
    });
  }

  // 2 — Get all transactions
  await test("GET /transactions — Get all transactions", async () => {
    const res = await request("GET", "/transactions", null, TOKEN);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const count = res.data.count || res.data.data?.length || res.data.transactions?.length;
    log("📋", `Total transactions: ${count}`);
  });

  // 3 — Get transaction summary
  await test("GET /transactions/summary — Transaction summary", async () => {
    const res = await request("GET", "/transactions/summary", null, TOKEN);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    log("📋", `Summary: ${JSON.stringify(res.data.data || res.data).substring(0, 100)}`);
  });

  // 4 — Update transaction
  if (TRANSACTION_ID) {
    await test("PUT /transactions/:id — Update transaction", async () => {
      const res = await request(
        "PUT",
        `/transactions/${TRANSACTION_ID}`,
        { amount: 55000 },
        TOKEN
      );
      assert(res.status === 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.data)}`);
      log("📋", `Updated salary to ₹55,000`);
    });
  }
}

// ──────────────────────────────────────────────────────────────
async function testBudgets() {
  section("📊 BUDGET MANAGEMENT (Auth Required)");

  if (!TOKEN) {
    skip("Budget tests", "No auth token");
    return;
  }

  // 1 — Create budget for Feb 2026
  await test("POST /budgets — Create Feb 2026 budget", async () => {
    const res = await request(
      "POST",
      "/budgets",
      {
        totalBudget: 25000,
        month: 2,
        year: 2026,
        currency: "INR",
        notes: "February 2026 monthly budget",
      },
      TOKEN
    );
    assert(
      res.status === 201 || res.status === 200,
      `Expected 201, got ${res.status}: ${JSON.stringify(res.data)}`
    );
    BUDGET_ID = res.data.data?._id;
    log("📋", `Budget ID: ${BUDGET_ID}`);
    log("📋", `Budget: ₹${res.data.data?.totalBudget} for ${res.data.data?.month}/${res.data.data?.year}`);
  });

  // 2 — Get budgets
  await test("GET /budgets — Get all budgets", async () => {
    const res = await request("GET", "/budgets", null, TOKEN);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const count = res.data.count || res.data.data?.length;
    log("📋", `Total budgets: ${count}`);
  });

  // 3 — Get current budget
  await test("GET /budgets/current — Get current month budget", async () => {
    const res = await request("GET", "/budgets/current", null, TOKEN);
    // 200 or 404 (if no budget set for current month) are both acceptable
    assert(
      res.status === 200 || res.status === 404,
      `Expected 200/404, got ${res.status}`
    );
    if (res.status === 200) {
      log("📋", `Current budget: ₹${res.data.data?.totalBudget}`);
    } else {
      log("📋", `No budget for current month`);
    }
  });

  // 4 — Update budget
  if (BUDGET_ID) {
    await test("PUT /budgets/:id — Update budget", async () => {
      const res = await request(
        "PUT",
        `/budgets/${BUDGET_ID}`,
        { totalBudget: 30000, notes: "Updated February budget" },
        TOKEN
      );
      assert(res.status === 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.data)}`);
      log("📋", `Updated budget to ₹30,000`);
    });
  }
}

// ──────────────────────────────────────────────────────────────
async function testCleanup() {
  section("🧹 CLEANUP — Delete test data");

  // Delete test expense
  if (EXPENSE_ID && TOKEN) {
    await test("DELETE /expenses/:id — Delete test expense", async () => {
      const res = await request("DELETE", `/expenses/${EXPENSE_ID}`, null, TOKEN);
      assert(
        res.status === 200 || res.status === 204,
        `Expected 200, got ${res.status}: ${JSON.stringify(res.data)}`
      );
    });
  }

  // Delete test transaction
  if (TRANSACTION_ID && TOKEN) {
    await test("DELETE /transactions/:id — Delete test transaction", async () => {
      const res = await request("DELETE", `/transactions/${TRANSACTION_ID}`, null, TOKEN);
      assert(
        res.status === 200 || res.status === 204,
        `Expected 200, got ${res.status}: ${JSON.stringify(res.data)}`
      );
    });
  }

  // Delete test budget
  if (BUDGET_ID && TOKEN) {
    await test("DELETE /budgets/:id — Delete test budget", async () => {
      const res = await request("DELETE", `/budgets/${BUDGET_ID}`, null, TOKEN);
      assert(
        res.status === 200 || res.status === 204,
        `Expected 200, got ${res.status}: ${JSON.stringify(res.data)}`
      );
    });
  }

  // Delete one test category (keep others as useful data)
  if (CATEGORY_IDS.length > 5) {
    const lastCatId = CATEGORY_IDS[CATEGORY_IDS.length - 1];
    await test("DELETE /categories/:id — Delete last test category", async () => {
      const res = await request("DELETE", `/categories/${lastCatId}`);
      assert(
        res.status === 200 || res.status === 204,
        `Expected 200, got ${res.status}: ${JSON.stringify(res.data)}`
      );
    });
  }

  // Delete profile by user ID
  if (USER_ID && TOKEN) {
    await test("DELETE /profiles/user/:userId — Delete profile by user ID", async () => {
      const res = await request("DELETE", `/profiles/user/${USER_ID}`, null, TOKEN);
      assert(
        res.status === 200 || res.status === 204 || res.status === 404,
        `Expected 200, got ${res.status}: ${JSON.stringify(res.data)}`
      );
    });
  }
}

// ──────────────────────────────────────────────────────────────
async function main() {
  console.log("\n" + "█".repeat(60));
  console.log("  EXPENSE TRACKER — API TEST SUITE");
  console.log("  Base URL: " + BASE_URL);
  console.log("  Date: " + new Date().toISOString());
  console.log("█".repeat(60));

  try {
    await testHealth();
    await testAuth();
    await testProfile();
    await testCategories();
    await testExpenses();
    await testTopCategories();
    await testTransactions();
    await testBudgets();
    await testCleanup();
  } catch (err) {
    console.error("\n🔥 FATAL ERROR:", err.message);
  }

  // ── Summary ────────────────────────────────────────────────
  console.log("\n" + "═".repeat(60));
  console.log("  📊 TEST RESULTS SUMMARY");
  console.log("═".repeat(60));
  console.log(`  ✅ Passed:  ${passed}`);
  console.log(`  ❌ Failed:  ${failed}`);
  console.log(`  ⏭️  Skipped: ${skipped}`);
  console.log(`  📝 Total:   ${passed + failed + skipped}`);
  console.log("═".repeat(60));

  if (failed > 0) {
    console.log("\n⚠️  Some tests failed. Check the output above for details.\n");
    process.exit(1);
  } else {
    console.log("\n🎉 All tests passed!\n");
    process.exit(0);
  }
}

main();
