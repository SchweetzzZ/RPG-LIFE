import { createZodDto } from "nestjs-zod";
import { z } from "zod"
import { UserRole } from "../schema/user-schema";

const RegisterUserSchema = z.object({
    email: z.email(),
    username: z.string(),
    password: z.string(),
    role: z.nativeEnum(UserRole)
})

const LoginUserSchema = z.object({
    email: z.email(),
    password: z.string(),
})

export class RegisterUserDto extends createZodDto(RegisterUserSchema) { }
export class LoginUserDto extends createZodDto(LoginUserSchema) { }

//response
const LoginResponseSchema = z.object({
    access_Token: z.string()
});

const RegisterResponseSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    username: z.string(),
    role: z.nativeEnum(UserRole)
});

export class LoginResponseDto extends createZodDto(LoginResponseSchema) { }
export class RegisterResponseDto extends createZodDto(RegisterResponseSchema) { }

import { ApiProperty } from '@nestjs/swagger';

// Seus outros DTOs...

export class ErrorResponseDto {
    @ApiProperty({ example: 400 })
    statusCode: number;

    @ApiProperty({
        oneOf: [
            { type: 'string', example: 'E-mail ou senha inválidos' },
            { type: 'array', items: { type: 'string' }, example: ['email deve ser um e-mail válido'] }
        ]
    })
    message: string | string[];

    @ApiProperty({ example: 'Bad Request' })
    error?: string;
}