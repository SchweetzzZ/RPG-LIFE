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