import 'package:flutter/material.dart';
import 'expense_service.dart';

void main() {
  runApp(const MaterialApp(home: ExpenseTrackerApp()));
}

class ExpenseTrackerApp extends StatefulWidget {
  const ExpenseTrackerApp({super.key});

  @override
  State<ExpenseTrackerApp> createState() => _ExpenseTrackerAppState();
}

class _ExpenseTrackerAppState extends State<ExpenseTrackerApp> {
  // Initialize the API client
  final api = ExpenseTrackerAPI(baseUrl: "http://10.0.2.2:3000/api");
  
  // State variables
  bool isLoading = false;
  bool isLoggedIn = false;
  String? errorMessage;
  List<dynamic> transactions = [];
  List<dynamic> categories = [];
  Map<String, dynamic>? userProfile;
  Map<String, dynamic>? currentBudget;
  
  // Controllers
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  final itemController = TextEditingController();
  final amountController = TextEditingController();

  @override
  void initState() {
    super.initState();
  }

  // Login function
  Future<void> login() async {
    setState(() {
      isLoading = true;
      errorMessage = null;
    });

    final result = await api.auth.login(
      email: emailController.text,
      password: passwordController.text,
    );

    setState(() => isLoading = false);

    if (result.success) {
      setState(() => isLoggedIn = true);
      await loadDashboardData();
    } else {
      setState(() => errorMessage = result.error ?? 'Login failed');
    }
  }

  // Register function
  Future<void> register() async {
    setState(() {
      isLoading = true;
      errorMessage = null;
    });

    final result = await api.auth.signup(
      name: emailController.text.split('@')[0],
      email: emailController.text,
      password: passwordController.text,
    );

    setState(() => isLoading = false);

    if (result.success) {
      setState(() => isLoggedIn = true);
      await loadDashboardData();
    } else {
      setState(() => errorMessage = result.error ?? 'Registration failed');
    }
  }

  // Load all dashboard data
  Future<void> loadDashboardData() async {
    setState(() => isLoading = true);

    // Load transactions
    final transResult = await api.transactions.getTransactions(limit: 20);
    if (transResult.success && transResult.data != null) {
      setState(() => transactions = transResult.data!['transactions'] ?? []);
    }

    // Load categories
    final catResult = await api.categories.getAllCategories();
    if (catResult.success && catResult.data != null) {
      setState(() => categories = catResult.data!);
    }

    // Load profile
    final profileResult = await api.profiles.getMyProfile();
    if (profileResult.success) {
      setState(() => userProfile = profileResult.data);
    }

    // Load current month budget
    final now = DateTime.now();
    final budgetResult = await api.budgets.getBudgetByMonth(
      month: now.month,
      year: now.year,
    );
    if (budgetResult.success) {
      setState(() => currentBudget = budgetResult.data);
    }

    setState(() => isLoading = false);
  }

  // Add new transaction
  Future<void> addTransaction(String type) async {
    if (itemController.text.isEmpty || amountController.text.isEmpty) {
      setState(() => errorMessage = 'Please fill all fields');
      return;
    }

    setState(() => isLoading = true);

    final result = await api.transactions.createTransaction(
      item: itemController.text,
      amount: double.parse(amountController.text),
      type: type,
      category: 'General',
    );

    if (result.success) {
      itemController.clear();
      amountController.clear();
      await loadDashboardData();
    } else {
      setState(() {
        isLoading = false;
        errorMessage = result.error ?? 'Failed to add transaction';
      });
    }
  }

