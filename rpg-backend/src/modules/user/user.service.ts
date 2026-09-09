import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { RegisterUserDto, LoginUserDto } from './dto/user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from './schema/user-schema';
import bcrypt from "bcrypt"
import { JwtService } from '@nestjs/jwt';
import { Character, characterDocument } from '../character/schema/character-schema';
import { UserProfile, UserProfileDocument } from '../profile/schema/profile.schema';
import { CharacterClassSchema } from '../character-classes/schema/character-class-schema';

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
      email: data.email,
      username: data.username,
      password: hash,
      role: UserRole.PLAYER,
    })

    await this.characterModel.create({
      user: createUser._id,
      nickname: data.username,
    })

    await this.userProfileModel.create({
      user: createUser._id,
    })

    return {
      id: createUser._id.toString(),
      email: createUser.email,
      username: createUser.username,
      role: createUser.role,
    }
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

  async getMe(userId: string): Promise<Record<string, any>> { //Anotação explícita no retorno
    const getUser = await this.userModel.findById(userId).select('-password').exec();
    if (!getUser) {
      throw new NotFoundException('Usuário não encontrado');
    }

    let profile = await this.userProfileModel.findOne({ user: userId }).exec();
    if (!profile) {
      profile = await this.userProfileModel.create({ user: userId });
    }

    const character = await this.characterModel
      .findOne({ user: userId })
      .exec();

    // Migração/Sincronia transparente de moedas caso ainda estivessem no character
    if (character && ((character.coins || 0) > (profile.coins || 0) || (character.vaultBalance || 0) > (profile.vaultBalance || 0))) {
      profile.coins = Math.max(profile.coins || 0, character.coins || 0);
      profile.vaultBalance = Math.max(profile.vaultBalance || 0, character.vaultBalance || 0);
      await profile.save();
    }

    const charObj = character ? character.toObject() : null;

    return {
      user: getUser,
      profile: profile.toObject(),
      character: charObj ? {
        ...charObj,
        totalStats: charObj.stats || {},
      } : null,
    };
  }
}
