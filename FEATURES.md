# ExpenseWiz Features

A comprehensive expense tracking application with AI-powered insights and mobile support.

## 🚀 Core Features

### 1. Expense Management
- Add, edit, and delete expenses
- Category-based organization
- Multiple payment method tracking
- Vendor/merchant tracking
- Date-based filtering
- Notes and descriptions

### 2. Budget Tracking
- Set monthly budgets by category
- Real-time budget usage visualization
- Progress bars and charts
- Budget vs. actual comparisons
- Smart budget alerts with push notifications
- Customizable alert thresholds (50%, 80%, 95%)
- Automatic notification throttling (24h cooldown)

### 3. Dashboard Analytics
- Total expense summary
- Monthly spending overview
- Category-wise breakdown (Pie chart)
- Budget comparison (Bar chart)
- Recent transactions list

## 🤖 AI-Powered Features

### 4. AI Expense Categorization
- Automatic category suggestions based on:
  - Description
  - Vendor name
  - Amount
- Powered by Google Gemini 2.5 Flash
- One-click categorization in Add Expense form

### 5. AI Financial Assistant
- Chat-based interface
- Context-aware advice using your expense data
- Personalized financial insights
- Budget optimization suggestions
- Spending pattern analysis
- Streaming responses for real-time interaction

## 📊 Advanced Analytics

### 6. Enhanced Analytics Dashboard
- Monthly spending trends (Line chart)
- Category-wise spending (Bar chart)
- Statistical insights:
  - Total expenses
  - Average expense
  - Monthly trend percentage
- Visual trend indicators

## 🔄 Recurring Expenses

### 7. Recurring Expense Tracker
- Manage subscriptions and recurring bills
- Configurable frequencies:
  - Weekly
  - Monthly
  - Yearly
- Enable/disable recurring items
- Track payment methods
- Auto-generate expenses (planned)

## 📤 Data Export

### 8. Export Functionality
- Export expenses to CSV (Excel/Sheets compatible)
- Export to JSON (Developer-friendly format)
- Date range filtering
- Includes all expense details

## 🔔 Smart Budget Alerts

### 9. Push Notifications for Budget Tracking
- Real-time budget threshold alerts
- Customizable thresholds per category (default 80%)
- Three alert levels:
  - Warning: 80% of budget reached
  - Urgent: 90% of budget reached  
  - Exceeded: Over 100% of budget
- Native mobile push notifications (iOS & Android)
- Toast notifications for web/PWA
- Smart throttling (one notification per 24 hours per category)
- Automatic checks when adding expenses

## 💱 Multi-Currency Support

### 10. International Expense Tracking
- Support for 20+ major world currencies
- Currency flags for visual identification
- Per-expense currency selection
- Automatic exchange rate conversion
- Real-time rates via API (with 24h caching)
- Default currency preference per user
- Budget tracking in default currency
- Original currency preserved on expenses
- Exchange rate history tracking

## 📱 Mobile Features

### 11. Native Mobile App (Capacitor)
- iOS and Android support
- Native performance
- Offline support
- Camera integration (planned for receipt scanning)
- Push notifications for budget alerts
- Touch-optimized UI
- Bottom navigation bar for easy mobile access
- Floating AI assistant button

## 🎨 Design Features

- Dark/Light theme support
- Responsive design for all screen sizes
- Mobile-first Material Design approach
- Touch-friendly buttons (48dp minimum)
- Beautiful gradients and animations
- Intuitive bottom navigation (mobile)
- Emoji support throughout the app 💰📊🎯
- Color-coded categories and alerts

## 🔐 Security

- Row Level Security (RLS) on all tables
- User-specific data isolation
- Secure authentication via Supabase
- Protected API endpoints
- Encrypted secrets management

## 💡 Coming Soon

1. **Receipt Scanning**
   - Camera integration
   - OCR for receipt data extraction
   - Automatic expense creation from photos

2. **Expense Categories AI Learning**
   - Learn from user corrections
   - Improve categorization accuracy over time
   - Personalized category suggestions

3. **Expense Splitting**
   - Split expenses with friends/family
   - Group expense tracking
   - Automatic settlement calculations
   - QR code sharing

4. **Savings Goals**
   - Set savings targets
   - Track progress visually
   - Goal-based budgeting
   - Milestone celebrations

5. **Advanced Reporting**
   - PDF expense reports
   - Tax-ready exports
   - Custom date ranges
   - Category summaries

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **AI**: Lovable AI Gateway (Google Gemini 2.5 Flash)
- **Mobile**: Capacitor
- **Charts**: Recharts
- **UI Components**: Radix UI, Shadcn/ui

## 📊 Database Schema

### Tables
- **expenses**: User expenses with currency support and conversion rates
- **budgets**: Monthly budget allocations by category
- **recurring_expenses**: Subscription and recurring bill tracking
- **budget_alerts**: Alert configurations with thresholds
- **ai_chat_history**: AI assistant conversation history
- **profiles**: User profile information with default currency
- **exchange_rates**: Cached currency exchange rates

## 🎯 Use Cases

1. **Personal Finance Management**
   - Track daily expenses
   - Monitor spending habits
   - Stay within budget

2. **Small Business Expense Tracking**
   - Categorize business expenses
   - Generate expense reports
   - Tax preparation support

3. **Family Budget Management**
   - Shared expense tracking
   - Category-wise family budgets
   - Financial planning

4. **Student Budget Tracking**
   - Manage limited budgets
   - Track spending categories
   - Plan future expenses

## 📈 Performance

- Optimized database queries with indexes
- Lazy loading for large datasets
- Efficient real-time updates
- Fast AI responses with streaming
- Mobile-optimized assets

## 🌐 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📱 Mobile Device Support

- iOS 13+
- Android 7.0+
- Tablet support
- Landscape and portrait modes
