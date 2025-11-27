import { IInvestmentPlan, InvestmentPlan, PlanPayoutType, PlanType } from '../models/investment-plan.model';
import { CreateInvestmentPlanDto, UpdateInvestmentPlanDto } from '../types/investment-plan.types';

const HOURS_IN_DAY = 24;
const MS_IN_HOUR = 60 * 60 * 1000;
const MS_IN_DAY = HOURS_IN_DAY * MS_IN_HOUR;
const REMINDER_WINDOW_HOURS = 24;

export class InvestmentPlanService {
  async createPlan(data: CreateInvestmentPlanDto): Promise<IInvestmentPlan> {
    const plan = new InvestmentPlan(data);
    return await plan.save();
  }

  async getAllPlans(activeOnly: boolean = false, planType?: PlanType): Promise<IInvestmentPlan[]> {
    const query: Record<string, unknown> = activeOnly ? { isActive: true } : {};
    if (planType) {
      query.planType = planType;
    }
    return await InvestmentPlan.find(query).sort({ displayOrder: 1, minAmount: 1 });
  }

  async getPlanById(id: string): Promise<IInvestmentPlan | null> {
    return await InvestmentPlan.findById(id);
  }

  async getPlanByAmount(
    amount: number,
    options?: { planType?: PlanType; includeInactive?: boolean }
  ): Promise<IInvestmentPlan | null> {
    const query: Record<string, unknown> = {
      minAmount: { $lte: amount },
      $or: [{ maxAmount: { $gte: amount } }, { maxAmount: { $exists: false } }],
    };

    if (!options?.includeInactive) {
      query.isActive = true;
    }

    if (options?.planType) {
      query.planType = options.planType;
    }

    return await InvestmentPlan.findOne(query).sort({ minAmount: -1, displayOrder: 1 });
  }

  async updatePlan(id: string, data: UpdateInvestmentPlanDto): Promise<IInvestmentPlan | null> {
    return await InvestmentPlan.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  async deletePlan(id: string): Promise<boolean> {
    const result = await InvestmentPlan.findByIdAndDelete(id);
    return !!result;
  }

  isPlanVisible(plan: IInvestmentPlan, referenceDate: Date = new Date()): boolean {
    if (!plan.isActive) {
      return false;
    }

    if (plan.planType !== 'weekly' || !plan.visibility?.dayOfWeek) {
      return true;
    }

    const { dayOfWeek, startHourUtc = 0, durationHours = HOURS_IN_DAY } = plan.visibility;
    const currentDay = referenceDate.getUTCDay();
    if (currentDay !== dayOfWeek) {
      return false;
    }

    const windowStart = new Date(
      Date.UTC(
        referenceDate.getUTCFullYear(),
        referenceDate.getUTCMonth(),
        referenceDate.getUTCDate(),
        startHourUtc,
        0,
        0,
        0
      )
    );
    const windowEnd = new Date(windowStart.getTime() + durationHours * MS_IN_HOUR);

    return referenceDate >= windowStart && referenceDate < windowEnd;
  }

  getNextVisibilityDate(plan: IInvestmentPlan, referenceDate: Date = new Date()): Date | null {
    if (plan.planType !== 'weekly' || !plan.visibility?.dayOfWeek) {
      return null;
    }

    const { dayOfWeek, startHourUtc = 0, durationHours = HOURS_IN_DAY } = plan.visibility;
    const now = referenceDate;
    const currentDay = now.getUTCDay();
    const daysUntilNext =
      (dayOfWeek - currentDay + 7 - (this.isPlanVisible(plan, now) ? 7 : 0) + 7) % 7;

    const nextWindow = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        startHourUtc,
        0,
        0,
        0
      )
    );
    nextWindow.setUTCDate(nextWindow.getUTCDate() + daysUntilNext);

    // If we're already past today's window, push to next week
    if (
      daysUntilNext === 0 &&
      (now.getUTCHours() - startHourUtc >= durationHours ||
        now.getUTCHours() < startHourUtc ||
        !this.isPlanVisible(plan, now))
    ) {
      nextWindow.setUTCDate(nextWindow.getUTCDate() + 7);
    }

