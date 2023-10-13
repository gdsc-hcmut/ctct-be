import { injectable } from "inversify";
import { logger } from "../lib/logger";
import {
    FilterQuery,
    PopulateOptions,
    ProjectionType,
    QueryOptions,
    Types,
    UpdateQuery,
} from "mongoose";
import { CreateExamDto } from "../lib/dto/create_exam.dto";
import ExamModel, { ExamDocument, ExamType } from "../models/exam.model";
import _ from "lodash";
import { Semester } from "../config";

@injectable()
export class ExamService {
    constructor() {
        logger.info("[Exam] Initializing...");
    }

    public async create(userId: Types.ObjectId, info: CreateExamDto) {
        const currentTime = Date.now();
        const slotsWithId = _.map(info.slots, (slot, index) => ({
            slotId: index,
            ...slot,
        }));

        return await ExamModel.create({
            ..._.omit(info, ["slots"]),
            slots: slotsWithId,

            createdBy: userId,
            createdAt: currentTime,
            lastUpdatedAt: currentTime,
            isHidden: false,
        });
    }

    public async getExamById(examId: Types.ObjectId) {
        return await ExamModel.findOne({
            _id: examId,
            deletedAt: { $exists: false },
        });
    }

    public async examWithSubjectExists(subjectId: Types.ObjectId) {
        return (
            (await ExamModel.findOne({
                subject: subjectId,
                deletedAt: { $exists: false },
            })) != null
        );
    }

    public async examWithQuestionExists(questionId: Types.ObjectId) {
        return (
            (await ExamModel.findOne({
                "slots.questions": questionId,
            })) != null
        );
    }

    async editOneExam(
        examId: Types.ObjectId,
        update: UpdateQuery<ExamDocument> = {},
        options: QueryOptions<ExamDocument> = {}
    ) {
        return await ExamModel.findOneAndUpdate(
            { _id: examId, deletedAt: { $exists: false } },
            { ...update, lastUpdatedAt: Date.now() },
            { ...options, new: true }
        );
    }

    public async markAsDeleted(
        examId: Types.ObjectId,
        options: QueryOptions<ExamDocument> = {}
    ) {
        return await ExamModel.findOneAndUpdate(
            { _id: examId },
            { deletedAt: Date.now() },
            { ...options, new: true }
        );
    }

    public async getByIdPopulated(
        examId: Types.ObjectId,
        projection: ProjectionType<ExamDocument> = {},
        populateOptions: PopulateOptions | (string | PopulateOptions)[]
    ) {
        return await ExamModel.findOne(
            {
                _id: examId,
                deletedAt: { $exists: false },
            },
            projection
        ).populate(populateOptions);
    }

    async getPaginated(
        query: FilterQuery<ExamDocument>,
        projection: ProjectionType<ExamDocument>,
        populateOptions: PopulateOptions | (string | PopulateOptions)[],
        pageSize: number,
        pageNumber: number
    ) {
        return await Promise.all([
            ExamModel.count({
                ...query,
                deletedAt: { $exists: false },
            }),
            ExamModel.find(
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
        query: FilterQuery<ExamDocument>,
        projection: ProjectionType<ExamDocument>,
        populateOptions: PopulateOptions | (string | PopulateOptions)[]
    ) {
        return await ExamModel.find(
            {
                ...query,
                deletedAt: { $exists: false },
            },
            projection
        ).populate(populateOptions);
    }

    public async examWithSameSubjectSemesterTypeExists(
        subjectId: Types.ObjectId,
        semester: Semester,
        type: ExamType
    ) {
        return (
            (await ExamModel.findOne({
                subject: subjectId,
                semester: semester,
                type: type,
                deletedAt: { $exists: false },
            })) != null
        );
    }

    /**
     * Hide all registration information from the exam
     */
    public maskExam(exam: ExamDocument) {
        return {
            ..._.pick(exam.toObject(), [
                "name",
                "description",
                "registrationStartedAt",
                "registrationEndedAt",
                "semester",
                "type",
                "subject",
            ]),
            slots: _.map(exam.slots, (slot) => ({
                ..._.pick(slot, [
                    "name",
                    "slotId",
                    "userLimit",
                    "startedAt",
                    "endedAt",
                ]),
                registeredUsers: slot.registeredUsers.map((user) =>
                    _.pick(user, "userId")
                ),
                questionCount: slot.questions.length,
            })),
        };
    }
}
