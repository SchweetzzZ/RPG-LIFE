import { Controller, Get, Post, Body, Patch, Param, Delete, Res } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterUserDto, LoginUserDto } from './dto/user.dto';
import express from 'express';


@Controller('player')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post('register')
  async register(@Body() body: RegisterUserDto) {
    return this.userService.register(body)
  }

  @Post('login')
  async login(@Body() body: LoginUserDto, @Res({ passthrough: true }) res: express.Response) {
    const result = await this.userService.login(body)

    res.cookie('jwt', result.access_Token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    })
    return result
  }
}
