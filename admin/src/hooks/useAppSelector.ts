"use client";

import { useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { RootState } from '@/lib/store';

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;


