import { inject, injectable } from "inversify";
import { logger } from "../lib/logger";
import AccessLevelModel, {
    AccessLevelDocument,
    Permission,
} from "../models/access_level.model";
import { ServiceType } from "../types";
import { CacheService } from "./index";
import mongoose, {
    FilterQuery,
    QueryOptions,
    Types,
    UpdateQuery,
} from "mongoose";

@injectable()
export class AccessLevelService {
    ACCESS_LEVEL_CACHE_TIME: number = 60 * 30; // 30 minutes
    private VISITOR_ID: Types.ObjectId;

    constructor(@inject(ServiceType.Cache) private cacheService: CacheService) {
        logger.info("Constructing Permission service");
        this.createPredefinedAccessLevels();
    }

    private async createPredefinedAccessLevels() {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            let visitor = await AccessLevelModel.findOne({
                predefinedId: "visitor",
            });
            if (!visitor) {
                visitor = await AccessLevelModel.create({
                    name: "Visitor",
                    predefinedId: "visitor",
                    description:
                        "This access level is used automatically when a user is not logged in",
                    permissions: [],
                    createdAt: Date.now(),
                });
            }
            this.VISITOR_ID = visitor._id;
            logger.info("[AccessLevel] Created predefined access levels");
            await session.commitTransaction();
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            await session.abortTransaction();
        } finally {
            await session.endSession();
        }
    }

    public async create(
        userId: Types.ObjectId,
        name: string,
        description: string,
        permissions: Permission[]
    ) {
        return await AccessLevelModel.create({
            name: name,
            description: description,
            permissions: permissions,
            createdAt: Date.now(),
            createdBy: userId,
        });
    }

    private async accessLevelCanPerformAction(
        accessLevel: Types.ObjectId,
        action: Permission,
        isManager = false
    ): Promise<boolean> {
        if (isManager) {
            return true;
        }
        const permissions = JSON.parse(
            await this.cacheService.getWithPopulate(
                `access_level ${accessLevel.toString()}`,
                async () => {
                    const d = await AccessLevelModel.findById(accessLevel);
                    if (!d) {
                        return "[]";
                    }
                    return JSON.stringify(d.permissions);
                },
                {
                    EX: this.ACCESS_LEVEL_CACHE_TIME,
                }
            )
        ) as Permission[];
        return permissions.includes(action);
    }

    public async accessLevelsCanPerformAction(
        accessLevels: Types.ObjectId[],
        action: Permission,
        isManager = false
    ): Promise<boolean> {
        if (isManager) {
            return true;
        }
        if (!accessLevels) {
            // use "visitor" access level
            accessLevels = [this.VISITOR_ID];
        }
        const a = await Promise.all(
            accessLevels.map((l) =>
                (async () =>
                    await this.accessLevelCanPerformAction(
                        l,
                        action,
                        isManager
                    ))()
            )
        );
        return a.some((x) => x === true);
    }

    /**
     * Given a user's access level, and a list of permitted access levels for an action,
     * return true if either the user is an admin or the two lists overlap,
     * and false otherwise.
     */
    public accessLevelsOverlapWithAllowedList(
        accessLevels: Types.ObjectId[],
        permitted: Types.ObjectId[],
        isManager = false
    ) {
        if (isManager) {
            return true;
        }
        if (!accessLevels) {
            accessLevels = [this.VISITOR_ID];
        }
        return accessLevels.some((l) => permitted.some((p) => p.equals(l)));
    }

    public async accessLevelsExist(levels: Types.ObjectId[]) {
        const result = await Promise.all(
            levels.map((level) =>
                (async () => (await AccessLevelModel.findById(level)) != null)()
            )
        );
        return result.every((x) => x);
    }

    public async verifyAssignAccessLevel(levels: Types.ObjectId[]) {
        // check that all given id's exist and they are not predefined levels
        const result = await Promise.all(
            levels.map((l) =>
                (async () => await AccessLevelModel.findById(l))()
            )
        );
        return result.every(
            (x) => x != undefined && x.predefinedId == undefined
        );
    }

    public async findAccessLevels(query: FilterQuery<AccessLevelDocument>) {
        return await AccessLevelModel.find(query);
    }

    public async findOneAndDelete(
        query: FilterQuery<AccessLevelDocument>,
        options: QueryOptions<AccessLevelDocument> = {}
    ) {
        return await AccessLevelModel.findOneAndDelete(query, options);
    }

    public async findOneAndUpdate(
        query: FilterQuery<AccessLevelDocument>,
        update: UpdateQuery<AccessLevelDocument>,
        options: QueryOptions<AccessLevelDocument> = {}
    ) {
        return await AccessLevelModel.findOneAndUpdate(query, update, options);
    }

    public async findOne(query: FilterQuery<AccessLevelDocument>) {
        return await AccessLevelModel.findOne(query);
    }

    public async findById(id: Types.ObjectId) {
        return await AccessLevelModel.findById(id);
    }

    public async invalidateCache(key: string) {
        await this.cacheService.del(key);
    }
}
