import { injectable } from "inversify";
import { logger } from "../lib/logger";
import {
    FilterQuery,
    ProjectionType,
    QueryOptions,
    SaveOptions,
    Types,
    UpdateQuery,
} from "mongoose";
import QuizModel, { QuizDocument, QuizStatus } from "../models/quiz.model";
import { ConcreteQuestion } from "../models/question_template.model";

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
        questions: ConcreteQuestion[],
        options: SaveOptions = {}
    ) {
        return (
            await QuizModel.create(
                [
                    {
                        userId: userId,
                        status: status,
                        createdAt: Date.now(),
                        duration: duration,
                        startTime: startTime,
                        fromTemplate: fromTemplate,
                        questions: questions,
                    },
                ],
                options
            )
        )[0];
    }

    async find(
        query: FilterQuery<QuizDocument>,
        projection: ProjectionType<QuizDocument> = {},
        options: QueryOptions<QuizDocument> = {}
    ) {
        return await QuizModel.find(query, projection, options);
    }

    async findOne(
        query: FilterQuery<QuizDocument>,
        projection: ProjectionType<QuizDocument> = {},
        options: QueryOptions<QuizDocument> = {}
    ) {
        return await QuizModel.findOne(query, projection, options);
    }

    async findOneAndUpdate(
        query: FilterQuery<QuizDocument>,
        update: UpdateQuery<QuizDocument>,
        options: QueryOptions<QuizDocument> = {}
    ) {
        return await QuizModel.findOneAndUpdate(query, update, options);
    }

    async getAllQuizByUser(
        userId: Types.ObjectId,
        options: QueryOptions<QuizDocument> = {}
    ) {
        return await QuizModel.find({ userId: userId }, {}, options).populate({
            path: "fromTemplate",
            populate: {
                path: "subject",
                model: "subjects",
            },
        });
    }

    async getUserQuizById(
        userId: Types.ObjectId,
        quizId: Types.ObjectId,
        options: QueryOptions<QuizDocument> = {}
    ) {
        return await QuizModel.findOne(
            {
                _id: quizId,
                userId: userId,
            },
            {},
            options
        ).populate({
            path: "fromTemplate",
            populate: {
                path: "subject",
                model: "subjects",
            },
        });
    }

    /**
     * Returns whether a user has any unfinished quiz (registered or ongoing) of a specific template
     * If template is not specified, then this function returns whether the user has any
     * unfinished quiz at all
     */
    async userHasUnfinishedQuiz(
        userId: Types.ObjectId,
        quizTemplateId: Types.ObjectId = null,
        options: QueryOptions<QuizDocument> = {}
    ) {
        if (!quizTemplateId) {
            return (
                (await QuizModel.findOne(
                    {
                        userId: userId,
                        status: QuizStatus.ONGOING,
                    },
                    {},
                    options
                )) != null
            );
        }
        return (
            (await QuizModel.findOne(
                {
                    userId: userId,
                    fromTemplate: quizTemplateId,
                    status: QuizStatus.ONGOING,
                },
                {},
                options
            )) != null
        );
    }

    /**
     * Update a quiz with a boolean array (the result of the answer given by the user)
     */
    async updateQuestionResult(
        quizId: Types.ObjectId,
        index: number,
        result: boolean[],
        options: QueryOptions<QuizDocument> = {}
    ) {
        const quiz = await QuizModel.findById(quizId, {}, options);
        quiz.questions[index].triesLeft--;
        for (const [i, subQuestion] of quiz.questions[
            index
        ].questions.entries()) {
            subQuestion.isCorrect = result[i];
        }
        // recalculate standardized score
        let cur = 0,
            tot = 0;
        quiz.questions.forEach((question) => {
            question.questions.forEach(({ point, isCorrect }) => {
                tot += point;
                if (isCorrect) {
                    cur += point;
                }
            });
        });
        quiz.standardizedScore = tot === 0 ? 0 : (100 * cur) / tot;
        quiz.markModified("questions");
        await quiz.save();
        return quiz;
    }
}
