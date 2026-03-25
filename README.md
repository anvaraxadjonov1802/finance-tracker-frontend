# Personal Finance Tracker Frontend

Shaxsiy moliyani boshqarish uchun yaratilgan frontend ilova. Ushbu loyiha foydalanuvchiga daromad, xarajat, transfer, qarz, byudjet va analytics ma’lumotlarini qulay UI orqali boshqarish imkonini beradi.

## Asosiy imkoniyatlar

- Login / Register
- JWT auth flow
- Token refresh
- Token muddati tugaganda avtomatik login pagega yo‘naltirish
- Responsive layout
- Dashboard analytics
- Accounts page
- Transactions page
- Transfers page
- Debts & Receivables page
- Budgets page
- Toast notification
- Skeleton loading
- Empty state UI

## Tech Stack

- React
- Vite
- Tailwind CSS
- Axios
- React Router DOM
- Recharts

## Sahifalar

- `LoginPage`
- `RegisterPage`
- `DashboardPage`
- `AccountsPage`
- `TransactionsPage`
- `TransfersPage`
- `DebtsPage`
- `BudgetsPage`

## O‘rnatish

### 1. Repository ni clone qilish

```bash
git clone <FRONTEND_REPOSITORY_URL>
cd <FRONTEND_PROJECT_FOLDER>
```

### 2. Paketlarni o‘rnatish

```bash
npm install
```

### 3. `.env` fayl yaratish

Loyiha rootida `.env` oching:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

Agar backend productionda bo‘lsa:

```env
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

### 4. Development serverni ishga tushirish

```bash
npm run dev
```

Frontend odatda quyidagi manzilda ishlaydi:

```text
http://localhost:5173/
```

## Build

Production build uchun:

```bash
npm run build
```

Preview uchun:

```bash
npm run preview
```

## Loyiha strukturasi

```bash
src/
│
├── api/
│   └── axios.js
│
├── components/
│   ├── common/
│   └── layout/
│
├── context/
│   ├── AuthContext.jsx
│   └── ToastContext.jsx
│
├── pages/
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── DashboardPage.jsx
│   ├── AccountsPage.jsx
│   ├── TransactionsPage.jsx
│   ├── TransfersPage.jsx
│   ├── DebtsPage.jsx
│   └── BudgetsPage.jsx
│
├── routes/
│   └── AppRouter.jsx
│
├── App.jsx
├── main.jsx
└── index.css
```

## Auth ishlash tartibi

Frontend quyidagicha ishlaydi:

1. User login yoki signup qiladi
2. `access_token` va `refresh_token` localStorage ga saqlanadi
3. Protected requestlarda access token avtomatik yuboriladi
4. Access token muddati tugasa refresh token bilan yangilanadi
5. Refresh token ham yaroqsiz bo‘lsa user avtomatik `/login` pagega yo‘naltiriladi

## Asosiy UI imkoniyatlari

### Dashboard
- total balance
- monthly income
- monthly expense
- net savings
- open debts
- open receivables
- expense pie chart
- income vs expense chart
- cashflow trend
- budget status
- recent daily summary

### Accounts
- yangi account qo‘shish
- account list
- balance ko‘rish
- delete

### Transactions
- income/expense qo‘shish
- account tanlash
- category tanlash
- filterlash
- delete

### Transfers
- accountlar orasida transfer
- exchange rate
- preview
- transfer list
- delete

### Debts
- debt / receivable qo‘shish
- status OPEN / CLOSED
- close / reopen
- filter
- delete

### Budgets
- monthly budget yaratish
- category limit qo‘shish
- actual vs plan
- progress
- delete

## Responsive Design

Loyiha mobile, tablet va desktop uchun moslashtirilgan.

Responsive qismlar:
- sidebar drawer
- responsive header
- responsive cards
- responsive forms
- responsive chart blocks
- responsive auth pages

## Deployment

Frontend deploy uchun tavsiya etiladi:

- Vercel
- Netlify

Deploydan oldin env varni to‘g‘ri qo‘ying:

```env
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

## Favicon

Favicon o‘zgartirish uchun `public/` ichiga icon joylab, `index.html` ichidagi quyidagini yangilang:

```html
<link rel="icon" type="image/png" href="/favicon.png" />
```

## Author

Created for hackathon MVP by **[YOUR_NAME]**

## License

This project is created for educational and hackathon purposes.
