import { API_CONFIG } from '@/config/api.config';
import { baseApi } from '@/lib/api/baseApi';
import type { InvestmentPlan, InvestmentPlanResponse, PlanPayoutType, PlanType, WeeklyVisibility } from '@/features/plans/types';

export interface CreatePlanDto {
  name: string;
  description?: string;
  minAmount: number;
  maxAmount?: number;
  dailyROI?: number;
  compoundingEnabled?: boolean;
  planType: PlanType;
  durationDays: number;
  payoutType: PlanPayoutType;
  payoutDelayHours?: number;
  lumpSumROI?: number;
  visibility?: WeeklyVisibility;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdatePlanDto extends Partial<CreatePlanDto> {}

export const plansApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getInvestmentPlans: build.query<InvestmentPlan[], void>({
      query: () => ({
        url: API_CONFIG.ENDPOINTS.INVESTMENT_PLANS.ROOT,
        method: 'GET',
        params: {
          audience: 'admin',
          includeHiddenWeekly: true,
        },
      }),
      providesTags: ['Plans'],
      transformResponse: (response: InvestmentPlanResponse) => response.data.plans,
    }),
    createPlan: build.mutation<{ data: { plan: InvestmentPlan } }, CreatePlanDto>({
      query: (body) => ({
        url: API_CONFIG.ENDPOINTS.INVESTMENT_PLANS.ROOT,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Plans'],
    }),
    updatePlan: build.mutation<{ data: { plan: InvestmentPlan } }, { id: string; body: UpdatePlanDto }>({
      query: ({ id, body }) => ({
        url: API_CONFIG.ENDPOINTS.INVESTMENT_PLANS.BY_ID(id),
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Plans'],
    }),
    deletePlan: build.mutation<void, string>({
      query: (id) => ({
        url: API_CONFIG.ENDPOINTS.INVESTMENT_PLANS.BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: ['Plans'],
    }),
  }),
});

export const {
  useGetInvestmentPlansQuery,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useDeletePlanMutation,
} = plansApi;


