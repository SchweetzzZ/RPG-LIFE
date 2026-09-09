import type { components } from "../api/schema"

//entrada
export type LoginInput = components['schemas']['LoginUserDto']
export type RegisterInput = components['schemas']['RegisterUserDto']
//resposta
export type LoginResponse = components['schemas']['LoginResponseDto']
export type RegisterResponse = components['schemas']['RegisterResponseDto']
export type LogoutResponse = components['schemas']['LogoutResponseDto']

