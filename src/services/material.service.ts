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
import MaterialModel, { MaterialDocument } from "../models/material.model";
import { FileCompressionStrategy } from "../lib/file-compression/strategies";
import { lazyInject } from "../container";
import { logger } from "../lib/logger";

@injectable()
export class MaterialService {
    @lazyInject(ServiceType.FileUpload)
    private fileUploadService: FileUploadService;

    constructor() {
        logger.info("[Material] Initializing...");
    }

    async create(
        name: string,
        description: string,
        subject: Types.ObjectId,
        chapter: Types.ObjectId,
        userId: Types.ObjectId,
        files: Express.Multer.File[],
        compressionStrategy: FileCompressionStrategy,
        visibleTo: Types.ObjectId[]
    ) {
        // transaction here because the material and attachment
        // document has to consistent with each other
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            console.assert(files.length === 1);
            const compressedFiles = await this.fileUploadService.uploadFiles(
                files,
                compressionStrategy,
                { session: session }
            );
            const currentTime = Date.now();
            const result = (
                await MaterialModel.create(
                    [
                        {
                            name: name,
                            subject: subject,
                            chapter: chapter,

                            description: description,

                            visibleTo: visibleTo,
                            resource: compressedFiles[0]._id,
                            createdBy: userId,
                            createdAt: currentTime,
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
        options: QueryOptions<MaterialDocument> = {}
    ) {
        return await MaterialModel.findOneAndUpdate(
            { _id: id },
            { deletedAt: Date.now() },
            { ...options, new: true }
        );
    }

    async materialWithSubjectChapterExists(
        subject: Types.ObjectId,
        chapter: Types.ObjectId,
        projection: ProjectionType<MaterialDocument> = {},
        options: QueryOptions<MaterialDocument> = {}
    ) {
        return (
            (await MaterialModel.findOne(
                {
                    subject: subject,
                    chapter: chapter,
                    deletedAt: { $exists: false },
                },
                projection,
                options
            )) != null
        );
    }

    async removeAccessLevelFromAllMaterials(
        accessLevelId: Types.ObjectId,
        options: QueryOptions<MaterialDocument> = {}
    ) {
        return await MaterialModel.updateMany(
            {},
            {
                $pull: {
                    visibleTo: accessLevelId,
                },
            },
            options
        );
    }

    async getMaterialById(
        id: Types.ObjectId,
        projection: ProjectionType<MaterialDocument> = {},
        options: QueryOptions<MaterialDocument> = {}
    ) {
        return await MaterialModel.findOne(
            { _id: id, deletedAt: { $exists: false } },
            projection,
            options
        );
    }

    async getMaterialBySubject(
        subjectId: Types.ObjectId,
        projection: ProjectionType<MaterialDocument> = {},
        options: QueryOptions<MaterialDocument> = {}
    ) {
        return await MaterialModel.find(
            { subject: subjectId, deletedAt: { $exists: false } },
            projection,
            options
        );
    }

    async getAllMaterial(
        projection: ProjectionType<MaterialDocument> = {},
        options: QueryOptions<MaterialDocument> = {}
    ) {
        return await MaterialModel.find(
            { deletedAt: { $exists: false } },
            projection,
            options
        );
    }

    async editOneMaterial(
        id: Types.ObjectId,
        update: UpdateQuery<MaterialDocument> = {},
        options: QueryOptions<MaterialDocument> = {}
    ) {
        return await MaterialModel.findOneAndUpdate(
            { _id: id, deletedAt: { $exists: false } },
            update,
            { ...options, new: true }
        );
    }

    async materialWithSubjectExists(
        subjectId: Types.ObjectId,
        projection: ProjectionType<MaterialDocument> = {},
        options: QueryOptions<MaterialDocument> = {}
    ) {
        return (
            (await MaterialModel.findOne(
                { subject: subjectId, deletedAt: { $exists: false } },
                projection,
                options
            )) != null
        );
    }

    async materialWithChapterExists(
        chapterId: Types.ObjectId,
        projection: ProjectionType<MaterialDocument> = {},
        options: QueryOptions<MaterialDocument> = {}
    ) {
        return (
            (await MaterialModel.findOne(
                { chapter: chapterId, deletedAt: { $exists: false } },
                projection,
                options
            )) != null
        );
    }
}
