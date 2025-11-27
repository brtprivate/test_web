export type PlanType = 'bot' | 'weekly';
export type PlanPayoutType = 'daily' | 'lump_sum';

export interface WeeklyVisibility {
  dayOfWeek: number;
  startHourUtc?: number;
  durationHours?: number;
}

export interface InvestmentPlan {
  _id: string;
  name: string;
  description?: string;
  minAmount: number;
  maxAmount?: number;
  dailyROI?: number;
  compoundingEnabled?: boolean;
  isActive: boolean;
  planType: PlanType;
  durationDays: number;
  payoutType: PlanPayoutType;
  payoutDelayHours?: number;
  lumpSumROI?: number;
  visibility?: WeeklyVisibility;
  displayOrder?: number;
  createdAt?: string;
  updatedAt?: string;
  isVisibleNow?: boolean;
  nextVisibleAt?: string | null;
}

export interface InvestmentPlanResponse {
  status: string;
  results: number;
  data: {
    plans: InvestmentPlan[];
  };
}




