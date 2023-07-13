import { injectable } from "inversify";
import SubjectModel, { SubjectDocument } from "../models/subject.model";
import {
    FilterQuery,
    ProjectionType,
    QueryOptions,
    SaveOptions,
    Types,
    UpdateQuery,
} from "mongoose";
import { logger } from "../lib/logger";

@injectable()
export class SubjectService {
    constructor() {
        logger.info("[Subject] Initializing...");
    }

    async create(
        name: string,
        userId: Types.ObjectId,
        description: string,
        options: SaveOptions = {}
    ) {
        const now = Date.now();
        return (
            await SubjectModel.create(
                [
                    {
                        name: name,
                        description: description,
                        createdAt: now,
                        createdBy: userId,
                    },
                ],
                options
            )
        )[0];
    }

    async findById(
        id: Types.ObjectId,
        projection: ProjectionType<SubjectDocument> = {},
        options: QueryOptions<SubjectDocument> = {}
    ) {
        return await SubjectModel.findById(id, projection, options);
    }

    async findOne(
        query: FilterQuery<SubjectDocument>,
        projection: ProjectionType<SubjectDocument> = {},
        options: QueryOptions<SubjectDocument> = {}
    ) {
        return await SubjectModel.findOne(query, projection, options);
    }

    async findOneAndUpdate(
        query: FilterQuery<SubjectDocument>,
        upd: UpdateQuery<SubjectDocument>,
        opt: QueryOptions<SubjectDocument> = {}
    ) {
        return await SubjectModel.findOneAndUpdate(query, upd, opt);
    }

    async find(
        query: FilterQuery<SubjectDocument>,
        projection: ProjectionType<SubjectDocument> = {},
        options: QueryOptions<SubjectDocument> = {}
    ) {
        return await SubjectModel.find(query, projection, options);
    }

    async markAsDeleted(id: Types.ObjectId) {
        return await SubjectModel.findOneAndUpdate(
            { _id: id },
            { deletedAt: Date.now() },
            { new: true }
        );
    }

    async subjectExists(id: Types.ObjectId) {
        return (
            (await SubjectModel.findOne({
                _id: id,
                deletedAt: { $exists: false },
            })) != null
        );
    }
}
