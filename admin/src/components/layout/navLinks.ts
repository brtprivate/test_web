import {
  LayoutDashboard,
  Users,
  LineChart,
  DollarSign,
  Settings,
  Share2,
  Package,
  ArrowDownCircle,
  Wallet,
  TrendingUp,
  Layers,
  UserCheck,
  UserCircle2,
  Coins,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Users', href: '/users', icon: Users },
  { label: 'Deposits', href: '/deposits', icon: Coins },
  { label: 'Investments', href: '/investments', icon: LineChart },
  { label: 'Investment Plans', href: '/investment-plans', icon: Package },
  { label: 'Daily ROI', href: '/incomes/daily-roi', icon: TrendingUp },
  { label: 'Team Levels', href: '/incomes/team-levels', icon: Layers },
  { label: 'Referrals', href: '/incomes/referrals', icon: UserCheck },
  { label: 'Withdrawals', href: '/withdrawals', icon: ArrowDownCircle },
  { label: 'Wallet Adjustments', href: '/wallet-adjustments', icon: Wallet },
  { label: 'Network Teams', href: '/teams', icon: Share2 },
  { label: 'Management', href: '/management', icon: Settings },
  { label: 'Profile', href: '/profile', icon: UserCircle2 },
];


