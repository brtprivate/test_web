import { PlanPayoutType, PlanType, WeeklyVisibilityWindow } from '../models/investment-plan.model';

export interface CreateInvestmentPlanDto {
  name: string;
  description?: string;
  minAmount: number;
  maxAmount?: number;
  dailyROI?: number;
  compoundingEnabled?: boolean;
  planType?: PlanType;
  durationDays?: number;
  payoutType?: PlanPayoutType;
  payoutDelayHours?: number;
  lumpSumROI?: number;
  visibility?: WeeklyVisibilityWindow;
  displayOrder?: number;
}

export interface UpdateInvestmentPlanDto extends Partial<CreateInvestmentPlanDto> {
  isActive?: boolean;
}

export interface InvestmentPlanResponse {
  id: string;
  name: string;
  description?: string;
  minAmount: number;
  maxAmount?: number;
  dailyROI?: number;
  compoundingEnabled: boolean;
  isActive: boolean;
  planType: PlanType;
  durationDays: number;
  payoutType: PlanPayoutType;
  payoutDelayHours?: number;
  lumpSumROI?: number;
  visibility?: WeeklyVisibilityWindow;
  displayOrder: number;
  isVisibleNow: boolean;
  nextVisibleAt?: Date | null;
}








