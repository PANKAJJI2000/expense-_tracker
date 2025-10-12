import 'package:flutter/material.dart';
import 'expense_service.dart';

void main() {
  runApp(MaterialApp(home: ExpenseApp()));
}

class ExpenseApp extends StatefulWidget {
  @override
  _ExpenseAppState createState() => _ExpenseAppState();
}

class _ExpenseAppState extends State<ExpenseApp> {
  final ExpenseService service = ExpenseService();
  List expenses = [];

  final titleController = TextEditingController();
  final amountController = TextEditingController();

  @override
  void initState() {
    super.initState();
    loadExpenses();
  }

  Future<void> loadExpenses() async {
    final data = await service.getExpenses();
    setState(() => expenses = data);
  }

  Future<void> addExpense() async {
    await service.addExpense(
      titleController.text,
      int.parse(amountController.text),
      DateTime.now().toIso8601String().split("T")[0],
    );
    titleController.clear();
    amountController.clear();
    loadExpenses();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Expense Tracker")),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              itemCount: expenses.length,
              itemBuilder: (context, index) {
                final exp = expenses[index];
                return ListTile(
                  title: Text(exp["title"]),
                  subtitle: Text("₹${exp["amount"]} - ${exp["date"]}"),
                );
              },
            ),
          ),
          Padding(
            padding: EdgeInsets.all(8),
            child: Column(
              children: [
                TextField(
                  controller: titleController,
                  decoration: InputDecoration(labelText: "Title"),
                ),
                TextField(
                  controller: amountController,
                  decoration: InputDecoration(labelText: "Amount"),
                  keyboardType: TextInputType.number,
                ),
                ElevatedButton(
                  onPressed: addExpense,
                  child: Text("Add Expense"),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}