import { injectable } from "inversify";
import { FilterQuery, QueryOptions, Types, UpdateQuery } from "mongoose";
import { logger } from "../lib/logger";
import QuizTemplateModel, {
    QuizTemplateDocument,
} from "../models/quiz_template.model";
import _ from "lodash";

@injectable()
export class QuizTemplateService {
    constructor() {
        logger.info("[QuizTemplate] Initializing...");
    }

    async create(userId: Types.ObjectId, data: any) {
        const now = Date.now();
        return (
            await QuizTemplateModel.create([
                {
                    ...data,
                    createdBy: userId,
                    createdAt: now,
                    lastUpdatedAt: now,
                },
            ])
        )[0];
    }

    async markAsDeleted(
        id: Types.ObjectId,
        options: QueryOptions<QuizTemplateDocument> = {}
    ) {
        return await QuizTemplateModel.findOneAndUpdate(
            { _id: id },
            { deletedAt: Date.now() },
            { ...options, new: true }
        );
    }

    // check if there is a quiz template that maintains a reference
    // to the given question
    async checkQuizTemplateWithQuestion(questionId: Types.ObjectId) {
        return (
            (await QuizTemplateModel.findOne({
                potentialQuestions: questionId,
                deletedAt: { $exists: false },
            })) != null
        );
    }

    async getQuizTemplateById(id: Types.ObjectId) {
        return await QuizTemplateModel.findOne({
            _id: id,
            deletedAt: { $exists: false },
        });
    }

    async editOneQuizTemplate(
        id: Types.ObjectId,
        update: UpdateQuery<QuizTemplateDocument> = {},
        options: QueryOptions<QuizTemplateDocument> = {}
    ) {
        return await QuizTemplateModel.findOneAndUpdate(
            { _id: id, deletedAt: { $exists: false } },
            { ...update, lastUpdatedAt: Date.now() },
            { ...options, new: true }
        );
    }

    async quizTemplateWithSubjectExists(subjectId: Types.ObjectId) {
        return (
            (await QuizTemplateModel.findOne({
                subject: subjectId,
                deletedAt: { $exists: false },
            })) != null
        );
    }

    async quizTemplateWithChapterExists(chapterId: Types.ObjectId) {
        return (
            (await QuizTemplateModel.findOne({
                chapter: chapterId,
                deletedAt: { $exists: false },
            })) != null
        );
    }

    async getPaginated(
        query: FilterQuery<QuizTemplateDocument>,
        paths: string[],
        pageSize: number,
        pageNumber: number
    ) {
        const ans = await QuizTemplateModel.find({
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
