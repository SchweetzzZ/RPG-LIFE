import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { RegisterUserDto, LoginUserDto } from './dto/user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schema/user-schema';
import bcrypt from "bcrypt"
import { JwtService } from '@nestjs/jwt';
import { Character, characterDocument } from '../character/schema/character-schema';
import { UserProfile, UserProfileDocument } from '../profile/schema/profile.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Character.name) private characterModel: Model<characterDocument>,
    @InjectModel(UserProfile.name) private userProfileModel: Model<UserProfileDocument>,
    private jwtService: JwtService) { }

  async validate(data: LoginUserDto) {
    const validate = await this.userModel.findOne({ email: data.email })
    if (!validate) {
      throw new NotFoundException('User not found');
    }
    const isValidat = await bcrypt.compare(data.password, validate.password)
    if (!isValidat) {
      throw new NotFoundException('Invalid password');
    }
    return validate;
  }

  async register(data: RegisterUserDto) {
    const verify = await this.userModel.findOne({ email: data.email })
    if (verify) {
      throw new ConflictException("user already exists");
    }

    const hash = await bcrypt.hash(data.password, 10)
    const createUser = await this.userModel.create({
      ...data,
      password: hash,
    })

    await this.characterModel.create({
      user: createUser._id,
      nickname: data.username,
    })

    await this.userProfileModel.create({
      user: createUser._id,
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