    return nextWindow;
  }

  private getCurrentWindowBounds(
    plan: IInvestmentPlan,
    referenceDate: Date = new Date()
  ): { windowStart: Date; windowEnd: Date } | null {
    if (plan.planType !== 'weekly' || !plan.visibility?.dayOfWeek) {
      return null;
    }

    const { dayOfWeek, startHourUtc = 0, durationHours = HOURS_IN_DAY } = plan.visibility;
    const now = referenceDate;
    const windowStart = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        startHourUtc,
        0,
        0,
        0
      )
    );

    const daysSinceWindow = (now.getUTCDay() - dayOfWeek + 7) % 7;
    windowStart.setUTCDate(windowStart.getUTCDate() - daysSinceWindow);

    // If the scheduled window hasn't started yet today, move back one week
    if (windowStart.getTime() > now.getTime()) {
      windowStart.setUTCDate(windowStart.getUTCDate() - 7);
    }

    const windowEnd = new Date(windowStart.getTime() + durationHours * MS_IN_HOUR);
    return { windowStart, windowEnd };
  }

  async getWeeklyPlanStatus(referenceDate: Date = new Date()): Promise<{
    plan: any;
    status: {
      timezone: string;
      isVisibleNow: boolean;
      canInvestNow: boolean;
      currentWindowStart: string | null;
      currentWindowEnd: string | null;
      nextWindowStart: string | null;
      nextWindowEnd: string | null;
      reminderStartsAt: string | null;
      reminderWindowHours: number;
      isReminderWindow: boolean;
      secondsUntilOpen: number | null;
      secondsUntilClose: number | null;
      durationHours: number;
    };
  }> {
    const plan = await InvestmentPlan.findOne({ planType: 'weekly', isActive: true }).sort({
      displayOrder: 1,
      minAmount: 1,
    });

    if (!plan) {
      throw new Error('Weekly Power Trade plan not configured');
    }

    const durationHours = plan.visibility?.durationHours ?? HOURS_IN_DAY;
    const windowBounds = this.getCurrentWindowBounds(plan, referenceDate);
    const windowStart = windowBounds?.windowStart ?? null;
    const windowEnd = windowBounds?.windowEnd ?? null;
    const nextWindowStart = windowStart ? new Date(windowStart.getTime() + MS_IN_DAY * 7) : null;
    const nextWindowEnd = nextWindowStart
      ? new Date(nextWindowStart.getTime() + durationHours * MS_IN_HOUR)
      : null;

    const isVisibleNow = this.isPlanVisible(plan, referenceDate);
    const reminderStartsAt = nextWindowStart
      ? new Date(nextWindowStart.getTime() - REMINDER_WINDOW_HOURS * MS_IN_HOUR)
      : null;
    const isReminderWindow =
      !isVisibleNow &&
      !!nextWindowStart &&
      !!reminderStartsAt &&
      referenceDate >= reminderStartsAt &&
      referenceDate < nextWindowStart;

    const secondsUntilOpen =
      !isVisibleNow && nextWindowStart
        ? Math.max(0, Math.floor((nextWindowStart.getTime() - referenceDate.getTime()) / 1000))
        : null;
    const secondsUntilClose =
      isVisibleNow && windowEnd
        ? Math.max(0, Math.floor((windowEnd.getTime() - referenceDate.getTime()) / 1000))
        : null;

    const planResponse = {
      ...this.transformPlanForResponse(plan, referenceDate),
      isVisibleNow,
      nextVisibleAt: nextWindowStart ? nextWindowStart.toISOString() : null,
    };

    const serializeDate = (date: Date | null) => (date ? date.toISOString() : null);

    return {
      plan: planResponse,
      status: {
        timezone: 'UTC',
        isVisibleNow,
        canInvestNow: isVisibleNow,
        currentWindowStart: serializeDate(windowStart),
        currentWindowEnd: serializeDate(windowEnd),
        nextWindowStart: serializeDate(nextWindowStart),
        nextWindowEnd: serializeDate(nextWindowEnd),
        reminderStartsAt: serializeDate(reminderStartsAt),
        reminderWindowHours: REMINDER_WINDOW_HOURS,
        isReminderWindow,
        secondsUntilOpen,
        secondsUntilClose,
        durationHours,
      },
    };
  }

  transformPlanForResponse(plan: IInvestmentPlan, referenceDate: Date = new Date()): any {
    const plain = plan.toObject();
    return {
      ...plain,
      id: plain._id?.toString() ?? plan.id,
      isVisibleNow: this.isPlanVisible(plan, referenceDate),
      nextVisibleAt: this.getNextVisibilityDate(plan, referenceDate),
    };
  }

  // Initialize default plans based on AiEarnBot specification
  async initializeDefaultPlans(): Promise<void> {
    const defaultPlans: Array<CreateInvestmentPlanDto & { planType: PlanType; payoutType: PlanPayoutType }> = [
      {
        name: 'Weekly Power Trade',
        description: '40% return in 72 hours. Opens once per week.',
        minAmount: 50,
        maxAmount: 100,
        dailyROI: 0,
        compoundingEnabled: false,
        planType: 'weekly',
        durationDays: 3,
        payoutType: 'lump_sum',
        payoutDelayHours: 72,
        lumpSumROI: 40,
        visibility: {
          dayOfWeek: 6, // Saturday
          startHourUtc: 0,
          durationHours: 24,
        },
        displayOrder: 0,
      },
      {
        name: 'Bot Slab One',
        description: '$1 - $499 | Daily ROI 7% for 20 days',
        minAmount: 1,
        maxAmount: 499,
        dailyROI: 7,
        compoundingEnabled: false,
        planType: 'bot',
        durationDays: 20,
        payoutType: 'daily',
        displayOrder: 10,
      },
      {
        name: 'Bot Slab Two',
        description: '$500 - $4,999 | Daily ROI 8% for 20 days',
        minAmount: 500,
        maxAmount: 4999,
        dailyROI: 8,
        compoundingEnabled: false,
        planType: 'bot',
        durationDays: 20,
        payoutType: 'daily',
        displayOrder: 20,
      },
      {
        name: 'Bot Slab Elite',
        description: '$5,000+ | Daily ROI 9% for 20 days',
        minAmount: 5000,
        dailyROI: 9,
        compoundingEnabled: false,
        planType: 'bot',
        durationDays: 20,
        payoutType: 'daily',
        displayOrder: 30,
      },
    ];

    for (const planData of defaultPlans) {
      const existing = await InvestmentPlan.findOne({
        name: planData.name,
      });

      if (!existing) {
        await InvestmentPlan.create(planData);
      }
    }
  }
}

export const investmentPlanService = new InvestmentPlanService();








