import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "src/modules/user/schema/user.schema";
import { ROLES_KEY } from "../decorators/role.decorator";

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass()
        ]);

        if (!requiredRoles || requiredRoles.length === 0) return true

        const request = context.switchToHttp().getRequest();
        const user = request.user

        if (!user) {
            throw new UnauthorizedException('User not authenticated');
        }

        const hasRole = requiredRoles.includes(user.role)

        if (!hasRole) {
            throw new UnauthorizedException('Unauthorized for access this resource');
        }
        return true
    }
}