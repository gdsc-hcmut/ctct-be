import { injectable } from "inversify";
import { logger } from "../lib/logger";
import {
    FilterQuery,
    PipelineStage,
    PopulateOptions,
    ProjectionType,
    QueryOptions,
    Types,
    UpdateQuery,
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

    async getById(id: Types.ObjectId) {
        return await QuizSessionModel.findById(id);
    }

    async findOngoingSessionFromQuiz(
        userId: Types.ObjectId,
        quizId: Types.ObjectId
    ) {
        return await QuizSessionModel.findOne({
            userId,
            fromQuiz: quizId,
            status: QuizStatus.ONGOING,
        });
    }

    async getOngoingQuizSessionOfUser(
        quizSessionId: Types.ObjectId,
        userId: Types.ObjectId
    ) {
        return await QuizSessionModel.findOne({
            _id: quizSessionId,
            userId: userId,
            status: QuizStatus.ONGOING,
        });
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

    async findOneAndUpdate(
        query: FilterQuery<QuizSessionDocument>,
        update: UpdateQuery<QuizSessionDocument>,
        options: QueryOptions = {}
    ) {
        return await QuizSessionModel.findOneAndUpdate(query, update, options);
    }

    public async getStatisticsGroupedBySubject(userId: Types.ObjectId) {
        return await QuizSessionModel.aggregate([
            {
                $match: {
                    userId: userId,
                    status: QuizStatus.ENDED,
                },
            },
            {
                $lookup: {
                    from: "quizzes",
                    localField: "fromQuiz",
                    foreignField: "_id",
                    as: "fromQuiz",
                },
            },
            {
                $unwind: {
                    path: "$fromQuiz",
                    includeArrayIndex: "string",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "subjects",
                    localField: "fromQuiz.subject",
                    foreignField: "_id",
                    as: "fromQuiz.subject",
                },
            },
            {
                $unwind: {
                    path: "$fromQuiz.subject",
                    includeArrayIndex: "string",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $group: {
                    _id: "$fromQuiz.subject._id",
                    name: { $first: "$fromQuiz.subject.name" },
                    total: { $count: {} },
                    score: { $avg: "$standardizedScore" },
                },
            },
        ]);
    }

    private preparePipelineForGetAll(
        prePopulateQuery: FilterQuery<QuizSessionDocument>,
        postPopulateQuery: FilterQuery<QuizSessionDocument>
    ): PipelineStage[] {
        return [
            { $match: prePopulateQuery },
            {
                $lookup: {
                    from: "quizzes",
                    localField: "fromQuiz",
                    foreignField: "_id",
                    as: "fromQuiz",
                },
            },
            { $unwind: "$fromQuiz" },
            {
                $lookup: {
                    from: "subjects",
                    localField: "fromQuiz.subject",
                    foreignField: "_id",
                    as: "fromQuiz.subject",
                },
            },
            { $unwind: "$fromQuiz.subject" },
            {
                $lookup: {
                    from: "chapters",
                    localField: "fromQuiz.chapter",
                    foreignField: "_id",
                    as: "fromQuiz.chapter",
                },
            },
            { $unwind: "$fromQuiz.chapter" },
            { $project: { __v: 0, questions: 0 } },
            { $match: postPopulateQuery },
        ];
    }

    public async getPaginated(
        prePopulateQuery: FilterQuery<QuizSessionDocument>,
        postPopulateQuery: FilterQuery<QuizSessionDocument>,
        pageSize: number,
        pageNumber: number
    ) {
        return await QuizSessionModel.aggregate([
            ...this.preparePipelineForGetAll(
                prePopulateQuery,
                postPopulateQuery
            ),
            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    result: [
                        { $skip: Math.max((pageNumber - 1) * pageSize, 0) },
                        { $limit: pageSize },
                    ],
                },
            },
            {
                $set: {
                    total: {
                        $ifNull: [{ $arrayElemAt: ["$metadata.total", 0] }, 0],
                    },
                },
            },
            { $project: { metadata: 0 } },
        ]);
    }

    public async getAllPopulated(
        prePopulateQuery: FilterQuery<QuizSessionDocument>,
        postPopulateQuery: FilterQuery<QuizSessionDocument>
    ) {
        return await QuizSessionModel.aggregate([
            ...this.preparePipelineForGetAll(
                prePopulateQuery,
                postPopulateQuery
            ),
            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    result: [],
                },
            },
            {
                $set: {
                    total: {
                        $ifNull: [{ $arrayElemAt: ["$metadata.total", 0] }, 0],
                    },
                },
            },
            { $project: { metadata: 0 } },
        ]);
    }
}
