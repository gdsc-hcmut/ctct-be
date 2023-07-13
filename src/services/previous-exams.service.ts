import { injectable } from "inversify";
import { ServiceType } from "../types";
import { FileUploadService } from "./file-upload.service";
import mongoose, {
    FilterQuery,
    ProjectionType,
    QueryOptions,
    SaveOptions,
    Types,
    UpdateQuery,
} from "mongoose";
import PreviousExamModel, {
    PreviousExamDocument,
} from "../models/previous-exam.model";
import { FileCompressionStrategy } from "../lib/file-compression/strategies";
import { lazyInject } from "../container";
import { logger } from "../lib/logger";

@injectable()
export class PreviousExamService {
    @lazyInject(ServiceType.FileUpload)
    private fileUploadService: FileUploadService;

    constructor() {
        logger.info("[PreviousExam] Initializing...");
    }

    /**
     * Create a new previous exam return the newly created document
     * @param name Name of this document
     * @param subject ID of the subject of this document, assuming that the subject exists
     * @param userId ID of the user that is creating this document
     * @param files The files to be uploaded, assumed to have already been validated
     * @param compressionStrategy How the uploaded files should be compressed
     * @returns The document of the newly created previous exam
     */
    async create(
        name: string,
        subtitle: string,
        description: string,
        subject: Types.ObjectId,
        userId: Types.ObjectId,
        files: Express.Multer.File[],
        compressionStrategy: FileCompressionStrategy,
        visibleTo: Types.ObjectId[]
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
            const currentTime = Date.now();

            const result = (
                await PreviousExamModel.create(
                    [
                        {
                            name: name,
                            subject: subject,

                            subtitle: subtitle,
                            description: description,

                            visibleTo: visibleTo,
                            resource: uploadedAttachments[0]._id,
                            createdBy: userId,
                            createdAt: currentTime,
                            lastUpdatedAt: currentTime,
                        },
                    ],
                    { session: session }
                )
            )[0];
            return result;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            await session.endSession();
        }
    }

    async markAsDeleted(id: Types.ObjectId) {
        return await PreviousExamModel.findOneAndUpdate(
            { _id: id },
            { deletedAt: Date.now() },
            { new: true }
        );
    }

    async findOneAndUpdate(
        query: FilterQuery<PreviousExamDocument>,
        upd: UpdateQuery<PreviousExamDocument>,
        opt: QueryOptions<PreviousExamDocument> = {}
    ) {
        return await PreviousExamModel.findOneAndUpdate(query, upd, opt);
    }

    async findById(
        id: Types.ObjectId,
        projection: ProjectionType<PreviousExamDocument> = {},
        options: QueryOptions<PreviousExamDocument> = {}
    ) {
        return await PreviousExamModel.findById(id, projection, options);
    }

    async findOne(
        query: FilterQuery<PreviousExamDocument>,
        projection: ProjectionType<PreviousExamDocument> = {},
        options: QueryOptions<PreviousExamDocument> = {}
    ) {
        return await PreviousExamModel.findOne(query, projection, options);
    }

    async findByIdPopulated(
        id: Types.ObjectId,
        query: string | string[],
        projection: ProjectionType<PreviousExamDocument> = {},
        options: QueryOptions<PreviousExamDocument> = {}
    ) {
        return await PreviousExamModel.findById(
            id,
            projection,
            options
        ).populate(query);
    }

    async find(
        query: FilterQuery<PreviousExamDocument>,
        projection: ProjectionType<PreviousExamDocument> = {},
        options: QueryOptions<PreviousExamDocument> = {}
    ) {
        return await PreviousExamModel.find(query, projection, options);
    }

    async findPopulated(
        f: FilterQuery<PreviousExamDocument>,
        p: string | string[],
        projection: ProjectionType<PreviousExamDocument> = {},
        options: QueryOptions<PreviousExamDocument> = {}
    ) {
        return await PreviousExamModel.find(f, projection, options).populate(p);
    }

    async updateMany(
        query: FilterQuery<PreviousExamDocument>,
        update: UpdateQuery<PreviousExamDocument>,
        options: QueryOptions<PreviousExamDocument> = {}
    ) {
        return await PreviousExamModel.updateMany(query, update, options);
    }

    async findBySubject(
        subject: Types.ObjectId,
        projection: ProjectionType<PreviousExamDocument> = {},
        options: QueryOptions<PreviousExamDocument> = {}
    ) {
        return await PreviousExamModel.find(
            { subject: subject, deletedAt: { $exists: false } },
            projection,
            options
        );
    }
}
