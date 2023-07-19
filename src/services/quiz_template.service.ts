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

    async removeAccessLevelFromAllQuizTemplates(
        accessLevelId: Types.ObjectId,
        options: QueryOptions<QuizTemplateDocument> = {}
    ) {
        return await QuizTemplateModel.updateMany(
            {},
            {
                $pull: {
                    visibleTo: accessLevelId,
                },
            },
            options
        );
    }

    // check if there is a quiz template that maintains a reference
    // to the given question
    async checkQuizTemplateWithQuestion(
        questionId: Types.ObjectId,
        projection: ProjectionType<QuizTemplateDocument> = {},
        options: QueryOptions<QuizTemplateDocument> = {}
    ) {
        return (
            (await QuizTemplateModel.findOne(
                {
                    potentialQuestions: questionId,
                    deletedAt: { $exists: false },
                },
                projection,
                options
            )) != null
        );
    }

    async getQuizTemplateById(
        id: Types.ObjectId,
        projection: ProjectionType<QuizTemplateDocument> = {},
        options: QueryOptions<QuizTemplateDocument> = {}
    ) {
        return await QuizTemplateModel.findOne(
            { _id: id, deletedAt: { $exists: false } },
            projection,
            options
        );
    }

    async editOneQuizTemplate(
        id: Types.ObjectId,
        update: UpdateQuery<QuizTemplateDocument> = {},
        options: QueryOptions<QuizTemplateDocument> = {}
    ) {
        return await QuizTemplateModel.findOneAndUpdate(
            { _id: id, deletedAt: { $exists: false } },
            update,
            { ...options, new: true }
        );
    }

    async getAllQuizTemplates(
        projection: ProjectionType<QuizTemplateDocument> = {},
        options: QueryOptions<QuizTemplateDocument> = {}
    ) {
        return await QuizTemplateModel.find(
            { deletedAt: { $exists: false } },
            projection,
            options
        );
    }

    async quizTemplateWithSubjectExists(
        subjectId: Types.ObjectId,
        projection: ProjectionType<QuizTemplateDocument> = {},
        options: QueryOptions<QuizTemplateDocument> = {}
    ) {
        return (
            (await QuizTemplateModel.findOne(
                {
                    subject: subjectId,
                    deletedAt: { $exists: false },
                },
                projection,
                options
            )) != null
        );
    }

    async quizTemplateWithChapterExists(
        chapterId: Types.ObjectId,
        projection: ProjectionType<QuizTemplateDocument> = {},
        options: QueryOptions<QuizTemplateDocument> = {}
    ) {
        return (
            (await QuizTemplateModel.findOne(
                { chapter: chapterId, deletedAt: { $exists: false } },
                projection,
                options
            )) != null
        );
    }
}
