import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { RegisterUserDto, LoginUserDto } from './dto/user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schema/user-schema';
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

  async getMe(userId: string): Promise<Record<string, any>> { //Anotação explícita no retorno
    const getUser = await this.userModel.findById(userId).select('-password').exec();
    if (!getUser) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const profile = await this.userProfileModel.findOne({ user: userId }).exec();

    //1. Tipado com CharacterClass (Classe do Documento)
    const character = await this.characterModel
      .findOne({ user: userId })
      .populate<{ characterClass: CharacterClassSchema }>('characterClass')
      .exec();

    if (!character) {
      throw new NotFoundException('Personagem não encontrado');
    }

    //2. Converte o documento para objeto JS puro antes de manipular
    const charObj = character.toObject();

    let totalStats = { ...charObj.stats };

    //3. Leitura segura do bonus
    const populatedClass = charObj.characterClass as unknown as CharacterClassSchema | undefined;

    if (populatedClass?.statsBonus) {
      const bonus = populatedClass.statsBonus;
      totalStats = {
        strength: charObj.stats.strength + (bonus.strength || 0),
        intelligence: charObj.stats.intelligence + (bonus.intelligence || 0),
        vitality: charObj.stats.vitality + (bonus.vitality || 0),
        focus: charObj.stats.focus + (bonus.focus || 0),
      };
    }

    //4. Retorno limpo e corrigido sem erros de sintaxe ternária
    return {
      user: getUser,
      profile,
      character: {
        ...charObj,
        totalStats,
      },
    };
  }
}
