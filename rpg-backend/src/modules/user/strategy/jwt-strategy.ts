import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";
import { Request } from "express";

const coockieExtractor = (req: Request) => {
    return req.cookies.jwt
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                coockieExtractor,
                ExtractJwt.fromAuthHeaderAsBearerToken(),]),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || 'secret',

        })
    }
    async validate(payload: any) {
        return {
            id: payload.sub,
            email: payload.email,
            role: payload.role
        }
    }
}