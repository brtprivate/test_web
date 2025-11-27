"use client";

import { FormProvider } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useLoginForm } from '@/features/auth/hooks/useLoginForm';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export const LoginForm = () => {
  const { form, onSubmit, isLoading } = useLoginForm();
  useAuthGuard({ allowWhenAuthenticated: '/dashboard' });
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-1">
          <Input
            label="Admin Email"
            placeholder="admin@aiearnbot.io"
            type="email"
            autoComplete="email"
            {...register('email')}
            error={errors.email?.message}
          />
        </div>

        <div className="space-y-1">
          <Input
            label="Password"
            placeholder="••••••••"
            type="password"
            autoComplete="current-password"
            {...register('password')}
            error={errors.password?.message}
          />
        </div>

        <Button type="submit" loading={isLoading} className="w-full py-3 text-base">
          Secure Login
        </Button>
      </form>
    </FormProvider>
  );
};


