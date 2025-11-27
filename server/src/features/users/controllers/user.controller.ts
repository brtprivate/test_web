import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { CreateUserDto, UpdateUserDto } from '../types/user.types';
import { AuthRequest } from '../../../middleware/auth.middleware';

export class UserController {
  async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userData: CreateUserDto = req.body;
      const user = await userService.createUser(userData);
      
      res.status(201).json({
        status: 'success',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getAllUsers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await userService.getAllUsers();
      
      res.status(200).json({
        status: 'success',
        results: users.length,
        data: {
          users,
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      
      if (!user) {
        res.status(404).json({
          status: 'error',
          message: 'User not found',
        });
        return;
      }
      
      res.status(200).json({
        status: 'success',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateUserDto = req.body;
      
      const user = await userService.updateUser(id, updateData);
      
      if (!user) {
        res.status(404).json({
          status: 'error',
          message: 'User not found',
        });
        return;
      }
      
      res.status(200).json({
        status: 'success',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await userService.deleteUser(id);
      
      if (!deleted) {
        res.status(404).json({
          status: 'error',
          message: 'User not found',
        });
        return;
      }
      
      res.status(204).send();
    } catch (error: any) {
      next(error);
    }
  }

  async getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      
      if (!user) {
        res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
        return;
      }
      
      res.status(200).json({
        status: 'success',
        data: {
          user: {
            id: user._id,
            name: user.name,
            telegramChatId: user.telegramChatId,
            telegramUsername: user.telegramUsername,
            telegramFirstName: user.telegramFirstName,
            telegramLastName: user.telegramLastName,
            referralCode: user.referralCode,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      
      if (!user) {
        res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
        return;
      }

      const updateData: UpdateUserDto = req.body;
      const updatedUser = await userService.updateUser(String(user._id), updateData);
      
      if (!updatedUser) {
        res.status(404).json({
          status: 'error',
          message: 'User not found',
        });
        return;
      }
      
      res.status(200).json({
        status: 'success',
        data: {
          user: {
            id: updatedUser._id,
            name: updatedUser.name,
            telegramChatId: updatedUser.telegramChatId,
            telegramUsername: updatedUser.telegramUsername,
            telegramFirstName: updatedUser.telegramFirstName,
            telegramLastName: updatedUser.telegramLastName,
            referralCode: updatedUser.referralCode,
            isActive: updatedUser.isActive,
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt,
          },
        },
      });
    } catch (error: any) {
      next(error);
    }
  }
}

export const userController = new UserController();

