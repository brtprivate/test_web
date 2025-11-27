"use client";

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAdminLoginMutation } from '@/features/auth/api';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { setCredentials } from '@/lib/slices/authSlice';

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const useLoginForm = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [loginMutation, { isLoading }] = useAdminLoginMutation();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = useCallback(
    async (values: LoginFormValues) => {
      try {
        const result = await loginMutation(values).unwrap();
        if (!result?.admin || !result?.token) {
          throw new Error('Unable to parse login response');
        }

        dispatch(
          setCredentials({
            token: result.token,
            admin: {
              ...result.admin,
            },
          })
        );

        toast.success('Welcome back, admin 👋');
        router.push('/dashboard');
      } catch (error: unknown) {
        type ApiError = { data?: { message?: string } } & { message?: string };
        let message = 'Unable to sign in. Please try again.';
        if (typeof error === 'object' && error !== null) {
          const apiError = error as ApiError;
          message = apiError.data?.message || apiError.message || message;
        }
        toast.error(message);
      }
    },
    [dispatch, loginMutation, router]
  );

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isLoading,
  };
};


