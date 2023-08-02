import { inject, injectable } from "inversify";
import { logger } from "../lib/logger";
import AccessLevelModel, {
    AccessLevelDocument,
    Permission,
} from "../models/access_level.model";
import { ServiceType } from "../types";
import { CacheService } from "./index";
import {
    FilterQuery,
    ProjectionType,
    QueryOptions,
    Types,
    UpdateQuery,
} from "mongoose";
import { TokenDocument } from "../models/token.model";
import _ from "lodash";

@injectable()
export class AccessLevelService {
    ACCESS_LEVEL_CACHE_TIME: number = 60 * 15; // 15 minutes
    private VISITOR_ID: Types.ObjectId;
    private STUDENT_ID: Types.ObjectId;

    constructor(@inject(ServiceType.Cache) private cacheService: CacheService) {
        logger.info("[AccessLevel] Initializing Access Level service");
        this.createPredefinedAccessLevels();
    }

    private async createPredefinedAccessLevels() {
        try {
            let visitor = await AccessLevelModel.findOne({
                predefinedId: "visitor",
            });
            if (!visitor) {
                visitor = (
                    await AccessLevelModel.create([
                        {
                            name: "Visitor",
                            predefinedId: "visitor",
                            description:
                                "This access level is used automatically when a user is not logged in",
                            permissions: [],
                            createdAt: Date.now(),
                        },
                    ])
                )[0];
            }
            let student = await AccessLevelModel.findOne({
                predefinedId: "student",
            });
            if (!student) {
                student = (
                    await AccessLevelModel.create([
                        {
                            name: "Student",
                            predefinedId: "student",
                            description:
                                "This access level is automatically granted for users who just logged in, can be assigned",
                            permissions: [
                                Permission.VIEW_MATERIAL,
                                Permission.VIEW_PREVIOUS_EXAM,
                            ],
                            createdAt: Date.now(),
                        },
                    ])
                )[0];
            }
            this.VISITOR_ID = visitor._id;
            this.STUDENT_ID = student._id;
            logger.info("[AccessLevel] Created predefined access levels");
        } catch (error) {
            logger.error(error.message);
            console.log(error);
        }
    }

    public async create(
        userId: Types.ObjectId,
        name: string,
        description: string,
        permissions: Permission[]
    ) {
        const now = Date.now();
        return (
            await AccessLevelModel.create([
                {
                    name: name,
                    description: description,
                    permissions: permissions,
                    createdAt: now,
                    createdBy: userId,
                    lastUpdatedAt: now,
                },
            ])
        )[0];
    }

    private async accessLevelCanPerformAction(
        accessLevel: Types.ObjectId,
        action: Permission,
        isManager = false
    ) {
        if (isManager) {
            return true;
        }
        const permissions = JSON.parse(
            await this.cacheService.getWithPopulate(
                `access_level ${accessLevel.toString()}`,
                async () => {
                    const d = await AccessLevelModel.findOne({
                        _id: accessLevel,
                        deletedAt: { $exists: false },
                    });
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

    private async accessLevelsCanPerformAction(
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
        return _.some(a);
    }

    permissionChecker(token: TokenDocument) {
        return async (action: Permission) => {
            return await this.accessLevelsCanPerformAction(
                token?.accessLevels,
                action,
                token?.isManager
            );
        };
    }

    public async checkAccessLevelsExist(levels: Types.ObjectId[]) {
        const result = await Promise.all(
            levels.map((level) =>
                (async () =>
                    (await AccessLevelModel.findOne({
                        _id: level,
                        deletedAt: { $exists: false },
                    })) != null)()
            )
        );
        return _.every(result);
    }

    public async checkCanAssignAccessLevels(levels: Types.ObjectId[]) {
        // check that all given id's exist and they can be assigned
        // a role can be assigned if it's either not predefined, or
        // 'student'
        const result = await Promise.all(
            levels.map((l) =>
                (async () =>
                    await AccessLevelModel.findOne({
                        _id: l,
                        deletedAt: { $exists: false },
                    }))()
            )
        );
        return result.every((level) => {
            if (level == undefined) {
                return false;
            }
            if (
                level.predefinedId !== undefined &&
                level.predefinedId === "visitor"
            ) {
                return false;
            }
            return true;
        });
    }

    public async invalidateCache(accessLevelId: Types.ObjectId) {
        return await this.cacheService.del(
            `access_level ${accessLevelId.toString()}`
        );
    }

    getStudentAccessLevelId() {
        return this.STUDENT_ID;
    }

    async editOneAccessLevel(
        id: Types.ObjectId,
        update: UpdateQuery<AccessLevelDocument> = {},
        options: QueryOptions<AccessLevelDocument> = {}
    ) {
        return await AccessLevelModel.findOneAndUpdate(
            { _id: id, deletedAt: { $exists: false } },
            { ...update, lastupdatedAt: Date.now() },
            { ...options, new: true }
        );
    }

    async getAccessLevelById(
        id: Types.ObjectId,
        options: QueryOptions<AccessLevelDocument> = {}
    ) {
        return await AccessLevelModel.findOne(
            { _id: id, deletedAt: { $exists: false } },
            {},
            options
        );
    }

    async markAsDeleted(
        id: Types.ObjectId,
        options: QueryOptions<AccessLevelDocument> = {}
    ) {
        return await AccessLevelModel.findOneAndUpdate(
            { _id: id },
            { deletedAt: Date.now() },
            { ...options, new: true }
        );
    }

    async getPaginated(
        query: FilterQuery<AccessLevelDocument>,
        projection: ProjectionType<AccessLevelDocument>,
        paths: string[],
        pageSize: number,
        pageNumber: number
    ) {
        return await Promise.all([
            AccessLevelModel.count({
                ...query,
                deletedAt: { $exists: false },
            }),
            AccessLevelModel.find(
                {
                    ...query,
                    deletedAt: { $exists: false },
                },
                projection
            )
                .skip(Math.max(pageSize * (pageNumber - 1), 0))
                .limit(pageSize)
                .populate(paths),
        ]);
    }

    async getPopulated(
        query: FilterQuery<AccessLevelDocument>,
        projection: ProjectionType<AccessLevelDocument>,
        paths: string[]
    ) {
        return await AccessLevelModel.find(
            {
                ...query,
                deletedAt: { $exists: false },
            },
            projection
        ).populate(paths);
    }

    async getByIdPopulated(
        id: Types.ObjectId,
        projection: ProjectionType<AccessLevelDocument>,
        paths: string[]
    ) {
        return await AccessLevelModel.findOne(
            {
                _id: id,
                deletedAt: { $exists: false },
            },
            projection
        ).populate(paths);
    }
}
