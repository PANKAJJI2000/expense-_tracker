# API Testing Samples for Expense Tracker

Base URL: `http://localhost:3000/api` (adjust port if different)

## Table of Contents
1. [Authentication Endpoints](#authentication-endpoints)
2. [User Management](#user-management)
3. [Profile Management](#profile-management)
4. [Expense Management](#expense-management)
5. [Category Management](#category-management)
6. [Budget Management](#budget-management)
7. [Transaction Management](#transaction-management)
8. [Transaction History](#transaction-history)
9. [Auto Expense Management](#auto-expense-management)
10. [Manage Expense Requests](#manage-expense-requests)
11. [Income Tax Help Requests](#income-tax-help-requests)
12. [Admin Endpoints](#admin-endpoints)

---

## Authentication Endpoints

### 1. User Signup
**POST** `/auth/signup`

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "69197221b2356d9d73cffc75",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### 2. User Login
**POST** `/auth/login`

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "69197221b2356d9d73cffc75",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### 3. LinkedIn Signin
**POST** `/auth/signin/linkedin`

```json
{
  "code": "linkedin_auth_code",
  "redirectUri": "http://localhost:3000/auth/linkedin/callback"
}
```

### 4. Google Signin
**POST** `/auth/signin/google`

```json
{
  "token": "google_id_token"
}
```

### 5. Forgot Password
**POST** `/auth/forgot-password`

```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

### 6. Reset Password
**POST** `/auth/reset-password/:token`

```json
{
  "password": "newPassword123"
}
```

### 7. Verify Email
**POST** `/auth/verify-email`

```json
{
  "token": "verification_token"
}
```

### 8. Resend Verification Email
**POST** `/auth/resend-verification`

```json
{
  "email": "john@example.com"
}
```

### 9. Get User Profile (Protected)
**GET** `/auth/profile`
**GET** `/auth/me`

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "69197221b2356d9d73cffc75",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### 10. Change Password (Protected)
**POST** `/auth/change-password`

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Body:**
```json
{
  "currentPassword": "password123",
  "newPassword": "newPassword456"
}
```

---

## User Management

**Note:** All endpoints require authentication

### 1. Get All Users
**GET** `/users`

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com"
    }
  ]
}
```

### 2. Get User by ID
**GET** `/users/:id`

### 3. Update User
**PUT** `/users/:id`

```json
{
  "name": "John Updated",
  "email": "john.updated@example.com"
}
```

### 4. Update Password
**PUT** `/users/:id/password`

```json
{
  "currentPassword": "oldPassword",
  "newPassword": "newPassword123"
}
```

### 5. Delete User
**DELETE** `/users/:id`

---

## Profile Management

### 1. Create Profile
**POST** `/profiles`

```json
{
  "userId": "user_id",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "country": "USA",
  "dateOfBirth": "1990-01-01",
  "bio": "Software Developer"
}
```

### 2. Get All Profiles
**GET** `/profiles`

### 3. Get Profile by ID
**GET** `/profiles/:id`

### 4. Get Profile by User ID
**GET** `/profiles/user/:userId`

### 5. Get Profile by Referral Code
**GET** `/profiles/referral/:code`

### 6. Update Profile by User ID
**PUT** `/profiles/user/:userId`

```json
{
  "firstName": "John",
  "lastName": "Doe Updated",
  "phone": "+1234567890"
}
```

### 7. Update Profile with Picture
**PUT** `/profiles/user/:userId`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `profilePicture`: (file)
- `firstName`: "John"
- `lastName`: "Doe"
- Other profile fields...

### 8. Update Profile by ID
**PUT** `/profiles/:id`

### 9. Delete Profile
**DELETE** `/profiles/:id`

---

## Expense Management

**Note:** All expense endpoints require Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### 1. Get All Expenses
**GET** `/expenses`

**Query Parameters:**
- `page`: Page number (optional)
- `limit`: Items per page (optional)
- `category`: Filter by category (optional)
- `startDate`: Filter from date (optional)
- `endDate`: Filter to date (optional)

**Response:**
```json
{
  "success": true,
  "expenses": [
    {
      "_id": "expense_id",
      "userId": "user_id",
      "category": "Food",
      "amount": 50.00,
      "description": "Lunch",
      "date": "2026-01-30",
      "createdAt": "2026-01-30T10:00:00.000Z"
    }
  ],
  "total": 100,
  "page": 1,
  "pages": 10
}
```

### 2. Create Expense
**POST** `/expenses`

```json
{
  "category": "Food",
  "amount": 50.00,
  "description": "Lunch at restaurant",
  "date": "2026-01-30",
  "paymentMethod": "Credit Card"
}
```

### 3. Update Expense
**PUT** `/expenses/:id`

```json
{
  "category": "Food",
  "amount": 55.00,
  "description": "Updated lunch expense",
  "date": "2026-01-30"
}
```

### 4. Delete Expense
**DELETE** `/expenses/:id`

### 5. Get Expense Summary
**GET** `/expenses/summary`

**Query Parameters:**
- `type`: weekly | monthly | yearly | custom | lifetime
- `startDate`: Start date for custom range
- `endDate`: End date for custom range

**Response:**
```json
{
  "success": true,
  "summary": {
    "totalExpenses": 1500.00,
    "categoryBreakdown": [
      {
        "category": "Food",
        "total": 500.00,
        "percentage": 33.33
      }
    ],
    "period": "monthly"
  }
}
```

### 6. Get Expenses by Period (Bar Graph Data)
**GET** `/expenses/bar-graph`

**Query Parameters:**
- `period`: daily | weekly | monthly | yearly
- `startDate`: Start date
- `endDate`: End date

### 7. Get Current Month Summary
**GET** `/expenses/current-month/summary`

### 8. Verify Current Month Expenses
**GET** `/expenses/current-month/verify`

### 9. Fix Invalid Dates (Helper)
**GET** `/expenses/fix-dates`

---

## Category Management

### 1. Get All Categories
**GET** `/categories`

**Response:**
```json
{
  "success": true,
  "categories": [
    {
      "_id": "category_id",
      "name": "Food",
      "icon": "🍔",
      "color": "#FF5733"
    }
  ]
}
```

### 2. Get Category by ID
**GET** `/categories/:id`

### 3. Create Category
**POST** `/categories`

```json
{
  "name": "Entertainment",
  "icon": "🎬",
  "color": "#3498db",
  "description": "Movies, shows, games"
}
```

### 4. Update Category
**PUT** `/categories/:id`

```json
{
  "name": "Entertainment Updated",
  "icon": "🎮",
  "color": "#2980b9"
}
```

### 5. Delete Category
**DELETE** `/categories/:id`

---

## Budget Management

### 1. Create Budget
**POST** `/budgets`

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

```json
{
  "userId": "user_id",
  "category": "Food",
  "amount": 500.00,
  "period": "monthly",
  "startDate": "2026-01-01",
  "endDate": "2026-01-31"
}
```

### 2. Get User Budgets
**GET** `/budgets`

**Query Parameters:**
- `userId`: User ID (optional for admin)

### 3. Get Current Budget
**GET** `/budgets/current`

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

### 4. Get All Budgets (Admin)
**GET** `/budgets/all`

### 5. Update Budget (Admin)
**PUT** `/budgets/:id`

```json
{
  "amount": 600.00,
  "period": "monthly"
}
```

### 6. Delete Budget
**DELETE** `/budgets/:id`

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

### 7. Delete Budget (Admin)
**DELETE** `/budgets/:id/admin`

---

## Transaction Management

**Note:** All transaction endpoints require Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### 1. Create Transaction
**POST** `/transactions`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `type`: "income" or "expense"
- `amount`: 100.00
- `category`: "Salary"
- `description`: "Monthly salary"
- `date`: "2026-01-30"
- `invoice`: (file - optional)

### 2. Get All Transactions
**GET** `/transactions`

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `type`: income | expense
- `category`: Filter by category
- `startDate`: Start date
- `endDate`: End date

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "_id": "transaction_id",
      "userId": "user_id",
      "type": "expense",
      "amount": 50.00,
      "category": "Food",
      "description": "Groceries",
      "date": "2026-01-30",
      "invoicePath": "/uploads/invoice.pdf"
    }
  ]
}
```

### 3. Get Transaction Summary
**GET** `/transactions/summary`

**Response:**
```json
{
  "success": true,
  "summary": {
    "totalIncome": 5000.00,
    "totalExpense": 2500.00,
    "balance": 2500.00,
    "transactionCount": 150
  }
}
```

### 4. Get Transaction History
**GET** `/transactions/history`

### 5. Update Transaction
**PUT** `/transactions/:id`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `amount`: 55.00
- `description`: "Updated description"
- `invoice`: (file - optional)

### 6. Delete Transaction
**DELETE** `/transactions/:id`

### 7. Upload Invoice
**POST** `/transactions/upload-invoice`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `invoice`: (file)

---

## Transaction History

### 1. Get All Transactions for User
**GET** `/transaction-history/:userId`

**Response:**
```json
{
  "success": true,
  "count": 50,
  "data": [
    {
      "_id": "history_id",
      "userId": "user_id",
      "type": "expense",
      "amount": 50.00,
      "category": "Food",
      "date": "2026-01-30"
    }
  ]
}
```

### 2. Get Transactions by Type
**GET** `/transaction-history/:userId/type/:type`

**Parameters:**
- `type`: "income" or "expense"

### 3. Get Transactions by Date Range
**GET** `/transaction-history/:userId/range`

**Query Parameters:**
- `startDate`: "2026-01-01"
- `endDate`: "2026-01-31"

### 4. Get Transactions by Category
**GET** `/transaction-history/:userId/category/:category`

### 5. Get Monthly Summary
**GET** `/transaction-history/:userId/monthly-summary`

**Query Parameters:**
- `year`: 2026
- `month`: 1

---

## Auto Expense Management

**Note:** All auto-expense endpoints require Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### 1. Get All Auto Expenses
**GET** `/auto-expenses`

**Query Parameters:**
- `status`: pending | saved | dismissed
- `page`: Page number
- `limit`: Items per page

### 2. Get Auto Expense Statistics
**GET** `/auto-expenses/stats`

**Response:**
```json
{
  "success": true,
  "stats": {
    "total": 50,
    "pending": 20,
    "saved": 25,
    "dismissed": 5,
    "totalAmount": 1500.00
  }
}
```

### 3. Create Auto Expense
**POST** `/auto-expenses`

```json
{
  "description": "Electricity Bill",
  "amount": 150.00,
  "category": "Utilities",
  "frequency": "monthly",
  "nextDueDate": "2026-02-01",
  "isRecurring": true
}
```

### 4. Get Auto Expense by ID
**GET** `/auto-expenses/:id`

### 5. Update Auto Expense Status
**PUT** `/auto-expenses/:id/status`

```json
{
  "status": "saved"
}
```

### 6. Mark as Saved
**PUT** `/auto-expenses/:id/save`

### 7. Mark as Dismissed
**PUT** `/auto-expenses/:id/dismiss`

### 8. Delete Auto Expense
**DELETE** `/auto-expenses/:id`

---

## Manage Expense Requests

**Note:** All endpoints require Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### 1. Create Manage Expense Request
**POST** `/manage-expense`

```json
{
  "companyName": "ABC Corp",
  "employeeId": "EMP12345",
  "annualExpense": 50000.00,
  "category": "Office Supplies",
  "description": "Annual office supplies budget",
  "supportingDocuments": "document_url"
}
```

### 2. Get All Requests
**GET** `/manage-expense`

**Query Parameters:**
- `status`: pending | approved | rejected

### 3. Get Request by ID
**GET** `/manage-expense/:id`

### 4. Update Request Status
**PUT** `/manage-expense/:id/status`

```json
{
  "status": "approved",
  "adminNotes": "Approved for current fiscal year"
}
```

### 5. Delete Request
**DELETE** `/manage-expense/:id`

---

## Income Tax Help Requests

**Note:** All endpoints require Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### 1. Create Income Tax Help Request
**POST** `/income-tax-help`

```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "annualIncome": 75000.00,
  "taxYear": "2025",
  "filingStatus": "single",
  "description": "Need help with tax deductions",
  "supportingDocuments": "document_url"
}
```

### 2. Get All Requests
**GET** `/income-tax-help`

**Query Parameters:**
- `status`: pending | in-progress | completed

### 3. Get Request by ID
**GET** `/income-tax-help/:id`

### 4. Update Request Status
**PUT** `/income-tax-help/:id/status`

```json
{
  "status": "in-progress",
  "adminNotes": "Reviewing tax documents"
}
```

### 5. Delete Request
**DELETE** `/income-tax-help/:id`

---

## Admin Endpoints

**Note:** All admin endpoints require admin authentication:
```
Authorization: Bearer <admin_jwt_token>
```

### Admin Authentication

#### 1. Admin Login
**POST** `/admin/login`

```json
{
  "email": "admin@example.com",
  "password": "adminPassword123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "admin_jwt_token",
  "admin": {
    "_id": "admin_id",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

#### 2. Verify Admin
**GET** `/admin/verify`

### Dashboard Statistics

#### 3. Get Dashboard Stats
**GET** `/admin/stats`

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 500,
    "totalExpenses": 15000.00,
    "totalTransactions": 1000,
    "activeUsers": 350
  }
}
```

#### 4. Get Updated Expenses
**GET** `/admin/updated-expenses`

#### 5. Get Trends
**GET** `/admin/trends`

#### 6. Get Category Stats
**GET** `/admin/category-stats`

#### 7. Get Monthly Stats
**GET** `/admin/monthly-stats`

#### 8. Get Top Users
**GET** `/admin/top-users`

#### 9. Get Monthly Expenses (Legacy)
**GET** `/admin/monthly-expenses`

#### 10. Get Category Breakdown (Legacy)
**GET** `/admin/category-breakdown`

#### 11. Get Dashboard Stats (Legacy)
**GET** `/admin/dashboard/stats`

### User Management

#### 12. Get All Users
**GET** `/admin/users`

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `search`: Search query

#### 13. Update User
**PUT** `/admin/users/:id`

```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "status": "active"
}
```

#### 14. Delete User
**DELETE** `/admin/users/:id`

### Expense Management

#### 15. Get All Expenses
**GET** `/admin/expenses`

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `userId`: Filter by user
- `category`: Filter by category
- `startDate`: Start date
- `endDate`: End date

#### 16. Delete Expense
**DELETE** `/admin/expenses/:id`

### Category Management

#### 17. Get All Categories
**GET** `/admin/categories`

#### 18. Create Category
**POST** `/admin/categories`

```json
{
  "name": "New Category",
  "icon": "🏷️",
  "color": "#FF5733"
}
```

#### 19. Update Category
**PUT** `/admin/categories/:id`

```json
{
  "name": "Updated Category",
  "icon": "🎯",
  "color": "#3498db"
}
```

#### 20. Delete Category
**DELETE** `/admin/categories/:id`

### Auto Expense Management

#### 21. Get All Auto Expenses
**GET** `/admin/auto-expenses`

#### 22. Update Auto Expense
**PUT** `/admin/auto-expenses/:id`

```json
{
  "status": "approved",
  "amount": 200.00
}
```

#### 23. Delete Auto Expense
**DELETE** `/admin/auto-expenses/:id`

### Profile Management

#### 24. Get All Profiles
**GET** `/admin/profiles`

#### 25. Update Profile
**PUT** `/admin/profiles/:id`

```json
{
  "firstName": "Updated",
  "lastName": "Name",
  "status": "verified"
}
```

#### 26. Delete Profile
**DELETE** `/admin/profiles/:id`

### Transaction Management

#### 27. Get All Transactions
**GET** `/admin/transactions`

#### 28. Update Transaction
**PUT** `/admin/transactions/:id`

```json
{
  "status": "verified",
  "amount": 100.00
}
```

#### 29. Delete Transaction
**DELETE** `/admin/transactions/:id`

### Transaction History

#### 30. Get Transaction History
**GET** `/admin/transaction-history`

#### 31. Delete Transaction History
**DELETE** `/admin/transaction-history/:id`

### Budget Management

#### 32. Get All Budgets
**GET** `/admin/budgets/all`

#### 33. Update Budget
**PUT** `/admin/budgets/:id`

```json
{
  "amount": 1000.00,
  "status": "active"
}
```

#### 34. Delete Budget
**DELETE** `/admin/budgets/:id/admin`

### Session Management

#### 35. Get All Sessions
**GET** `/admin/sessions`

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "session_id",
      "sessionId": "session_id",
      "expires": "2026-01-31T00:00:00.000Z",
      "user": {
        "email": "user@example.com"
      },
      "isExpired": false
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalSessions": 250,
    "activeSessions": 200,
    "expiredSessions": 50
  }
}
```

#### 36. Get Session Stats
**GET** `/admin/sessions/stats`

**Response:**
```json
{
  "success": true,
  "stats": {
    "total": 250,
    "active": 200,
    "expired": 50,
    "uniqueUsers": 150,
    "userBreakdown": {
      "user1@example.com": 3,
      "user2@example.com": 2
    }
  }
}
```

#### 37. Cleanup Expired Sessions
**DELETE** `/admin/sessions/cleanup`

**Response:**
```json
{
  "success": true,
  "message": "Expired sessions cleaned up",
  "deletedCount": 50
}
```

### Manage Expense Requests (Admin)

#### 38. Get All Manage Expense Requests
**GET** `/admin/manage-expenses`

**Response:**
```json
{
  "success": true,
  "count": 100,
  "stats": {
    "total": 100,
    "pending": 40,
    "approved": 50,
    "rejected": 10
  },
  "data": [
    {
      "_id": "request_id",
      "userId": {
        "email": "user@example.com",
        "username": "johndoe"
      },
      "companyName": "ABC Corp",
      "annualExpense": 50000.00,
      "status": "pending",
      "submittedAt": "2026-01-30T10:00:00.000Z"
    }
  ]
}
```

### Income Tax Help Requests (Admin)

#### 39. Get All Income Tax Help Requests
**GET** `/admin/income-tax-help`

**Response:**
```json
{
  "success": true,
  "count": 75,
  "stats": {
    "total": 75,
    "pending": 25,
    "inProgress": 30,
    "completed": 20
  },
  "data": [
    {
      "_id": "request_id",
      "userId": {
        "email": "user@example.com",
        "username": "johndoe"
      },
      "fullName": "John Doe",
      "annualIncome": 75000.00,
      "status": "pending",
      "submittedAt": "2026-01-30T10:00:00.000Z"
    }
  ]
}
```

### Combined Dashboard Statistics

#### 40. Get Dashboard Stats (Forms)
**GET** `/admin/dashboard-stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "manageExpenses": {
      "total": 100,
      "pending": 40,
      "approved": 50,
      "rejected": 10,
      "totalAmount": 5000000.00
    },
    "incomeTaxHelp": {
      "total": 75,
      "pending": 25,
      "inProgress": 30,
      "completed": 20,
      "totalIncome": 7500000.00
    },
    "recentSubmissions": {
      "manageExpenses": [],
      "incomeTaxHelp": []
    }
  }
}
```

### Admin Settings

#### 41. Get Admin Settings
**GET** `/admin/settings`

**Response:**
```json
{
  "data": {
    "darkMode": false,
    "emailNotifications": true,
    "pushNotifications": false,
    "language": "en",
    "currency": "INR",
    "dateFormat": "DD/MM/YYYY",
    "autoBackup": true,
    "sessionTimeout": 30,
    "twoFAEnabled": false
  },
  "lastBackupDate": "2026-01-30T00:00:00.000Z"
}
```

#### 42. Update Admin Settings
**PUT** `/admin/settings`

```json
{
  "darkMode": true,
  "emailNotifications": false,
  "currency": "USD"
}
```

#### 43. Get Admin Profile
**GET** `/admin/profile`

#### 44. Update Admin Profile
**PUT** `/admin/profile`

```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "phone": "+1234567890"
}
```

#### 45. Create Backup
**POST** `/admin/backup`

#### 46. Get Backup
**GET** `/admin/backup`

---

## Common Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information"
}
```

### Validation Error Response
```json
{
  "success": false,
  "error": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

---

## Status Codes

- `200` - OK: Request succeeded
- `201` - Created: Resource created successfully
- `400` - Bad Request: Invalid request data
- `401` - Unauthorized: Authentication required or failed
- `403` - Forbidden: Insufficient permissions
- `404` - Not Found: Resource not found
- `409` - Conflict: Resource already exists
- `422` - Unprocessable Entity: Validation failed
- `500` - Internal Server Error: Server error

---

## Testing Notes

1. **Authentication**: Most endpoints require a valid JWT token in the Authorization header
2. **Admin Routes**: Admin endpoints require admin-level authentication
3. **File Uploads**: Use `multipart/form-data` content type for file upload endpoints
4. **Date Formats**: Use ISO 8601 format (YYYY-MM-DD) for dates
5. **Currency**: All amounts are in the configured currency (default: INR)
6. **Pagination**: Most list endpoints support `page` and `limit` query parameters
7. **Filtering**: Many endpoints support filtering via query parameters

---

## Environment Variables Required

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/expense_tracker
JWT_SECRET=your_jwt_secret_key
SESSION_SECRET=your_session_secret_key
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## Testing Tools

You can test these APIs using:
- **Postman**: Import endpoints and create collections
- **Thunder Client**: VS Code extension for API testing
- **cURL**: Command-line tool
- **REST Client**: VS Code extension with `.http` files

---

## Example: Complete User Flow

1. **Register**: `POST /api/auth/signup`
2. **Login**: `POST /api/auth/login` (get token)
3. **Create Profile**: `POST /api/profiles` (with token)
4. **Add Expense**: `POST /api/expenses` (with token)
5. **View Summary**: `GET /api/expenses/summary` (with token)
6. **Create Budget**: `POST /api/budgets` (with token)
7. **Track Transactions**: `POST /api/transactions` (with token)

---

**Last Updated**: January 30, 2026
**API Version**: 1.0.0
