import { createZodDto } from "nestjs-zod";
import { z } from "zod"
import { UserRole } from "../schema/user-schema";
import { ApiProperty } from '@nestjs/swagger';

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

// Response DTOs
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

const LogoutResponseSchema = z.object({
    message: z.string()
});
export class LogoutResponseDto extends createZodDto(LogoutResponseSchema) { }

const UserProfileResponseSchema = z.object({
    _id: z.string().optional(),
    weightKg: z.number().nullable().optional(),
    heightCm: z.number().nullable().optional(),
    age: z.number().nullable().optional(),
    biologicalSex: z.string().nullable().optional(),
    activityLevel: z.string().nullable().optional(),
    primaryGoal: z.string().nullable().optional(),
    targetCalories: z.number().nullable().optional(),
    targetProteinGrams: z.number().nullable().optional(),
    targetCarbGrams: z.number().nullable().optional(),
    targetFatGrams: z.number().nullable().optional(),
    timezone: z.string().optional(),
});

const GetMeResponseSchema = z.object({
    user: z.object({
        _id: z.string(),
        email: z.string().email(),
        username: z.string(),
        role: z.nativeEnum(UserRole),
    }),
    profile: UserProfileResponseSchema.nullable().optional(),
    progress: z.object({
        level: z.number(),
        currentXp: z.number(),
        nextLevelXp: z.number(),
        currentStreak: z.number(),
        bestStreak: z.number(),
    }).nullable().optional(),
    coinBalance: z.number(),
});

export class GetMeResponseDto extends createZodDto(GetMeResponseSchema) { }

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