import { IUser } from '../models/user.model';
import { User } from '../models/user.model';
import { CreateUserDto, UpdateUserDto } from '../types/user.types';

export class UserService {
  async createUser(data: CreateUserDto): Promise<IUser> {
    const user = new User(data);
    return await user.save();
  }

  async getAllUsers(): Promise<IUser[]> {
    return await User.find().select('-password');
  }

  async getUserById(id: string): Promise<IUser | null> {
    return await User.findById(id).select('-password');
  }

  async getUserByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email }).select('+password');
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<IUser | null> {
    return await User.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).select('-password');
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await User.findByIdAndDelete(id);
    return !!result;
  }
}

export const userService = new UserService();








