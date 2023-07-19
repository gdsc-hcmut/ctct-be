import { injectable } from "inversify";
import { logger } from "../lib/logger";
import {
    ProjectionType,
    QueryOptions,
    TypeExpressionOperatorReturningBoolean,
    Types,
    UpdateQuery,
} from "mongoose";
import ChapterModel, { ChapterDocument } from "../models/chapter.model";

@injectable()
export class ChapterService {
    constructor() {
        logger.info("[Chapter] Initializing...");
    }

    async create(
        name: string,
        subject: Types.ObjectId,
        userId: Types.ObjectId
    ) {
        const now = Date.now();
        return await ChapterModel.create({
            name: name,
            subject: subject,
            createdBy: userId,
            createdAt: now,
            lastUpdatedAt: now,
        });
    }

    async editOneChapter(
        id: Types.ObjectId,
        update: UpdateQuery<ChapterDocument> = {},
        options: QueryOptions<ChapterDocument> = {}
    ) {
        return await ChapterModel.findOneAndUpdate(
            {
                _id: id,
                deletedAt: { $exists: false },
            },
            { ...update, lastupdatedAt: Date.now() },
            { ...options, new: true }
        );
    }

    async markAsDeleted(
        id: Types.ObjectId,
        options: QueryOptions<ChapterDocument> = {}
    ) {
        return await ChapterModel.findOneAndUpdate(
            {
                _id: id,
            },
            {
                deletedAt: Date.now(),
            },
            { ...options, new: true }
        );
    }

    async chapterWithSubjectExists(
        subject: Types.ObjectId,
        projection: ProjectionType<ChapterDocument> = {},
        options: QueryOptions<ChapterDocument> = {}
    ) {
        return (
            (await ChapterModel.findOne(
                {
                    subject: subject,
                    deletedAt: { $exists: false },
                },
                projection,
                options
            )) != null
        );
    }

    async chapterIsChildOfSubject(
        chapterId: Types.ObjectId,
        subjectId: Types.ObjectId,
        projection: ProjectionType<ChapterDocument> = {},
        options: QueryOptions<ChapterDocument> = {}
    ) {
        return (
            (await ChapterModel.findOne(
                {
                    _id: chapterId,
                    subject: subjectId,
                    deletedAt: { $exists: false },
                },
                projection,
                options
            )) != null
        );
    }

    async getAllChapters(
        projection: ProjectionType<ChapterDocument> = {},
        options: QueryOptions<ChapterDocument> = {}
    ) {
        return await ChapterModel.find(
            {
                deletedAt: { $exists: false },
            },
            projection,
            options
        );
    }

    async getChaptersOfSubject(
        subjectId: Types.ObjectId,
        projection: ProjectionType<ChapterDocument> = {},
        options: QueryOptions<ChapterDocument> = {}
    ) {
        return await ChapterModel.find(
            {
                subject: subjectId,
                deletedAt: { $exists: false },
            },
            projection,
            options
        );
    }
}
