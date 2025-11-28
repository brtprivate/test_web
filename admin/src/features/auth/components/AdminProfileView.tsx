"use client";

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Shield, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useChangeAdminPasswordMutation, useGetAdminProfileQuery } from '@/features/auth/api';
import { updateProfile } from '@/lib/slices/authSlice';

type PasswordFormState = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const formatDate = (value?: string) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

export const AdminProfileView = () => {
  const admin = useAppSelector((state) => state.adminAuth.admin);
  const token = useAppSelector((state) => state.adminAuth.token);
  const dispatch = useAppDispatch();

  const { data, refetch, isFetching: isProfileRefreshing } = useGetAdminProfileQuery(undefined, {
    skip: !admin?.id,
  });
  const [changePassword, { isLoading: isChangingPassword }] = useChangeAdminPasswordMutation();

  const [passwordForm, setPasswordForm] = useState<PasswordFormState>({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  useEffect(() => {
    if (data?.admin) {
      dispatch(updateProfile(data.admin));
    }
  }, [data?.admin, dispatch]);

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }

    try {
      await changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      }).unwrap();

      toast.success('Password updated successfully.');
      setPasswordForm({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      const message = error?.data?.message ?? 'Failed to change password.';
      toast.error(message);
    }
  };

  const handleRefreshProfile = async () => {
    const result = await refetch();
    if (result?.data?.admin) {
      dispatch(updateProfile(result.data.admin));
      toast.success('Profile synchronized.');
      return;
    }
    toast.error('Unable to refresh profile.');
  };

  const profile = data?.admin ?? admin;

  const sessionMeta = useMemo(() => {
    if (!profile) return [];
    return [
      profile.role && {
        label: 'Role',
        value: profile.role.replace('_', ' ').toUpperCase(),
      },
      {
        label: 'Status',
        value: profile.isActive ? 'Active' : 'Suspended',
      },
      profile.lastLogin && {
        label: 'Last login',
        value: formatDate(profile.lastLogin),
      },
      profile.createdAt && {
        label: 'Member since',
        value: formatDate(profile.createdAt),
      },
    ].filter(Boolean) as Array<{ label: string; value: string }>;
  }, [profile]);

  const accountInfo = useMemo(() => {
    if (!profile) return [];
    return [
      profile.id && {
        label: 'Admin ID',
        value: profile.id,
      },
      profile.username && {
        label: 'Username',
        value: profile.username,
      },
      profile.email && {
        label: 'Email',
        value: profile.email,
      },
      token && {
        label: 'Session token',
        value: `${token.slice(0, 6)}••••${token.slice(-4)}`,
      },
    ].filter(Boolean) as Array<{ label: string; value: string }>;
  }, [profile, token]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-[--color-mutedForeground]">
          Account security
        </p>
        <h1 className="text-2xl font-semibold text-[--color-foreground]">Profile & access control</h1>
        <p className="text-sm text-[--color-mutedForeground]">
          Required admin details pulled from the API plus a dedicated password rotation panel.
        </p>
      </header>

      <Card title="Change password" subtitle="Rotate credentials anytime you suspect risk.">
        <form className="space-y-4" onSubmit={handlePasswordSubmit}>
          <Input
            label="Current password"
            type="password"
            placeholder="••••••••"
            value={passwordForm.oldPassword}
            onChange={(event) =>
              setPasswordForm((prev) => ({ ...prev, oldPassword: event.target.value }))
            }
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="New password"
              type="password"
              placeholder="At least 8 characters"
              value={passwordForm.newPassword}
              onChange={(event) =>
                setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))
              }
            />
            <Input
              label="Confirm new password"
              type="password"
              placeholder="Repeat new password"
              value={passwordForm.confirmPassword}
              onChange={(event) =>
                setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
              }
            />
          </div>
          <Button type="submit" icon={<Shield size={16} />} loading={isChangingPassword}>
            Update password
          </Button>
        </form>
      </Card>
    </div>
  );
};


