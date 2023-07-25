import { injectable } from "inversify";
import { logger } from "../lib/logger";
import {
    FilterQuery,
    ProjectionType,
    QueryOptions,
    Types,
    UpdateQuery,
} from "mongoose";
import ChapterModel, { ChapterDocument } from "../models/chapter.model";
import _ from "lodash";

@injectable()
export class ChapterService {
    constructor() {
        logger.info("[Chapter] Initializing...");
    }

    async create(
        name: string,
        subject: Types.ObjectId,
        description: string,
        userId: Types.ObjectId
    ) {
        const now = Date.now();
        return await ChapterModel.create({
            name: name,
            description: description,
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

    async chapterWithSubjectExists(subject: Types.ObjectId) {
        return (
            (await ChapterModel.findOne({
                subject: subject,
                deletedAt: { $exists: false },
            })) != null
        );
    }

    async chapterIsChildOfSubject(
        chapterId: Types.ObjectId,
        subjectId: Types.ObjectId
    ) {
        return (
            (await ChapterModel.findOne({
                _id: chapterId,
                subject: subjectId,
                deletedAt: { $exists: false },
            })) != null
        );
    }

    async getPaginated(
        query: FilterQuery<ChapterDocument>,
        paths: string[],
        pageSize: number,
        pageNumber: number
    ) {
        const ans = await ChapterModel.find({
            ...query,
            deletedAt: { $exists: false },
        }).populate(paths);
        const pageCount = Math.ceil(ans.length / pageSize);
        return [
            pageCount,
            _.take(_.drop(ans, pageSize * (pageNumber - 1)), pageSize),
        ];
    }
}
