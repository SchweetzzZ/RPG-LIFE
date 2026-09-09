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
    coins: z.number().default(0),
    vaultBalance: z.number().default(0),
    targetCalories: z.number().nullable().optional(),
    targetProteinGrams: z.number().nullable().optional(),
    targetCarbGrams: z.number().nullable().optional(),
    targetFatGrams: z.number().nullable().optional(),
    stressLevel: z.number().optional(),
    trainsRegularly: z.boolean().optional(),
    livesInHotClimate: z.boolean().optional(),
});

const GetMeResponseSchema = z.object({
    user: z.object({
        _id: z.string(),
        email: z.string().email(),
        username: z.string(),
        role: z.nativeEnum(UserRole),
    }),
    profile: UserProfileResponseSchema.nullable().optional(),
    character: z.object({
        _id: z.string(),
        nickname: z.string(),
        level: z.number(),
        currentXp: z.number(),
        nextLevelXp: z.number(),
        coins: z.number(),
        gems: z.number(),
        hp: z.number(),
        maxHp: z.number(),
        vaultBalance: z.number(),
        stats: z.record(z.string(), z.number()).optional(),
        totalStats: z.record(z.string(), z.number()).optional(),
        equippedSkin: z.string().optional(),
    }).nullable().optional(),
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