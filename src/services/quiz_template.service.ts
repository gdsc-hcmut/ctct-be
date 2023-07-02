import { injectable } from "inversify";
import SubjectModel, { SubjectDocument } from "../models/subject.model";
import { FilterQuery, QueryOptions, Types, UpdateQuery } from "mongoose";
import { logger } from "../lib/logger";
import QuizTemplateModel, {
    QuizTemplateDocument,
} from "../models/quiz_template.model";

@injectable()
export class QuizTemplateService {
    constructor() {
        logger.info("Constructing Quiz Template service");
    }

    async create(userId: Types.ObjectId, data: any) {
        return await QuizTemplateModel.create({
            ...data,
            createdBy: userId,
            createdAt: Date.now(),
        });
    }

    async find(query: FilterQuery<QuizTemplateDocument>) {
        return await QuizTemplateModel.find(query);
    }

    async updateMany(
        query: FilterQuery<QuizTemplateDocument>,
        update: UpdateQuery<QuizTemplateDocument>,
        options: QueryOptions<QuizTemplateDocument> = {}
    ) {
        return await QuizTemplateModel.updateMany(query, update, options);
    }

    async findOne(query: FilterQuery<QuizTemplateDocument>) {
        return await QuizTemplateModel.findOne(query);
    }
}
