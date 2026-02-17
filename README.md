# Expense Tracker - Full Stack Application

A comprehensive expense tracking application with a Node.js/Express backend, React admin panel, and Flutter mobile app support.

## Features

- **User Authentication** - JWT-based auth with Google & LinkedIn OAuth support
- **Expense Management** - Track daily expenses with categories
- **Budget Planning** - Set monthly budgets and track spending
- **Transaction History** - Complete history of all financial transactions
- **Auto Expenses** - Set up recurring/automatic expenses
- **Income Tax Help** - Request assistance for tax-related queries
- **Admin Panel** - Full-featured React admin dashboard
- **Mobile Ready** - Flutter API services included

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Nodemailer** for emails
- **Multer** for file uploads

### Admin Panel
- **React 18** with Vite
- **Material UI (MUI)**
- **React Router v6**
- **Axios** for API calls

### Mobile (Flutter)
- **Dart** API services
- **HTTP** package for networking

## Project Structure

```
expense_tracker/
├── backend/                 # Node.js Express API
│   ├── config/              # Database & multer config
│   ├── controllers/         # Route controllers
│   ├── middleware/          # Auth & validation middleware
│   ├── models/              # Mongoose schemas
│   ├── routes/              # API routes
│   ├── utils/               # Email service & utilities
│   ├── uploads/             # File uploads directory
│   ├── server.js            # Main server file
│   ├── expense_service.dart # Flutter API services
│   └── main.dart            # Flutter app example
│
├── admin-panel/             # React Admin Dashboard
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── contexts/        # React contexts
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   └── config/          # API configuration
│   └── vite.config.js
│
└── uploads/                 # Global uploads directory
    └── avatars/
```

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server**
   ```bash
   # Development mode with hot reload
   npm run dev
   
   # Production mode
   npm start
   ```

   Server runs on `http://localhost:3000`

### Admin Panel Setup

1. **Navigate to admin-panel directory**
   ```bash
   cd admin-panel
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

   Admin panel runs on `http://localhost:5173`

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Server
PORT=3000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/expense_tracker

# JWT
JWT_SECRET=your-secret-key
ADMIN_JWT_SECRET=your-admin-secret

# Session
SESSION_SECRET=your-session-secret

# Email (Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Frontend URLs
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/signin/google` | Google OAuth |
| POST | `/api/auth/signin/linkedin` | LinkedIn OAuth |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password |
| POST | `/api/auth/logout` | Logout user |

### Users & Profiles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users (admin) |
| GET | `/api/profiles` | Get all profiles |
| GET | `/api/profiles/me` | Get current user profile |
| PUT | `/api/profiles/:id` | Update profile |

### Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses` | Get user expenses |
| POST | `/api/expenses` | Create expense |
| PUT | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Delete expense |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | Get transactions |
| POST | `/api/transactions` | Create transaction |
| PUT | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | Get all categories |
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category |

### Budgets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/budgets` | Get user budgets |
| POST | `/api/budgets` | Create budget |
| PUT | `/api/budgets/:id` | Update budget |
| DELETE | `/api/budgets/:id` | Delete budget |

### Admin Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/settings` | Get admin settings |
| PUT | `/api/admin/settings` | Update settings |
| GET | `/api/admin/profile` | Get admin profile |
| PUT | `/api/admin/profile` | Update profile |
| POST | `/api/admin/backup` | Create backup |
| POST | `/api/admin/backup/restore` | Restore backup |

## Flutter Integration

The Flutter API services are provided in `backend/expense_service.dart`. 

### Usage Example

```dart
import 'expense_service.dart';

void main() async {
  // Initialize API client
  final api = ExpenseTrackerAPI(baseUrl: "http://10.0.2.2:3000/api");
  
  // Login
  final loginResult = await api.auth.login(
    email: "user@example.com",
    password: "password123",
  );
  
  if (loginResult.success) {
    // Get expenses
    final expenses = await api.expenses.getExpenses();
    
    // Create transaction
    await api.transactions.createTransaction(
      item: "Groceries",
      amount: 500.0,
      type: "expense",
      category: "Food",
    );
    
    // Get budgets
    final budgets = await api.budgets.getBudgets();
  }
}
```

### Available Services

- `api.auth` - Authentication (login, signup, OAuth)
- `api.profiles` - User profiles
- `api.expenses` - Expense management
- `api.transactions` - Transaction management
- `api.categories` - Category management
- `api.budgets` - Budget management
- `api.autoExpenses` - Recurring expenses

## Deployment

### Render Deployment (Backend)

1. Create new Web Service
2. Connect your GitHub repo
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables

### Vercel Deployment (Admin Panel)

1. Import project from GitHub
2. Set root directory to `admin-panel`
3. Framework preset: Vite
4. Add environment variables

## API Testing

See [API_TESTING_SAMPLES.md](API_TESTING_SAMPLES.md) for comprehensive API testing examples with sample requests and responses.

## Security Notes

- Always use HTTPS in production
- Never commit `.env` files
- Use strong JWT secrets (min 64 characters)
- Enable 2FA for admin accounts
- Regularly rotate secrets and tokens

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues or questions, please open an issue on GitHub.
