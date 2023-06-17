import { inject, injectable } from "inversify";
import { logger } from "../lib/logger";
import { UserRole } from "../models/user.model";
import PermissionModel, { Permission } from "../models/permission.model";
import { ServiceType } from "../types";
import { CacheService } from "../services/index";

@injectable()
export class PermissionService {
    PERMISSION_CACHE_TIME: number = 60 * 30; // 30 minutes

    constructor(@inject(ServiceType.Cache) private cacheService: CacheService) {
        logger.info("Constructing Permission service");
    }

    public async roleCanPerformAction(
        role: UserRole,
        action: Permission
    ): Promise<boolean> {
        if (role === UserRole.ADMIN) {
            return true;
        }
        const permissions = JSON.parse(
            await this.cacheService.getWithPopulate(
                `permission ${role}`,
                async () => {
                    let d = await PermissionModel.findOne({
                        role: role,
                    });
                    if (!d) {
                        d = await PermissionModel.create({
                            role: role,
                            permissions: [],
                        });
                    }
                    return JSON.stringify(d.permissions);
                }
            )
        ) as Permission[];
        return permissions.includes(action);
    }

    public async rolesCanPerformAction(
        roles: UserRole[],
        action: Permission
    ): Promise<boolean> {
        const a = await Promise.all(
            roles.map((r) =>
                (async () => await this.roleCanPerformAction(r, action))()
            )
        );
        return a.some((x) => x === true);
    }

    /**
     * Given a user's roles, and a list of permitted roles for an action,
     * return true if either the user is an admin or the two lists overlap,
     * and false otherwise.
     */
    public rolesOverlapWithAllowedList(
        roles: UserRole[],
        permitted: UserRole[]
    ) {
        if (roles.includes(UserRole.ADMIN)) {
            return true;
        }
        return roles.some((r) => permitted.find((p) => r === p));
    }
}
