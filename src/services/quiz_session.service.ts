import { injectable } from "inversify";
import { logger } from "../lib/logger";
import {
    FilterQuery,
    PipelineStage,
    PopulateOptions,
    ProjectionType,
    Types,
} from "mongoose";
import { ConcreteQuestion } from "../models/question.model";
import QuizSessionModel, {
    QuizSessionDocument,
    QuizStatus,
} from "../models/quiz_session.model";

@injectable()
export class QuizSessionService {
    constructor() {
        logger.info("[Quiz] Initializing...");
    }

    async create(
        userId: Types.ObjectId,
        duration: number,
        startedAt: number,
        fromQuiz: Types.ObjectId,
        questions: ConcreteQuestion[]
    ) {
        const now = Date.now();
        return (
            await QuizSessionModel.create([
                {
                    userId,
                    status: QuizStatus.ONGOING,
                    createdAt: now,
                    duration,
                    startedAt,
                    fromQuiz,
                    questions,
                },
            ])
        )[0];
    }

    async getQuizById(id: Types.ObjectId) {
        return await QuizSessionModel.findById(id);
    }

    async userIsDoingQuiz(userId: Types.ObjectId, quizId: Types.ObjectId) {
        return (
            (await QuizSessionModel.findOne({
                userId: userId,
                fromQuiz: quizId,
                status: QuizStatus.ONGOING,
            })) != null
        );
    }

    async getUserOngoingQuizById(
        quizId: Types.ObjectId,
        userId: Types.ObjectId
    ) {
        return await QuizSessionModel.findOne({
            _id: quizId,
            userId: userId,
            status: QuizStatus.ONGOING,
        });
    }

    async getPaginated(
        query: FilterQuery<QuizSessionDocument>,
        projection: ProjectionType<QuizSessionDocument>,
        populateOptions: PopulateOptions | (string | PopulateOptions)[],
        pageSize: number,
        pageNumber: number
    ) {
        return await Promise.all([
            QuizSessionModel.count({
                ...query,
                deletedAt: { $exists: false },
            }),
            QuizSessionModel.find(
                {
                    ...query,
                    deletedAt: { $exists: false },
                },
                projection
            )
                .skip(Math.max(pageSize * (pageNumber - 1), 0))
                .limit(pageSize)
                .populate(populateOptions),
        ]);
    }

    async getPopulated(
        query: FilterQuery<QuizSessionDocument>,
        projection: ProjectionType<QuizSessionDocument>,
        populateOptions: PopulateOptions | (string | PopulateOptions)[]
    ) {
        return await QuizSessionModel.find(
            {
                ...query,
                deletedAt: { $exists: false },
            },
            projection
        ).populate(populateOptions);
    }

    async getByIdPopulated(
        id: Types.ObjectId,
        projection: ProjectionType<QuizSessionDocument>,
        populateOptions: PopulateOptions | (string | PopulateOptions)[]
    ) {
        return await QuizSessionModel.findById(id, projection).populate(
            populateOptions
        );
    }
}
