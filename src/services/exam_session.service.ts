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
import ExamSessionModel, {
    ExamSessionDocument,
    ExamSessionStatus,
} from "../models/exam_session.model";

@injectable()
export class ExamSessionService {
    constructor() {
        logger.info(`[ExamSession] Initializing...`);
    }

    public async create(
        userId: Types.ObjectId,
        examId: Types.ObjectId,
        slotId: number,
        startedAt: number,
        duration: number,
        questions: ConcreteQuestion[]
    ) {
        return await ExamSessionModel.create({
            userId,
            status: ExamSessionStatus.ONGOING,
            duration,
            startedAt,
            standardizedScore: 0,
            fromExam: examId,
            slotId,
            questions,
        });
    }

    public async getOngoingSessionOfExam(
        userId: Types.ObjectId,
        examId: Types.ObjectId
    ) {
        return await ExamSessionModel.findOne({
            userId,
            fromExam: examId,
            status: ExamSessionStatus.ONGOING,
        });
    }

    public async getOngoingSessionOfUser(
        userId: Types.ObjectId,
        examSessionId: Types.ObjectId
    ) {
        return await ExamSessionModel.findOne({
            userId,
            _id: examSessionId,
            status: ExamSessionStatus.ONGOING,
        });
    }

    public async findOneAndUpdate(
        query: FilterQuery<ExamSessionDocument>,
        update: UpdateQuery<ExamSessionDocument>,
        options: QueryOptions<ExamSessionDocument> = {}
    ) {
        return await ExamSessionModel.findOneAndUpdate(query, update, options);
    }

    public async getByIdPopulated(
        id: Types.ObjectId,
        projection: ProjectionType<ExamSessionDocument>,
        populateOptions: PopulateOptions | (string | PopulateOptions)[]
    ) {
        return await ExamSessionModel.findById(id, projection).populate(
            populateOptions
        );
    }

    public async getById(examSessionId: Types.ObjectId) {
        return await ExamSessionModel.findById(examSessionId);
    }

    public async getAllSessionOfSlot(examId: Types.ObjectId, slotId: number) {
        return await ExamSessionModel.find({
            fromExam: examId,
            slotId,
        });
    }

    private preparePipelineForGetAll(
        prePopulateQuery: FilterQuery<ExamSessionDocument>,
        postPopulateQuery: FilterQuery<ExamSessionDocument>
    ): PipelineStage[] {
        return [
            { $match: prePopulateQuery },
            {
                $lookup: {
                    from: "exams",
                    localField: "fromExam",
                    foreignField: "_id",
                    as: "fromExam",
                },
            },
            { $unwind: "$fromExam" },
            {
                $lookup: {
                    from: "subjects",
                    localField: "fromExam.subject",
                    foreignField: "_id",
                    as: "fromExam.subject",
                },
            },
            { $unwind: "$fromExam.subject" },
            { $project: { __v: 0, questions: 0 } },
            { $match: postPopulateQuery },
            {
                $unset: [
                    "fromExam.slots.registeredUsers",
                    "fromExam.slots.questions",
                ],
            },
        ];
    }

    public async getPaginated(
        prePopulateQuery: FilterQuery<ExamSessionDocument>,
        postPopulateQuery: FilterQuery<ExamSessionDocument>,
        pageSize: number,
        pageNumber: number
    ) {
        return await ExamSessionModel.aggregate([
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
        prePopulateQuery: FilterQuery<ExamSessionDocument>,
        postPopulateQuery: FilterQuery<ExamSessionDocument>
    ) {
        return await ExamSessionModel.aggregate([
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

    public async userHasDoneThisExam(
        userId: Types.ObjectId,
        examId: Types.ObjectId
    ) {
        return await ExamSessionModel.exists({
            userId,
            fromExam: examId,
        });
    }
}
