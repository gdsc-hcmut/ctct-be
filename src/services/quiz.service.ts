import { injectable } from "inversify";
import {
    FilterQuery,
    ProjectionType,
    QueryOptions,
    Types,
    UpdateQuery,
} from "mongoose";
import { logger } from "../lib/logger";
import QuizModel, { QuizDocument } from "../models/quiz.model";
import { CreateQuizDto } from "../lib/dto/index";

@injectable()
export class QuizService {
    constructor() {
        logger.info("[Quiz] Initializing...");
    }

    async create(userId: Types.ObjectId, data: CreateQuizDto) {
        const now = Date.now();
        return (
            await QuizModel.create([
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
        options: QueryOptions<QuizDocument> = {}
    ) {
        return await QuizModel.findOneAndUpdate(
            { _id: id },
            { deletedAt: Date.now() },
            { ...options, new: true }
        );
    }

    // check if there is a quiz that maintains a reference
    // to the given question
    async checkQuizWithQuestion(questionId: Types.ObjectId) {
        return (
            (await QuizModel.findOne({
                potentialQuestions: questionId,
                deletedAt: { $exists: false },
            })) != null
        );
    }

    async getQuizById(id: Types.ObjectId) {
        return await QuizModel.findOne({
            _id: id,
            deletedAt: { $exists: false },
        });
    }

    async editOneQuiz(
        id: Types.ObjectId,
        update: UpdateQuery<QuizDocument> = {},
        options: QueryOptions<QuizDocument> = {}
    ) {
        return await QuizModel.findOneAndUpdate(
            { _id: id, deletedAt: { $exists: false } },
            { ...update, lastUpdatedAt: Date.now() },
            { ...options, new: true }
        );
    }

    async quizWithSubjectExists(subjectId: Types.ObjectId) {
        return (
            (await QuizModel.findOne({
                subject: subjectId,
                deletedAt: { $exists: false },
            })) != null
        );
    }

    async quizWithChapterExists(chapterId: Types.ObjectId) {
        return (
            (await QuizModel.findOne({
                chapter: chapterId,
                deletedAt: { $exists: false },
            })) != null
        );
    }

    async getPaginated(
        query: FilterQuery<QuizDocument>,
        projection: ProjectionType<QuizDocument>,
        paths: string[],
        pageSize: number,
        pageNumber: number
    ) {
        return await Promise.all([
            QuizModel.count({
                ...query,
                deletedAt: { $exists: false },
            }),
            QuizModel.find(
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
        query: FilterQuery<QuizDocument>,
        projection: ProjectionType<QuizDocument>,
        paths: string[]
    ) {
        return await QuizModel.find(
            {
                ...query,
                deletedAt: { $exists: false },
            },
            projection
        ).populate(paths);
    }

    async getByIdPopulated(
        id: Types.ObjectId,
        projection: ProjectionType<QuizDocument>,
        paths: string[]
    ) {
        return await QuizModel.findOne(
            {
                _id: id,
                deletedAt: { $exists: false },
            },
            projection
        ).populate(paths);
    }
}
