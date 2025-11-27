import { Request, Response, NextFunction } from 'express';
import { settingService } from '../services/setting.service';
import { CreateSettingDto, UpdateSettingDto } from '../types/setting.types';

export class SettingController {
  async createSetting(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settingData: CreateSettingDto = req.body;
      const setting = await settingService.createSetting(settingData);

      res.status(201).json({
        status: 'success',
        data: { setting },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getSetting(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { key } = req.params;
      const setting = await settingService.getSetting(key);

      if (!setting) {
        res.status(404).json({
          status: 'error',
          message: 'Setting not found',
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        data: { setting },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async updateSetting(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { key } = req.params;
      const updateData: UpdateSettingDto = req.body;

      const setting = await settingService.updateSetting(key, updateData);

      if (!setting) {
        res.status(404).json({
          status: 'error',
          message: 'Setting not found',
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        data: { setting },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getSettingsByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category } = req.params;
      const settings = await settingService.getSettingsByCategory(category);

      res.status(200).json({
        status: 'success',
        results: settings.length,
        data: { settings },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getAllSettings(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await settingService.getAllSettings();

      res.status(200).json({
        status: 'success',
        results: settings.length,
        data: { settings },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async initializeSettings(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await settingService.initializeDefaultSettings();

      res.status(200).json({
        status: 'success',
        message: 'Default settings initialized',
      });
    } catch (error: any) {
      next(error);
    }
  }
}

export const settingController = new SettingController();

