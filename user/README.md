# AI Earn Bot - User Application

A modern, mobile-first Next.js application with Redux Toolkit and RTK Query for managing investments and wallet operations.

## 🚀 Features

- ✅ **Feature-based folder structure** - Organized by features (auth, investments, wallet, etc.)
- ✅ **Redux Toolkit + RTK Query** - State management and API calls
- ✅ **Theme System** - Light/Dark theme with theme toggle
- ✅ **Mobile-First Design** - Responsive UI optimized for mobile devices
- ✅ **TypeScript** - Full type safety
- ✅ **Custom Hooks** - Reusable hooks for all features
- ✅ **Best Practices** - Clean code architecture

## 📁 Project Structure

```
user/
├── src/
│   ├── config/           # Configuration files
│   │   └── api.config.ts # API endpoints configuration
│   ├── features/         # Feature-based modules
│   │   ├── auth/         # Authentication
│   │   │   ├── api/      # RTK Query API slice
│   │   │   └── hooks/    # Custom hooks
│   │   ├── users/        # User management
│   │   ├── investments/ # Investment management
│   │   ├── wallet/       # Wallet operations
│   │   ├── transactions/# Transaction history
│   │   ├── income/       # Income tracking
│   │   └── referrals/    # Referral system
│   ├── lib/              # Core libraries
│   │   ├── api/          # Base API configuration
│   │   ├── slices/       # Redux slices
│   │   └── store.ts      # Redux store
│   ├── components/       # Reusable components
│   │   ├── ui/          # UI components (Button, Card, Input)
│   │   └── layout/      # Layout components
│   ├── providers/       # Context providers
│   │   ├── ReduxProvider.tsx
│   │   └── ThemeProvider.tsx
│   └── hooks/           # Global hooks
├── app/                 # Next.js app directory
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Home page
│   └── globals.css     # Global styles
└── package.json
```

## 🛠️ Setup

### 1. Install Dependencies

```bash
cd user
pnpm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the `user` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

For production:
```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
```

### 3. Run Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3001` (or next available port).

## 📚 Usage

### Using Hooks

#### Authentication
```typescript
import { useAuth } from '@/features/auth/hooks/useAuth';

function LoginComponent() {
  const { login, isLoggingIn, error } = useAuth();
  
  const handleLogin = async () => {
    try {
      await login({ telegramChatId: 123456789 });
    } catch (err) {
      console.error('Login failed:', err);
    }
  };
}
```

#### User Data
```typescript
import { useUser } from '@/features/users/hooks/useUser';

function ProfileComponent() {
  const { user, isLoading, updateProfile } = useUser();
  
  return (
    <div>
      {isLoading ? 'Loading...' : <p>Welcome, {user?.name}</p>}
    </div>
  );
}
```

#### Wallet
```typescript
import { useWallet } from '@/features/wallet/hooks/useWallet';

function WalletComponent() {
  const { balance, deposit, withdraw, isLoading } = useWallet();
  
  return (
    <div>
      <p>Total: ${balance?.total ?? 0}</p>
      <p>Investment Wallet: ${balance?.investmentWallet ?? 0}</p>
      <p>Earning Wallet: ${balance?.earningWallet ?? 0}</p>
    </div>
  );
}
```

#### Investments
```typescript
import { useInvestments } from '@/features/investments/hooks/useInvestments';

function InvestmentsComponent() {
  const { investments, createInvestment, isLoading } = useInvestments();
  
  return (
    <div>
      {investments.map(inv => (
        <div key={inv.id}>{inv.amount}</div>
      ))}
    </div>
  );
}
```

### Theme Toggle

The theme can be toggled using the `ThemeToggle` component or programmatically:

```typescript
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { toggleTheme } from '@/lib/slices/themeSlice';

function MyComponent() {
  const dispatch = useAppDispatch();
  
  return (
    <button onClick={() => dispatch(toggleTheme())}>
      Toggle Theme
    </button>
  );
}
```

## 🎨 UI Components

### Button
```typescript
import Button from '@/components/ui/Button';

<Button variant="primary" size="md" fullWidth>
  Click Me
</Button>
```

### Card
```typescript
import Card from '@/components/ui/Card';

<Card>
  <h2>Card Title</h2>
  <p>Card content</p>
</Card>
```

### Input
```typescript
import Input from '@/components/ui/Input';

<Input
  label="Email"
  type="email"
  placeholder="Enter your email"
  error={errors.email}
/>
```

### MobileLayout
```typescript
import MobileLayout from '@/components/layout/MobileLayout';

<MobileLayout>
  <h1>Page Content</h1>
</MobileLayout>
```

## 🔌 API Configuration

All API endpoints are configured in `src/config/api.config.ts`. The base URL is set via environment variable `NEXT_PUBLIC_API_URL`.

### Available Endpoints

- **Auth**: `/api/auth/signup`, `/api/auth/login`, `/api/auth/verify`
- **Users**: `/api/users/profile`
- **Investments**: `/api/investments`, `/api/investments/my`
- **Wallet**: `/api/wallet/balance`, `/api/wallet/deposit`, `/api/wallet/withdraw`
- **Transactions**: `/api/transactions/my`
- **Income**: `/api/income/summary`, `/api/income/history`
- **Referrals**: `/api/referrals/stats`, `/api/referrals`
- **Investment Plans**: `/api/investment-plans`

## 🎯 Best Practices

1. **Feature-based structure** - Each feature has its own folder with API and hooks
2. **Type safety** - All API responses are typed
3. **Error handling** - Errors are handled at the hook level
4. **Loading states** - All hooks provide loading states
5. **Mobile-first** - All components are designed mobile-first
6. **Theme support** - All components support light/dark themes
7. **Reusable hooks** - Custom hooks for all operations
8. **RTK Query caching** - Automatic caching and invalidation

## 📱 Mobile-First Design

All components are designed with mobile devices in mind:
- Responsive breakpoints: `sm:`, `md:`, `lg:`
- Touch-friendly button sizes
- Optimized font sizes for mobile
- Full-width buttons on mobile
- Proper spacing and padding

## 🌓 Theme System

The app supports light and dark themes:
- Default theme: Light
- Theme persisted in localStorage
- Smooth transitions between themes
- All components support both themes

## 🚀 Building for Production

```bash
pnpm build
pnpm start
```

## 📝 Notes

- Make sure your server is running and accessible at the configured API URL
- Authentication tokens are stored in localStorage
- The app automatically handles token expiration (401 errors)
- All API calls include authentication headers when a token is available

## 🔗 Related

- Server API: See `server/` directory
- API Documentation: See `server/AUTH_API_DOCUMENTATION.md`
