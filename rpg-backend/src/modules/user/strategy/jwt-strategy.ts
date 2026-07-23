import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";
import { Request } from "express";

const cookieExtractor = (req: Request) => {
    return req?.cookies?.jwt || req?.cookies?.access_Token || null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                cookieExtractor,
                ExtractJwt.fromAuthHeaderAsBearerToken(),
            ]),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || 'secret',
        })
    }

    async validate(payload: any) {
        return {
            sub: payload.sub,
            id: payload.sub,
            email: payload.email,
            role: payload.role,
        }
    }
}