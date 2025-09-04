# FinanceFlow - Personal Finance Tracker

A comprehensive personal finance management application built with React, Node.js, and PostgreSQL. Track your income, expenses, budgets, and financial analytics all in one place.

## Features

### 🏦 Account Management
- **Secure Authentication**: User registration and login with JWT tokens
- **Profile Management**: Update personal information, username, and email
- **Password Security**: Change passwords with current password verification

### 💰 Transaction Management
- **Add Transactions**: Record income and expense transactions
- **Categorization**: Organize transactions by categories (Food, Transport, Entertainment, etc.)
- **Transaction History**: View and filter your complete transaction history
- **Edit & Delete**: Modify or remove transactions as needed

### 📊 Budget Management
- **Period-based Budgets**: Create weekly, monthly, or yearly budgets
- **Category Budgeting**: Set spending limits for specific categories
- **Budget Tracking**: Monitor spending against budget limits
- **Visual Indicators**: Progress bars and alerts for budget status

### 📈 Analytics & Reports
- **Spending Analytics**: View spending patterns over time
- **Category Breakdown**: Pie charts showing spending by category
- **Monthly Reports**: Detailed financial summaries
- **Visual Charts**: Interactive graphs for better insight

### 🎨 User Experience
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Dark/Light Mode**: Comfortable viewing experience
- **Intuitive Interface**: Clean, modern design with easy navigation
- **Real-time Updates**: Instant feedback on all actions

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Recharts** for data visualization

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **PostgreSQL** database
- **JWT** for authentication
- **bcryptjs** for password hashing

### Deployment
- **Frontend**: Served via Express static files
- **Backend**: Express.js server
- **Database**: PostgreSQL (Heroku Postgres)
- **Hosting**: Heroku with environment-based configuration

## Getting Started

### Prerequisites
- Node.js 18.x or higher
- PostgreSQL database
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/FinanceFlow.git
   cd FinanceFlow
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend && npm install
   
   # Install frontend dependencies
   cd ../frontend && npm install
   cd ..
   ```

3. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb financeflow
   
   # Run database migrations
   cd backend
   npm run db:setup
   ```

4. **Environment Configuration**
   ```bash
   # Backend environment
   cp backend/.env.example backend/.env
   # Edit backend/.env with your database credentials
   
   # Frontend environment (optional)
   cp frontend/.env.example frontend/.env.local
   ```

5. **Start Development Servers**
   ```bash
   # Start backend server (from root)
   npm run dev:backend
   
   # Start frontend server (in another terminal)
   npm run dev:frontend
   ```

6. **Open Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/financeflow

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Server
PORT=3001
NODE_ENV=development
```

### Frontend (.env.local)
```env
# API Configuration (optional for development)
REACT_APP_API_URL=http://localhost:3001/api
```

## Database Schema

### Users Table
- id, username, email, password_hash, first_name, last_name
- Created/updated timestamps
- Unique constraints on username and email

### Categories Table
- id, name, type (income/expense), user_id
- Default categories created for all users

### Transactions Table
- id, user_id, category_id, amount, description, date
- Foreign keys to users and categories

### Budgets Table
- id, user_id, category_id, amount, period, spent
- Period-based budgeting (weekly/monthly/yearly)

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/update-profile` - Update profile
- `PUT /api/auth/update-password` - Change password

### Transactions
- `GET /api/transactions` - List user transactions
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category

### Budgets
- `GET /api/budgets` - List budgets
- `POST /api/budgets` - Create budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget

## Scripts

```bash
# Development
npm run dev:backend          # Start backend development server
npm run dev:frontend         # Start frontend development server

# Building
npm run build               # Build both frontend and backend
npm run build:backend       # Build backend only
npm run build:frontend      # Build frontend only

# Production
npm start                   # Start production server

# Database
npm run db:setup           # Run database setup scripts
```

## Project Structure

```
FinanceFlow/
├── backend/                 # Backend Express.js application
│   ├── src/
│   │   ├── models/         # Database models
│   │   ├── routes/         # API route handlers
│   │   ├── middleware/     # Authentication middleware
│   │   └── server.ts       # Express server setup
│   ├── database/           # Database setup scripts
│   └── package.json
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API service layer
│   │   └── types/          # TypeScript type definitions
│   └── package.json
├── package.json            # Root package.json
└── README.md
```

## Key Features Details

### User Authentication
- Username-based login system (email optional)
- Secure password hashing with bcrypt
- JWT token authentication
- Profile management with username/email editing

### Budget System
- Period-based budgets (weekly, monthly, yearly)
- Category-specific budget limits
- Real-time spending tracking
- Budget progress visualization

### Transaction Categories
- Pre-defined categories for common expenses
- Custom category creation
- Income vs expense categorization
- Category-based reporting

### Responsive Design
- Mobile-first approach
- Tailwind CSS for consistent styling
- Sidebar navigation with collapsible mobile menu
- Touch-friendly interface elements

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Security Features

- Password strength requirements (minimum 6 characters)
- JWT token expiration
- Input validation and sanitization
- SQL injection prevention with parameterized queries
- XSS protection through React's built-in sanitization

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue on GitHub or contact the development team.

---

**FinanceFlow** - Take control of your finances with ease! 💰📊
