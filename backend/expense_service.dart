/// Expense Tracker API Service for Flutter
/// This service class provides a complete API layer for Flutter app to communicate with backend.

import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

/// API Response wrapper class
class ApiResponse<T> {
  final bool success;
  final T? data;
  final String? message;
  final String? error;

  ApiResponse({required this.success, this.data, this.message, this.error});
}

/// Authentication Service - Handles login, signup, password reset
class AuthService {
  final String baseUrl;
  String? _token;

  AuthService({this.baseUrl = "http://10.0.2.2:3000/api"});

  // Get headers with auth token
  Map<String, String> get _headers => {
    "Content-Type": "application/json",
    if (_token != null) "Authorization": "Bearer $_token",
  };

  // Set token after login
  void setToken(String token) => _token = token;

  // Clear token on logout
  void clearToken() => _token = null;

  // Get current token
  String? get token => _token;

  /// User Signup
  Future<ApiResponse<Map<String, dynamic>>> signup({
    required String name,
    required String email,
    required String password,
  }) async {
    try {
      final res = await http.post(
        Uri.parse("$baseUrl/auth/signup"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({"name": name, "email": email, "password": password}),
      );
      final data = jsonDecode(res.body);
      if (res.statusCode == 200 || res.statusCode == 201) {
        if (data['token'] != null) _token = data['token'];
        return ApiResponse(success: true, data: data, message: data['message']);
      }
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  /// User Login
  Future<ApiResponse<Map<String, dynamic>>> login({
    required String email,
    required String password,
  }) async {
    try {
      final res = await http.post(
        Uri.parse("$baseUrl/auth/login"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({"email": email, "password": password}),
      );
      final data = jsonDecode(res.body);
      if (res.statusCode == 200) {
        if (data['token'] != null) _token = data['token'];
        return ApiResponse(success: true, data: data);
      }
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  /// Google Sign In
  Future<ApiResponse<Map<String, dynamic>>> googleSignIn(String idToken) async {
    try {
      final res = await http.post(
        Uri.parse("$baseUrl/auth/signin/google"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({"token": idToken}),
      );
      final data = jsonDecode(res.body);
      if (res.statusCode == 200) {
        if (data['token'] != null) _token = data['token'];
        return ApiResponse(success: true, data: data);
      }
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  /// LinkedIn Sign In
  Future<ApiResponse<Map<String, dynamic>>> linkedInSignIn({
    required String code,
    required String redirectUri,
  }) async {
    try {
      final res = await http.post(
        Uri.parse("$baseUrl/auth/signin/linkedin"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({"code": code, "redirectUri": redirectUri}),
      );
      final data = jsonDecode(res.body);
      if (res.statusCode == 200) {
        if (data['token'] != null) _token = data['token'];
        return ApiResponse(success: true, data: data);
      }
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  /// Forgot Password - Send reset email
  Future<ApiResponse<void>> forgotPassword(String email) async {
    try {
      final res = await http.post(
        Uri.parse("$baseUrl/auth/forgot-password"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({"email": email}),
      );
      final data = jsonDecode(res.body);
      if (res.statusCode == 200) {
        return ApiResponse(success: true, message: data['message']);
      }
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  /// Reset Password with token
  Future<ApiResponse<void>> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    try {
      final res = await http.post(
        Uri.parse("$baseUrl/auth/reset-password"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({"token": token, "newPassword": newPassword}),
      );
      final data = jsonDecode(res.body);
      if (res.statusCode == 200) {
        return ApiResponse(success: true, message: data['message']);
      }
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  /// Logout - Clear session
  Future<ApiResponse<void>> logout() async {
    try {
      final res = await http.post(
        Uri.parse("$baseUrl/auth/logout"),
        headers: _headers,
      );
      _token = null;
      return ApiResponse(success: true, message: "Logged out successfully");
    } catch (e) {
      _token = null;
      return ApiResponse(success: false, error: e.toString());
    }
  }
}

/// Profile Service - Handles user profile operations
class ProfileService {
  final String baseUrl;
  final AuthService authService;

  ProfileService({required this.authService, this.baseUrl = "http://10.0.2.2:3000/api"});

  Map<String, String> get _headers => {
    "Content-Type": "application/json",
    if (authService.token != null) "Authorization": "Bearer ${authService.token}",
  };

  /// Get profile by user ID (registered user)
  Future<ApiResponse<Map<String, dynamic>>> getProfileByUserId(String userId) async {
    try {
      final res = await http.get(
        Uri.parse("$baseUrl/profiles/user/$userId"),
        headers: _headers,
      );
      final data = jsonDecode(res.body);
      if (res.statusCode == 200) {
        return ApiResponse(success: true, data: data['data'] ?? data);
      }
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  /// Create profile for a user
  Future<ApiResponse<Map<String, dynamic>>> createProfile({
    required String userId,
    required String name,
    required String email,
    required String phone,
    String? gender,
    String? currency,
    String? referredBy,
  }) async {
    try {
      final body = {
        "userId": userId,
        "name": name,
        "email": email,
        "phone": phone,
        if (gender != null) "gender": gender,
        if (currency != null) "currency": currency,
        if (referredBy != null) "referredBy": referredBy,
      };

      final res = await http.post(
        Uri.parse("$baseUrl/profiles"),
        headers: _headers,
        body: jsonEncode(body),
      );
      final data = jsonDecode(res.body);
      if (res.statusCode == 200 || res.statusCode == 201) {
        return ApiResponse(success: true, data: data['data'] ?? data, message: "Profile created");
      }
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  /// Get all profiles (admin)
  Future<ApiResponse<List<dynamic>>> getAllProfiles() async {
    try {
      final res = await http.get(Uri.parse("$baseUrl/profiles"), headers: _headers);
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        return ApiResponse(success: true, data: data['data'] ?? data);
      }
      final data = jsonDecode(res.body);
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  /// Get profile by profile ID
  Future<ApiResponse<Map<String, dynamic>>> getProfileById(String id) async {
    try {
      final res = await http.get(Uri.parse("$baseUrl/profiles/$id"), headers: _headers);
      final data = jsonDecode(res.body);
      if (res.statusCode == 200) {
        return ApiResponse(success: true, data: data['data'] ?? data);
      }
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  /// Update profile by user ID (registered user)
  Future<ApiResponse<Map<String, dynamic>>> updateProfileByUserId({
    required String userId,
    String? name,
    String? email,
    String? phone,
    String? gender,
    String? currency,
  }) async {
    try {
      final body = <String, dynamic>{};
      if (name != null) body['name'] = name;
      if (email != null) body['email'] = email;
      if (phone != null) body['phone'] = phone;
      if (gender != null) body['gender'] = gender;
      if (currency != null) body['currency'] = currency;

      final res = await http.put(
        Uri.parse("$baseUrl/profiles/user/$userId"),
        headers: _headers,
        body: jsonEncode(body),
      );
      final data = jsonDecode(res.body);
      if (res.statusCode == 200) {
        return ApiResponse(success: true, data: data['data'] ?? data, message: "Profile updated");
      }
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  /// Update profile with profile picture (multipart)
  Future<ApiResponse<Map<String, dynamic>>> updateProfileWithPicture({
    required String userId,
    String? name,
    String? email,
    String? phone,
    String? gender,
    String? currency,
    File? profilePicture,
  }) async {
    try {
      final request = http.MultipartRequest(
        'PUT',
        Uri.parse("$baseUrl/profiles/user/$userId"),
      );

      // Add auth header
      if (authService.token != null) {
        request.headers['Authorization'] = 'Bearer ${authService.token}';
      }

      // Add text fields
      if (name != null) request.fields['name'] = name;
      if (email != null) request.fields['email'] = email;
      if (phone != null) request.fields['phone'] = phone;
      if (gender != null) request.fields['gender'] = gender;
      if (currency != null) request.fields['currency'] = currency;

      // Add profile picture
      if (profilePicture != null) {
        request.files.add(await http.MultipartFile.fromPath(
          'profilePicture',
          profilePicture.path,
        ));
      }

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return ApiResponse(success: true, data: data['data'] ?? data, message: "Profile updated");
      }
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  /// Update profile by profile ID
  Future<ApiResponse<Map<String, dynamic>>> updateProfile({
    required String id,
    String? name,
    String? email,
    String? phone,
    String? gender,
    String? currency,
  }) async {
    try {
      final body = <String, dynamic>{};
      if (name != null) body['name'] = name;
      if (email != null) body['email'] = email;
      if (phone != null) body['phone'] = phone;
      if (gender != null) body['gender'] = gender;
      if (currency != null) body['currency'] = currency;

      final res = await http.put(
        Uri.parse("$baseUrl/profiles/$id"),
        headers: _headers,
        body: jsonEncode(body),
      );
      final data = jsonDecode(res.body);
      if (res.statusCode == 200) {
        return ApiResponse(success: true, data: data['data'] ?? data, message: "Profile updated");
      }
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  /// Delete profile by user ID
  Future<ApiResponse<void>> deleteProfileByUserId(String userId) async {
    try {
      final res = await http.delete(
        Uri.parse("$baseUrl/profiles/user/$userId"),
        headers: _headers,
      );
      if (res.statusCode == 200) {
        return ApiResponse(success: true, message: "Profile deleted");
      }
      final data = jsonDecode(res.body);
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  /// Get profile by referral code
  Future<ApiResponse<Map<String, dynamic>>> getProfileByReferral(String code) async {
    try {
      final res = await http.get(Uri.parse("$baseUrl/profiles/referral/$code"), headers: _headers);
      final data = jsonDecode(res.body);
      if (res.statusCode == 200) {
        return ApiResponse(success: true, data: data['data'] ?? data);
      }
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  /// Get profile by email
  Future<ApiResponse<Map<String, dynamic>>> getProfileByEmail(String email) async {
    try {
      final res = await http.post(
        Uri.parse("$baseUrl/profiles/by-email"),
        headers: _headers,
        body: jsonEncode({"email": email}),
      );
      final data = jsonDecode(res.body);
      if (res.statusCode == 200) {
        return ApiResponse(success: true, data: data['data'] ?? data);
      }
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  /// Delete profile by profile ID
  Future<ApiResponse<void>> deleteProfile(String id) async {
    try {
      final res = await http.delete(Uri.parse("$baseUrl/profiles/$id"), headers: _headers);
      if (res.statusCode == 200) {
        return ApiResponse(success: true, message: "Profile deleted");
      }
      final data = jsonDecode(res.body);
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }
}

/// Expense Service - Handles expense CRUD operations
class ExpenseService {
  final String baseUrl;
  final AuthService authService;

  ExpenseService({required this.authService, this.baseUrl = "http://10.0.2.2:3000/api"});

  Map<String, String> get _headers => {
    "Content-Type": "application/json",
    if (authService.token != null) "Authorization": "Bearer ${authService.token}",
  };

  /// Get all expenses for current user
  Future<ApiResponse<List<dynamic>>> getExpenses({
    String? category,
    String? startDate,
    String? endDate,
  }) async {
    try {
      var url = "$baseUrl/expenses";
      final params = <String>[];
      if (category != null) params.add("category=$category");
      if (startDate != null) params.add("startDate=$startDate");
      if (endDate != null) params.add("endDate=$endDate");
      if (params.isNotEmpty) url += "?${params.join("&")}";

      final res = await http.get(Uri.parse(url), headers: _headers);
      if (res.statusCode == 200) {
        return ApiResponse(success: true, data: jsonDecode(res.body));
      }
      final data = jsonDecode(res.body);
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  /// Get expense by ID
  Future<ApiResponse<Map<String, dynamic>>> getExpenseById(String id) async {
    try {
      final res = await http.get(Uri.parse("$baseUrl/expenses/$id"), headers: _headers);
      final data = jsonDecode(res.body);
      if (res.statusCode == 200) {
        return ApiResponse(success: true, data: data);
      }
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  /// Add new expense
  Future<ApiResponse<Map<String, dynamic>>> addExpense({
    required String title,
    required double amount,
    required String date,
    String? category,
    String? description,
    String? paymentMethod,
  }) async {
    try {
      final body = {
        "title": title,
        "amount": amount,
        "date": date,
        if (category != null) "category": category,
        if (description != null) "description": description,
        if (paymentMethod != null) "paymentMethod": paymentMethod,
      };

      final res = await http.post(
        Uri.parse("$baseUrl/expenses"),
        headers: _headers,
        body: jsonEncode(body),
      );
      final data = jsonDecode(res.body);
      if (res.statusCode == 200 || res.statusCode == 201) {
        return ApiResponse(success: true, data: data, message: "Expense added");
      }
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  /// Update expense
  Future<ApiResponse<Map<String, dynamic>>> updateExpense({
    required String id,
    String? title,
    double? amount,
    String? date,
    String? category,
    String? description,
  }) async {
    try {
      final body = <String, dynamic>{};
      if (title != null) body['title'] = title;
      if (amount != null) body['amount'] = amount;
      if (date != null) body['date'] = date;
      if (category != null) body['category'] = category;
      if (description != null) body['description'] = description;

      final res = await http.put(
        Uri.parse("$baseUrl/expenses/$id"),
        headers: _headers,
        body: jsonEncode(body),
      );
      final data = jsonDecode(res.body);
      if (res.statusCode == 200) {
        return ApiResponse(success: true, data: data, message: "Expense updated");
      }
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  /// Delete expense
  Future<ApiResponse<void>> deleteExpense(String id) async {
    try {
      final res = await http.delete(Uri.parse("$baseUrl/expenses/$id"), headers: _headers);
      if (res.statusCode == 200) {
        return ApiResponse(success: true, message: "Expense deleted");
      }
      final data = jsonDecode(res.body);
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  /// Get expense summary/statistics
  Future<ApiResponse<Map<String, dynamic>>> getExpenseSummary({
    String? month,
    String? year,
  }) async {
    try {
      var url = "$baseUrl/expenses/summary";
      final params = <String>[];
      if (month != null) params.add("month=$month");
      if (year != null) params.add("year=$year");
      if (params.isNotEmpty) url += "?${params.join("&")}";

      final res = await http.get(Uri.parse(url), headers: _headers);
      final data = jsonDecode(res.body);
      if (res.statusCode == 200) {
        return ApiResponse(success: true, data: data);
      }
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }
}

/// Transaction Service - Handles income/expense transactions
class TransactionService {
  final String baseUrl;
  final AuthService authService;

  TransactionService({required this.authService, this.baseUrl = "http://10.0.2.2:3000/api"});

  Map<String, String> get _headers => {
    "Content-Type": "application/json",
    if (authService.token != null) "Authorization": "Bearer ${authService.token}",
  };

  /// Get all transactions with optional filters
  Future<ApiResponse<Map<String, dynamic>>> getTransactions({
    int page = 1,
    int limit = 10,
    String? type, // 'income' or 'expense'
    String? category,
    String? status,
    String? startDate,
    String? endDate,
  }) async {
    try {
      var url = "$baseUrl/transactions?page=$page&limit=$limit";
      if (type != null) url += "&type=$type";
      if (category != null) url += "&category=$category";
      if (status != null) url += "&status=$status";
      if (startDate != null) url += "&startDate=$startDate";
      if (endDate != null) url += "&endDate=$endDate";

      final res = await http.get(Uri.parse(url), headers: _headers);
      final data = jsonDecode(res.body);
      if (res.statusCode == 200) {
        return ApiResponse(success: true, data: data);
      }
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  /// Get transaction by ID
  Future<ApiResponse<Map<String, dynamic>>> getTransactionById(String id) async {
    try {
      final res = await http.get(Uri.parse("$baseUrl/transactions/$id"), headers: _headers);
      final data = jsonDecode(res.body);
      if (res.statusCode == 200) {
        return ApiResponse(success: true, data: data);
      }
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  /// Create new transaction
  Future<ApiResponse<Map<String, dynamic>>> createTransaction({
    required String item,
    required double amount,
    required String type, // 'income' or 'expense'
    String? category,
    String? date,
    String? paymentMethod,
    String? status,
    String? fullName,
    String? email,
    String? phone,
  }) async {
    try {
      final body = {
        "item": item,
        "amount": amount,
        "type": type,
        if (category != null) "category": category,
        if (date != null) "date": date,
        if (paymentMethod != null) "paymentMethod": paymentMethod,
        if (status != null) "status": status,
        if (fullName != null) "fullName": fullName,
        if (email != null) "email": email,
        if (phone != null) "phone": phone,
      };

      final res = await http.post(
        Uri.parse("$baseUrl/transactions"),
        headers: _headers,
        body: jsonEncode(body),
      );
      final data = jsonDecode(res.body);
      if (res.statusCode == 200 || res.statusCode == 201) {
        return ApiResponse(success: true, data: data, message: "Transaction created");
      }
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  /// Update transaction
  Future<ApiResponse<Map<String, dynamic>>> updateTransaction({
    required String id,
    String? item,
    double? amount,
    String? type,
    String? category,
    String? status,
  }) async {
    try {
      final body = <String, dynamic>{};
      if (item != null) body['item'] = item;
      if (amount != null) body['amount'] = amount;
      if (type != null) body['type'] = type;
      if (category != null) body['category'] = category;
      if (status != null) body['status'] = status;

      final res = await http.put(
        Uri.parse("$baseUrl/transactions/$id"),
        headers: _headers,
        body: jsonEncode(body),
      );
      final data = jsonDecode(res.body);
      if (res.statusCode == 200) {
        return ApiResponse(success: true, data: data, message: "Transaction updated");
      }
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  /// Delete transaction
  Future<ApiResponse<void>> deleteTransaction(String id) async {
    try {
      final res = await http.delete(Uri.parse("$baseUrl/transactions/$id"), headers: _headers);
      if (res.statusCode == 200) {
        return ApiResponse(success: true, message: "Transaction deleted");
      }
      final data = jsonDecode(res.body);
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }
}

/// Category Service - Handles expense/income categories
class CategoryService {
  final String baseUrl;
  final AuthService authService;

  CategoryService({required this.authService, this.baseUrl = "http://10.0.2.2:3000/api"});

  Map<String, String> get _headers => {
    "Content-Type": "application/json",
    if (authService.token != null) "Authorization": "Bearer ${authService.token}",
  };

  /// Get all categories
  Future<ApiResponse<List<dynamic>>> getAllCategories({String? type}) async {
    try {
      var url = "$baseUrl/categories";
      if (type != null) url += "?type=$type";

      final res = await http.get(Uri.parse(url), headers: _headers);
      if (res.statusCode == 200) {
        return ApiResponse(success: true, data: jsonDecode(res.body));
      }
      final data = jsonDecode(res.body);
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  /// Get category by ID
  Future<ApiResponse<Map<String, dynamic>>> getCategoryById(String id) async {
    try {
      final res = await http.get(Uri.parse("$baseUrl/categories/$id"), headers: _headers);
      final data = jsonDecode(res.body);
      if (res.statusCode == 200) {
        return ApiResponse(success: true, data: data);
      }
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  /// Create new category
  Future<ApiResponse<Map<String, dynamic>>> createCategory({
    required String name,
    required String type, // 'income' or 'expense'
    String? description,
  }) async {
    try {
      final body = {
        "name": name,
        "type": type,
        if (description != null) "description": description,
      };

      final res = await http.post(
        Uri.parse("$baseUrl/categories"),
        headers: _headers,
        body: jsonEncode(body),
      );
      final data = jsonDecode(res.body);
      if (res.statusCode == 200 || res.statusCode == 201) {
        return ApiResponse(success: true, data: data, message: "Category created");
      }
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  /// Update category
  Future<ApiResponse<Map<String, dynamic>>> updateCategory({
    required String id,
    String? name,
    String? type,
    String? description,
  }) async {
    try {
      final body = <String, dynamic>{};
      if (name != null) body['name'] = name;
      if (type != null) body['type'] = type;
      if (description != null) body['description'] = description;

      final res = await http.put(
        Uri.parse("$baseUrl/categories/$id"),
        headers: _headers,
        body: jsonEncode(body),
      );
      final data = jsonDecode(res.body);
      if (res.statusCode == 200) {
        return ApiResponse(success: true, data: data, message: "Category updated");
      }
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  /// Delete category
  Future<ApiResponse<void>> deleteCategory(String id) async {
    try {
      final res = await http.delete(Uri.parse("$baseUrl/categories/$id"), headers: _headers);
      if (res.statusCode == 200) {
        return ApiResponse(success: true, message: "Category deleted");
      }
      final data = jsonDecode(res.body);
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  /// Get top categories by expense amount with percentage
  /// [limit] - Number of top categories to return (default: 5)
  /// [period] - Filter period: 'weekly', 'monthly', 'yearly', or null for lifetime
  Future<ApiResponse<List<dynamic>>> getTopCategories({
    int limit = 5,
    String? period,
  }) async {
    try {
      var url = "$baseUrl/categories/top?limit=$limit";
      if (period != null) url += "&period=$period";

      final res = await http.get(Uri.parse(url), headers: _headers);
      final data = jsonDecode(res.body);
      if (res.statusCode == 200) {
        return ApiResponse(success: true, data: data['data'] ?? []);
      }
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }
}

/// Budget Service - Handles monthly budgets
class BudgetService {
  final String baseUrl;
  final AuthService authService;

  BudgetService({required this.authService, this.baseUrl = "http://10.0.2.2:3000/api"});

  Map<String, String> get _headers => {
    "Content-Type": "application/json",
    if (authService.token != null) "Authorization": "Bearer ${authService.token}",
  };

  /// Get all budgets for current user
  Future<ApiResponse<List<dynamic>>> getBudgets({int? year}) async {
    try {
      var url = "$baseUrl/budgets";
      if (year != null) url += "?year=$year";

      final res = await http.get(Uri.parse(url), headers: _headers);
      if (res.statusCode == 200) {
        return ApiResponse(success: true, data: jsonDecode(res.body));
      }
      final data = jsonDecode(res.body);
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  /// Get budget by ID
  Future<ApiResponse<Map<String, dynamic>>> getBudgetById(String id) async {
    try {
      final res = await http.get(Uri.parse("$baseUrl/budgets/$id"), headers: _headers);
      final data = jsonDecode(res.body);
      if (res.statusCode == 200) {
        return ApiResponse(success: true, data: data);
      }
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  /// Get budget for specific month/year
  Future<ApiResponse<Map<String, dynamic>>> getBudgetByMonth({
    required int month,
    required int year,
  }) async {
    try {
      final res = await http.get(
        Uri.parse("$baseUrl/budgets/month/$month/year/$year"),
        headers: _headers,
      );
      final data = jsonDecode(res.body);
      if (res.statusCode == 200) {
        return ApiResponse(success: true, data: data);
      }
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  /// Create new budget
  Future<ApiResponse<Map<String, dynamic>>> createBudget({
    required double totalBudget,
    required int month,
    required int year,
    String currency = "INR",
    String? notes,
  }) async {
    try {
      final body = {
        "totalBudget": totalBudget,
        "month": month,
        "year": year,
        "currency": currency,
        if (notes != null) "notes": notes,
      };

      final res = await http.post(
        Uri.parse("$baseUrl/budgets"),
        headers: _headers,
        body: jsonEncode(body),
      );
      final data = jsonDecode(res.body);
      if (res.statusCode == 200 || res.statusCode == 201) {
        return ApiResponse(success: true, data: data, message: "Budget created");
      }
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  /// Update budget
  Future<ApiResponse<Map<String, dynamic>>> updateBudget({
    required String id,
    double? totalBudget,
    String? currency,
    String? notes,
  }) async {
    try {
      final body = <String, dynamic>{};
      if (totalBudget != null) body['totalBudget'] = totalBudget;
      if (currency != null) body['currency'] = currency;
      if (notes != null) body['notes'] = notes;

      final res = await http.put(
        Uri.parse("$baseUrl/budgets/$id"),
        headers: _headers,
        body: jsonEncode(body),
      );
      final data = jsonDecode(res.body);
      if (res.statusCode == 200) {
        return ApiResponse(success: true, data: data, message: "Budget updated");
      }
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  /// Delete budget
  Future<ApiResponse<void>> deleteBudget(String id) async {
    try {
      final res = await http.delete(Uri.parse("$baseUrl/budgets/$id"), headers: _headers);
      if (res.statusCode == 200) {
        return ApiResponse(success: true, message: "Budget deleted");
      }
      final data = jsonDecode(res.body);
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }
}

/// Auto Expense Service - Handles recurring/automatic expenses
class AutoExpenseService {
  final String baseUrl;
  final AuthService authService;

  AutoExpenseService({required this.authService, this.baseUrl = "http://10.0.2.2:3000/api"});

  Map<String, String> get _headers => {
    "Content-Type": "application/json",
    if (authService.token != null) "Authorization": "Bearer ${authService.token}",
  };

  /// Get all auto expenses
  Future<ApiResponse<List<dynamic>>> getAutoExpenses() async {
    try {
      final res = await http.get(Uri.parse("$baseUrl/auto-expenses"), headers: _headers);
      if (res.statusCode == 200) {
        return ApiResponse(success: true, data: jsonDecode(res.body));
      }
      final data = jsonDecode(res.body);
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  /// Create auto expense
  Future<ApiResponse<Map<String, dynamic>>> createAutoExpense({
    required String title,
    required double amount,
    required String frequency, // 'daily', 'weekly', 'monthly', 'yearly'
    String? category,
    String? startDate,
    String? endDate,
  }) async {
    try {
      final body = {
        "title": title,
        "amount": amount,
        "frequency": frequency,
        if (category != null) "category": category,
        if (startDate != null) "startDate": startDate,
        if (endDate != null) "endDate": endDate,
      };

      final res = await http.post(
        Uri.parse("$baseUrl/auto-expenses"),
        headers: _headers,
        body: jsonEncode(body),
      );
      final data = jsonDecode(res.body);
      if (res.statusCode == 200 || res.statusCode == 201) {
        return ApiResponse(success: true, data: data, message: "Auto expense created");
      }
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  /// Update auto expense
  Future<ApiResponse<Map<String, dynamic>>> updateAutoExpense({
    required String id,
    String? title,
    double? amount,
    String? frequency,
    String? category,
    bool? isActive,
  }) async {
    try {
      final body = <String, dynamic>{};
      if (title != null) body['title'] = title;
      if (amount != null) body['amount'] = amount;
      if (frequency != null) body['frequency'] = frequency;
      if (category != null) body['category'] = category;
      if (isActive != null) body['isActive'] = isActive;

      final res = await http.put(
        Uri.parse("$baseUrl/auto-expenses/$id"),
        headers: _headers,
        body: jsonEncode(body),
      );
      final data = jsonDecode(res.body);
      if (res.statusCode == 200) {
        return ApiResponse(success: true, data: data, message: "Auto expense updated");
      }
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }

  /// Delete auto expense
  Future<ApiResponse<void>> deleteAutoExpense(String id) async {
    try {
      final res = await http.delete(Uri.parse("$baseUrl/auto-expenses/$id"), headers: _headers);
      if (res.statusCode == 200) {
        return ApiResponse(success: true, message: "Auto expense deleted");
      }
      final data = jsonDecode(res.body);
      return ApiResponse(success: false, error: data['message'] ?? data['error']);
    } catch (e) {
      return ApiResponse(success: false, error: e.toString());
    }
  }
}

/// Main API Client - Combines all services
class ExpenseTrackerAPI {
  late final AuthService auth;
  late final ProfileService profiles;
  late final ExpenseService expenses;
  late final TransactionService transactions;
  late final CategoryService categories;
  late final BudgetService budgets;
  late final AutoExpenseService autoExpenses;

  ExpenseTrackerAPI({String baseUrl = "http://10.0.2.2:3000/api"}) {
    auth = AuthService(baseUrl: baseUrl);
    profiles = ProfileService(authService: auth, baseUrl: baseUrl);
    expenses = ExpenseService(authService: auth, baseUrl: baseUrl);
    transactions = TransactionService(authService: auth, baseUrl: baseUrl);
    categories = CategoryService(authService: auth, baseUrl: baseUrl);
    budgets = BudgetService(authService: auth, baseUrl: baseUrl);
    autoExpenses = AutoExpenseService(authService: auth, baseUrl: baseUrl);
  }

  /// Check if user is authenticated
  bool get isAuthenticated => auth.token != null;

  /// Set authentication token (for restoring session)
  void setAuthToken(String token) => auth.setToken(token);

  /// Clear authentication
  void clearAuth() => auth.clearToken();
}

