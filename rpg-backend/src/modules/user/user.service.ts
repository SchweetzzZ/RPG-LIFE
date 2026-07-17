import { Injectable } from '@nestjs/common';
import { RegisterUserDto, LoginUserDto } from './dto/user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schema/user.schema';
import bcrypt from "bcrypt"
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService) { }

  async validate(data: LoginUserDto) {
    const validate = await this.userModel.findOne({ email: data.email })
    if (!validate) {
      throw new Error('User not found');
    }
    const isValidat = await bcrypt.compare(data.password, validate.password)
    if (!isValidat) {
      throw new Error('Invalid password');
    }
    return validate;
  }

  async register(data: RegisterUserDto) {
    const verify = await this.userModel.findOne({ email: data.email })
    if (verify) {
      throw new Error('User already exists');
    }

    const hash = await bcrypt.hash(data.password, 10)
    const createUser = await this.userModel.create({
      ...data,
      password: hash,
    })
    return createUser
  }

  async login(data: LoginUserDto) {
    const user = await this.validate(data)

    const payload = {
      email: data.email,
      sub: user.id,
      role: user.role,
    }
    return {
      access_Token: this.jwtService.sign(payload)
    }
  }

}
