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
import QuizTemplateModel, {
    QuizTemplateDocument,
} from "../models/quiz_template.model";

@injectable()
export class QuizTemplateService {
    constructor() {
        logger.info("[QuizTemplate] Initializing...");
    }

    async create(userId: Types.ObjectId, data: any, options: SaveOptions = {}) {
        return (
            await QuizTemplateModel.create(
                [
                    {
                        ...data,
                        createdBy: userId,
                        createdAt: Date.now(),
                    },
                ],
                options
            )
        )[0];
    }

    async find(
        query: FilterQuery<QuizTemplateDocument>,
        projection: ProjectionType<QuizTemplateDocument> = {},
        options: QueryOptions<QuizTemplateDocument> = {}
    ) {
        return await QuizTemplateModel.find(query, projection, options);
    }

    async updateMany(
        query: FilterQuery<QuizTemplateDocument>,
        update: UpdateQuery<QuizTemplateDocument>,
        options: QueryOptions<QuizTemplateDocument> = {}
    ) {
        return await QuizTemplateModel.updateMany(query, update, options);
    }

    async findOne(
        query: FilterQuery<QuizTemplateDocument>,
        projection: ProjectionType<QuizTemplateDocument> = {},
        options: QueryOptions<QuizTemplateDocument> = {}
    ) {
        return await QuizTemplateModel.findOne(query, projection, options);
    }

    async findOneAndUpdate(
        query: FilterQuery<QuizTemplateDocument>,
        update: UpdateQuery<QuizTemplateDocument>,
        options: QueryOptions<QuizTemplateDocument> = {}
    ) {
        return await QuizTemplateModel.findOneAndUpdate(query, update, options);
    }

    async findById(
        id: Types.ObjectId,
        projection: ProjectionType<QuizTemplateDocument> = {},
        options: QueryOptions<QuizTemplateDocument> = {}
    ) {
        return await QuizTemplateModel.findById(id, projection, options);
    }
}
