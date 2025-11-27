# Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   cd user
   pnpm install
   ```

2. **Configure Environment**
   Create `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000/api
   ```

3. **Start Development Server**
   ```bash
   pnpm dev
   ```

## Project Structure

The project follows a feature-based architecture:

```
src/
├── config/          # Configuration (API endpoints)
├── features/        # Feature modules
│   ├── auth/        # Authentication
│   ├── users/       # User management
│   ├── investments/ # Investments
│   ├── wallet/      # Wallet operations
│   ├── transactions/# Transactions
│   ├── income/      # Income tracking
│   ├── referrals/   # Referrals
│   ├── deposits/    # Deposits
│   └── settings/    # Settings
├── lib/             # Core libraries
│   ├── api/         # Base API
│   ├── slices/      # Redux slices
│   └── store.ts     # Redux store
├── components/      # Reusable components
├── providers/       # Context providers
└── hooks/          # Global hooks
```

## Features

- ✅ Redux Toolkit + RTK Query
- ✅ Feature-based structure
- ✅ TypeScript
- ✅ Theme system (Light/Dark)
- ✅ Mobile-first design
- ✅ Custom hooks for all features
- ✅ Proper error handling
- ✅ Loading states

## API Configuration

Update `NEXT_PUBLIC_API_URL` in `.env.local` to point to your server API.

Default: `http://localhost:3000/api`

## Theme

The app supports light and dark themes. Toggle using the theme button in the header.

Default theme: Light (white)








