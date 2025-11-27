import { Request, Response, NextFunction } from 'express';
import { investmentPlanService } from '../services/investment-plan.service';
import { CreateInvestmentPlanDto, UpdateInvestmentPlanDto } from '../types/investment-plan.types';
import { PlanType } from '../models/investment-plan.model';

export class InvestmentPlanController {
  async createPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const planData: CreateInvestmentPlanDto = req.body;
      const plan = await investmentPlanService.createPlan(planData);
      
      res.status(201).json({
        status: 'success',
        data: { plan },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getAllPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const activeOnly = req.query.active === 'true';
      const planType = (req.query.planType as PlanType) || undefined;
      const audience = (req.query.audience as string) || 'public';
      const includeHiddenWeekly = req.query.includeHiddenWeekly === 'true' || audience === 'admin';

      const plans = await investmentPlanService.getAllPlans(activeOnly, planType);
      const referenceDate = new Date();
      const enrichedPlans = plans
        .map(plan => investmentPlanService.transformPlanForResponse(plan, referenceDate))
        .filter(plan => {
          if (includeHiddenWeekly) return true;
          if (plan.planType === 'weekly') {
            return plan.isVisibleNow;
          }
          return true;
        });
      
      res.status(200).json({
        status: 'success',
        results: enrichedPlans.length,
        data: { plans: enrichedPlans },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getPlanById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const plan = await investmentPlanService.getPlanById(id);
      
      if (!plan) {
        res.status(404).json({
          status: 'error',
          message: 'Investment plan not found',
        });
        return;
      }
      
      const responsePlan = investmentPlanService.transformPlanForResponse(plan);
      res.status(200).json({
        status: 'success',
        data: { plan: responsePlan },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getPlanByAmount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const amount = parseFloat(req.query.amount as string);
      const audience = (req.query.audience as string) || 'public';
      const includeHiddenWeekly = req.query.includeHiddenWeekly === 'true' || audience === 'admin';
      const planTypeParam = (req.query.planType as PlanType) || (audience === 'admin' ? undefined : 'bot');
      
      if (isNaN(amount) || amount < 0) {
        res.status(400).json({
          status: 'error',
          message: 'Valid amount is required',
        });
        return;
      }
      const plan = await investmentPlanService.getPlanByAmount(amount, { planType: planTypeParam });
      
      if (!plan) {
        res.status(404).json({
          status: 'error',
          message: 'No investment plan found for this amount',
        });
        return;
      }
      const transformed = investmentPlanService.transformPlanForResponse(plan);
      if (transformed.planType === 'weekly' && !includeHiddenWeekly && !transformed.isVisibleNow) {
        res.status(403).json({
          status: 'error',
          message: 'Weekly power trade plan is not open right now',
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        data: { plan: transformed },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getWeeklyPlanStatus(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await investmentPlanService.getWeeklyPlanStatus();
      res.status(200).json({
        status: 'success',
        data,
      });
    } catch (error: any) {
      if (error?.message === 'Weekly Power Trade plan not configured') {
        res.status(404).json({
          status: 'error',
          message: error.message,
        });
        return;
      }
      next(error);
    }
  }

  async updatePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateInvestmentPlanDto = req.body;
      
      const plan = await investmentPlanService.updatePlan(id, updateData);
      
      if (!plan) {
        res.status(404).json({
          status: 'error',
          message: 'Investment plan not found',
        });
        return;
      }
      
      res.status(200).json({
        status: 'success',
        data: { plan },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async deletePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await investmentPlanService.deletePlan(id);
      
      if (!deleted) {
        res.status(404).json({
          status: 'error',
          message: 'Investment plan not found',
        });
        return;
      }
      
      res.status(204).send();
    } catch (error: any) {
      next(error);
    }
  }

  async initializePlans(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await investmentPlanService.initializeDefaultPlans();
      
      res.status(200).json({
        status: 'success',
        message: 'Default investment plans initialized',
      });
    } catch (error: any) {
      next(error);
    }
  }
}

export const investmentPlanController = new InvestmentPlanController();

