import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, SetMetadata, } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import Redis from 'ioredis';


export type RateLimitContext = 'public' | 'auth' | 'critical';

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
  context: RateLimitContext;
}

export const RATE_LIMIT_KEY = 'RATE_LIMIT_CONFIG';


export const RateLimitPublic = (limit = 5, windowMs = 60_000) =>
  SetMetadata(RATE_LIMIT_KEY, { limit, windowMs, context: 'public' });

export const RateLimitAuth = (limit = 60, windowMs = 60_000) =>
  SetMetadata(RATE_LIMIT_KEY, { limit, windowMs, context: 'auth' });

export const RateLimitCritical = (limit = 5, windowMs = 60_000) =>
  SetMetadata(RATE_LIMIT_KEY, { limit, windowMs, context: 'critical' });

@Injectable()
export class RateLimitGuard implements CanActivate {

  private readonly redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    lazyConnect: true,
  });

  constructor(private readonly reflector: Reflector) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const config = this.reflector.get<RateLimitConfig>(RATE_LIMIT_KEY, context.getHandler());
    if (!config) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const now = Date.now();

    // 3. RESOLUÇÃO DINÂMICA DO IDENTIFICADOR
    // - Público: IP (mitiga força bruta no login/register)
    // - Autenticado / Crítico: userId (evita punir redes inteiras em CGNAT/Wi-Fi compartilhado)
    const user = (req as any).user;
    const identifier = config.context === 'public' || !user?.sub
      ? `ip:${req.ip || req.headers['x-forwarded-for'] || 'unknown'}`
      : `user:${user.sub}`;

    const key = `rl:${config.context}:${identifier}:${req.method}:${req.path}`;

    // 1. SLIDING WINDOW (Avaliação contínua de tempo via Redis ZSET, sem picos artificiais)
    const clearBefore = now - config.windowMs;
    const multi = this.redis.multi();
    multi.zremrangebyscore(key, 0, clearBefore); // Remove requisições fora da janela
    multi.zcard(key);                            // Conta requisições na janela ativa
    multi.zadd(key, now, `${now}:${Math.random()}`); // Registra a requisição atual
    multi.pexpire(key, config.windowMs);         // Expira automaticamente a chave

    const results = await multi.exec();
    const currentHits = (results?.[1]?.[1] as number) || 0;

    if (currentHits >= config.limit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Taxa limite de requisições excedida para este ${config.context === 'public' ? 'IP' : 'usuário'}.`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
