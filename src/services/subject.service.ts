import { injectable } from "inversify";
import SubjectModel, { SubjectDocument } from "../models/subject.model";
import {
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
                        lastUpdatedAt: now,
                    },
                ],
                options
            )
        )[0];
    }

    async getAllSubjects(
        projection: ProjectionType<SubjectDocument> = {},
        options: QueryOptions<SubjectDocument> = {}
    ) {
        return await SubjectModel.find(
            {
                deletedAt: { $exists: false },
            },
            projection,
            options
        );
    }

    async getSubjectById(
        id: Types.ObjectId,
        projection: ProjectionType<SubjectDocument> = {},
        options: QueryOptions<SubjectDocument> = {}
    ) {
        return await SubjectModel.findOne(
            {
                _id: id,
                deletedAt: { $exists: false },
            },
            projection,
            options
        );
    }

    async markAsDeleted(
        id: Types.ObjectId,
        options: QueryOptions<SubjectDocument> = {}
    ) {
        return await SubjectModel.findOneAndUpdate(
            { _id: id },
            { deletedAt: Date.now() },
            { ...options, new: true }
        );
    }

    async editOneSubject(
        id: Types.ObjectId,
        update: UpdateQuery<SubjectDocument> = {},
        options: QueryOptions<SubjectDocument> = {}
    ) {
        return await SubjectModel.findOneAndUpdate(
            {
                _id: id,
                deletedAt: { $exists: false },
            },
            { ...update, lastUpdatedAt: Date.now() },
            { ...options, new: true }
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
