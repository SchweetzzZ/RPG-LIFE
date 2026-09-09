import { Controller, Get, Post, Body, Patch, Param, Delete, Res, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';
import {
  RegisterUserDto,
  LoginUserDto,
  RegisterResponseDto,
  LoginResponseDto,
  LogoutResponseDto,
  GetMeResponseDto,
} from './dto/user.dto';
import express from 'express';
import { ApiTags, ApiResponse, ApiCreatedResponse, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ApiStandardErrors } from './api-standard-errors.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get('test')
  async test() {
    return "testando ai"
  }

  @Post('register')
  @ApiCreatedResponse({ type: RegisterResponseDto })
  @ApiStandardErrors()
  async register(@Body() body: RegisterUserDto) {
    return this.userService.register(body)
  }

  @Post('login')
  @ApiResponse({
    status: 200,
    type: LoginResponseDto
  })
  @ApiStandardErrors()
  async login(@Body() body: LoginUserDto, @Res({ passthrough: true }) res: express.Response) {
    const result = await this.userService.login(body)

    res.cookie('jwt', result.access_Token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    })
    return result
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({
    type: GetMeResponseDto,
    description: 'Retorna o perfil completo do usuário autenticado',
  })
  @ApiStandardErrors()
  async getMe(@CurrentUser('sub') userId: string) {
    return this.userService.getMe(userId);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: LogoutResponseDto,
    description: 'Realiza logout limpando o cookie HttpOnly',
  })
  @ApiStandardErrors()
  async logout(@Res({ passthrough: true }) res: express.Response) {
    res.clearCookie('jwt', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    return { message: 'Logout realizado com sucesso' };
  }
}
