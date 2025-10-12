// Ye service class API layer provide karti hai aapke Flutter app ke liye backend communication ke liye.

import 'dart:convert';
import 'package:http/http.dart' as http;

class ExpenseService {
  final String baseUrl = "http://10.0.2.2:3000/api"; // Emulator ke liye

// Saare expenses fetch karta hai server se
  Future<List<dynamic>> getExpenses() async {
    final res = await http.get(Uri.parse("$baseUrl/expenses"));
    if (res.statusCode == 200) {
      return jsonDecode(res.body);
    } else {
      throw Exception("Failed to load expenses");
    }
  }

  // Naya expense add karta hai server par
  Future<Map<String, dynamic>> addExpense(String title, int amount, String date) async {
    final res = await http.post(
      Uri.parse("$baseUrl/expenses"),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({"title": title, "amount": amount, "date": date}),
    );
    if (res.statusCode == 200) {
      return jsonDecode(res.body);
    } else {
      throw Exception("Failed to add expense");
    }
  }
}