  // Logout function
  void logout() {
    api.clearAuth();
    setState(() {
      isLoggedIn = false;
      transactions = [];
      categories = [];
      userProfile = null;
      currentBudget = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(isLoggedIn ? "Dashboard" : "Expense Tracker"),
        backgroundColor: Colors.green,
        foregroundColor: Colors.white,
        actions: isLoggedIn
            ? [
                IconButton(
                  icon: const Icon(Icons.refresh),
                  onPressed: loadDashboardData,
                ),
                IconButton(
                  icon: const Icon(Icons.logout),
                  onPressed: logout,
                ),
              ]
            : null,
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : isLoggedIn
              ? _buildDashboard()
              : _buildLoginScreen(),
    );
  }

  // Login/Register Screen
  Widget _buildLoginScreen() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(height: 50),
          const Icon(Icons.account_balance_wallet, size: 100, color: Colors.green),
          const SizedBox(height: 20),
          const Text(
            'Expense Tracker',
            style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 40),
          
          if (errorMessage != null)
            Container(
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.only(bottom: 20),
              decoration: BoxDecoration(
                color: Colors.red.shade100,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(errorMessage!, style: TextStyle(color: Colors.red.shade900)),
            ),
          
          TextField(
            controller: emailController,
            decoration: const InputDecoration(
              labelText: "Email",
              border: OutlineInputBorder(),
              prefixIcon: Icon(Icons.email),
            ),
            keyboardType: TextInputType.emailAddress,
          ),
          const SizedBox(height: 16),
          TextField(
            controller: passwordController,
            decoration: const InputDecoration(
              labelText: "Password",
              border: OutlineInputBorder(),
              prefixIcon: Icon(Icons.lock),
            ),
            obscureText: true,
          ),
          const SizedBox(height: 24),
          
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: login,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: const Text("Login", style: TextStyle(fontSize: 18)),
            ),
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: register,
            child: const Text("Don't have an account? Register"),
          ),
        ],
      ),
    );
  }

  // Dashboard Screen
  Widget _buildDashboard() {
    final totalExpense = transactions
        .where((t) => t['type'] == 'expense')
        .fold(0.0, (sum, t) => sum + (t['amount'] ?? 0));
    final totalIncome = transactions
        .where((t) => t['type'] == 'income')
        .fold(0.0, (sum, t) => sum + (t['amount'] ?? 0));

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // User greeting
          if (userProfile != null)
            Text(
              'Hello, ${userProfile!['name'] ?? 'User'}!',
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
          const SizedBox(height: 20),
          
          // Summary cards
          Row(
            children: [
              Expanded(
                child: _buildSummaryCard(
                  'Income',
                  '₹${totalIncome.toStringAsFixed(2)}',
                  Colors.green,
                  Icons.arrow_upward,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildSummaryCard(
                  'Expense',
                  '₹${totalExpense.toStringAsFixed(2)}',
                  Colors.red,
                  Icons.arrow_downward,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          
          // Budget card
          if (currentBudget != null)
            _buildBudgetCard(totalExpense),
          
          const SizedBox(height: 24),
          
          // Add transaction section
          const Text(
            'Add Transaction',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: itemController,
            decoration: const InputDecoration(
              labelText: "Item Name",
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: amountController,
            decoration: const InputDecoration(
              labelText: "Amount (₹)",
              border: OutlineInputBorder(),
            ),
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => addTransaction('expense'),
                  icon: const Icon(Icons.remove_circle_outline),
                  label: const Text("Add Expense"),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red,
                    foregroundColor: Colors.white,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => addTransaction('income'),
                  icon: const Icon(Icons.add_circle_outline),
                  label: const Text("Add Income"),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    foregroundColor: Colors.white,
                  ),
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 24),
          
          // Recent transactions
          const Text(
            'Recent Transactions',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          
          if (transactions.isEmpty)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(20),
                child: Text('No transactions yet'),
              ),
            )
          else
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: transactions.length > 10 ? 10 : transactions.length,
              itemBuilder: (context, index) {
                final transaction = transactions[index];
                final isExpense = transaction['type'] == 'expense';
                return Card(
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: isExpense ? Colors.red.shade100 : Colors.green.shade100,
                      child: Icon(
                        isExpense ? Icons.arrow_downward : Icons.arrow_upward,
                        color: isExpense ? Colors.red : Colors.green,
                      ),
                    ),
                    title: Text(transaction['item'] ?? 'Unknown'),
                    subtitle: Text(transaction['category'] ?? 'General'),
                    trailing: Text(
                      '${isExpense ? "-" : "+"}₹${transaction['amount']}',
                      style: TextStyle(
                        color: isExpense ? Colors.red : Colors.green,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                  ),
                );
              },
            ),
        ],
      ),
    );
  }

  Widget _buildSummaryCard(String title, String amount, Color color, IconData icon) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: color, size: 20),
                const SizedBox(width: 8),
                Text(title, style: TextStyle(color: Colors.grey.shade600)),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              amount,
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBudgetCard(double spent) {
    final budget = currentBudget!['totalBudget']?.toDouble() ?? 0.0;
    final remaining = budget - spent;
    final percentage = budget > 0 ? (spent / budget).clamp(0.0, 1.0) : 0.0;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Monthly Budget', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            LinearProgressIndicator(
              value: percentage,
              backgroundColor: Colors.grey.shade200,
              valueColor: AlwaysStoppedAnimation<Color>(
                percentage > 0.8 ? Colors.red : Colors.green,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Spent: ₹${spent.toStringAsFixed(2)}'),
                Text(
                  'Remaining: ₹${remaining.toStringAsFixed(2)}',
                  style: TextStyle(
                    color: remaining < 0 ? Colors.red : Colors.green,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    emailController.dispose();
    passwordController.dispose();
    itemController.dispose();
    amountController.dispose();
    super.dispose();
  }
}