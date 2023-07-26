import { injectable } from "inversify";
import { logger } from "../lib/logger";
import { FilterQuery, Types } from "mongoose";
import QuizModel, { QuizDocument, QuizStatus } from "../models/quiz.model";
import { ConcreteQuestion } from "../models/question_template.model";
import _ from "lodash";

@injectable()
export class QuizService {
    constructor() {
        logger.info("[Quiz] Initializing...");
    }

    async create(
        userId: Types.ObjectId,
        status: QuizStatus,
        duration: number,
        startTime: number,
        fromTemplate: Types.ObjectId,
        questions: ConcreteQuestion[]
    ) {
        return (
            await QuizModel.create([
                {
                    userId: userId,
                    status: status,
                    createdAt: Date.now(),
                    duration: duration,
                    startTime: startTime,
                    fromTemplate: fromTemplate,
                    questions: questions,
                },
            ])
        )[0];
    }

    async getOneQuizOfUserExpanded(
        userId: Types.ObjectId,
        quizId: Types.ObjectId
    ) {
        return await QuizModel.findOne({
            _id: quizId,
            userId: userId,
        }).populate({
            path: "fromTemplate",
            populate: {
                path: "subject",
                model: "subjects",
            },
        });
    }

    async getQuizById(id: Types.ObjectId) {
        return await QuizModel.findById(id);
    }

    async userHasUnfinishedQuiz(
        userId: Types.ObjectId,
        quizTemplateId: Types.ObjectId
    ) {
        return (
            (await QuizModel.findOne({
                userId: userId,
                fromTemplate: quizTemplateId,
                status: QuizStatus.ONGOING,
            })) != null
        );
    }

    async getUserOngoingQuizById(
        quizId: Types.ObjectId,
        userId: Types.ObjectId
    ) {
        return await QuizModel.findOne({
            _id: quizId,
            userId: userId,
            status: QuizStatus.ONGOING,
        });
    }

    async getPaginated(
        query: FilterQuery<QuizDocument>,
        paths: string[],
        pageSize: number,
        pageNumber: number
    ) {
        return await Promise.all([
            QuizModel.count({
                ...query,
                deletedAt: { $exists: false },
            }),
            QuizModel.find({
                ...query,
                deletedAt: { $exists: false },
            })
                .skip(pageSize * (pageNumber - 1))
                .limit(pageSize)
                .populate(paths),
        ]);
    }
}
