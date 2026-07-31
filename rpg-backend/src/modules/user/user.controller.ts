import { Controller, Get, Post, Body, Patch, Param, Delete, Res } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterUserDto, LoginUserDto, RegisterResponseDto, LoginResponseDto } from './dto/user.dto';
import express from 'express';
import { ApiTags, ApiResponse, ApiCreatedResponse, ApiOkResponse, ApiBadRequestResponse, ApiConflictResponse } from '@nestjs/swagger';
import { ApiStandardErrors } from './api-standard-errors.decorator';

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
}
