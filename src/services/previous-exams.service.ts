import { injectable } from "inversify";
import { ServiceType } from "../types";
import { FileUploadService } from "./file-upload.service";
import mongoose, {
    FilterQuery,
    ProjectionType,
    QueryOptions,
    Types,
    UpdateQuery,
} from "mongoose";
import PreviousExamModel, {
    PreviousExamDocument,
    PreviousExamType,
    Semester,
} from "../models/previous-exam.model";
import { FileCompressionStrategy } from "../lib/file-compression/strategies";
import { lazyInject } from "../container";
import { logger } from "../lib/logger";
import _ from "lodash";

@injectable()
export class PreviousExamService {
    @lazyInject(ServiceType.FileUpload)
    private fileUploadService: FileUploadService;

    constructor() {
        logger.info("[PreviousExam] Initializing...");
    }

    async create(
        name: string,
        description: string,
        subject: Types.ObjectId,
        semester: Semester,
        type: PreviousExamType,
        userId: Types.ObjectId,
        files: Express.Multer.File[],
        compressionStrategy: FileCompressionStrategy
    ) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            console.assert(files.length === 1);
            const uploadedAttachments =
                await this.fileUploadService.uploadFiles(
                    files,
                    compressionStrategy,
                    { session: session }
                );
            const now = Date.now();

            const result = (
                await PreviousExamModel.create(
                    [
                        {
                            name: name,
                            description: description,
                            subject: subject,
                            semester: semester,
                            type: type,

                            resource: uploadedAttachments[0]._id,
                            createdBy: userId,
                            createdAt: now,
                            lastUpdatedAt: now,
                        },
                    ],
                    { session: session }
                )
            )[0];
            await session.commitTransaction();
            return result;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            await session.endSession();
        }
    }

    async markAsDeleted(
        id: Types.ObjectId,
        options: QueryOptions<PreviousExamDocument> = {}
    ) {
        return await PreviousExamModel.findOneAndUpdate(
            { _id: id },
            { deletedAt: Date.now() },
            { ...options, new: true }
        );
    }

    async getById(id: Types.ObjectId) {
        return await PreviousExamModel.findOne({
            _id: id,
            deletedAt: { $exists: false },
        });
    }

    async getByIdPopulated(id: Types.ObjectId, paths: string[]) {
        return await PreviousExamModel.findOne({
            _id: id,
            deletedAt: { $exists: false },
        }).populate(paths);
    }

    async getPaginated(
        query: FilterQuery<PreviousExamDocument>,
        paths: string[],
        pageSize: number,
        pageNumber: number
    ) {
        return await Promise.all([
            PreviousExamModel.count({
                ...query,
                deletedAt: { $exists: false },
            }),
            PreviousExamModel.find({
                ...query,
                deletedAt: { $exists: false },
            })
                .skip(Math.max(pageSize * (pageNumber - 1), 0))
                .limit(pageSize)
                .populate(paths),
        ]);
    }

    async getPopulated(
        query: FilterQuery<PreviousExamDocument>,
        paths: string[]
    ) {
        return await PreviousExamModel.find({
            ...query,
            deletedAt: { $exists: false },
        }).populate(paths);
    }

    async editOne(
        id: Types.ObjectId,
        update: UpdateQuery<PreviousExamDocument> = {},
        options: QueryOptions<PreviousExamDocument> = {}
    ) {
        return await PreviousExamModel.findOneAndUpdate(
            { _id: id },
            { ...update, lastUpdatedAt: Date.now() },
            {
                ...options,
                new: true,
            }
        );
    }

    async previousExamWithSubjectExists(subjectId: Types.ObjectId) {
        return (
            (await PreviousExamModel.findOne({
                subject: subjectId,
                deletedAt: { $exists: false },
            })) != null
        );
    }
}
