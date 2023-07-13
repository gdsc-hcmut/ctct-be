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
        subtitle: string,
        description: string,
        subject: Types.ObjectId,
        chapter: number,
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

                            subtitle: subtitle,
                            description: description,

                            visibleTo: visibleTo,
                            resource: compressedFiles[0]._id,
                            createdBy: userId,
                            createdAt: currentTime,
                            lastUpdatedAt: currentTime,
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

    async markAsDeleted(id: Types.ObjectId) {
        return await MaterialModel.findOneAndUpdate(
            { _id: id },
            { deletedAt: Date.now() },
            { new: true }
        );
    }

    async findOneAndUpdate(
        query: FilterQuery<MaterialDocument>,
        upd: UpdateQuery<MaterialDocument>,
        opt: QueryOptions<MaterialDocument> = {}
    ) {
        return await MaterialModel.findOneAndUpdate(query, upd, opt);
    }

    async findById(
        id: Types.ObjectId,
        projection: ProjectionType<MaterialDocument> = {},
        options: QueryOptions<MaterialDocument> = {}
    ) {
        return await MaterialModel.findById(id, projection, options);
    }

    async findOne(
        query: FilterQuery<MaterialDocument>,
        projection: ProjectionType<MaterialDocument> = {},
        options: QueryOptions<MaterialDocument> = {}
    ) {
        return await MaterialModel.findOne(query, projection, options);
    }

    async findByIdPopulated(
        id: Types.ObjectId,
        query: string | string[],
        projection: ProjectionType<MaterialDocument> = {},
        options: QueryOptions<MaterialDocument> = {}
    ) {
        return await MaterialModel.findById(id, projection, options).populate(
            query
        );
    }

    async find(
        query: FilterQuery<MaterialDocument>,
        projection: ProjectionType<MaterialDocument> = {},
        options: QueryOptions<MaterialDocument> = {}
    ) {
        return await MaterialModel.find(query, projection, options);
    }

    async findPopulated(
        f: FilterQuery<MaterialDocument>,
        p: string | string[],
        projection: ProjectionType<MaterialDocument> = {},
        options: QueryOptions<MaterialDocument> = {}
    ) {
        return await MaterialModel.find(f, projection, options).populate(p);
    }

    async updateMany(
        query: FilterQuery<MaterialDocument>,
        update: UpdateQuery<MaterialDocument>,
        options: QueryOptions<MaterialDocument> = {}
    ) {
        return await MaterialModel.updateMany(query, update, options);
    }

    async materialWithSubjectAndChapterExists(
        subject: Types.ObjectId,
        chapter: number,
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

    async findBySubject(
        subject: Types.ObjectId,
        projection: ProjectionType<MaterialDocument> = {},
        options: QueryOptions<MaterialDocument> = {}
    ) {
        return await MaterialModel.find(
            { subject: subject, deletedAt: { $exists: false } },
            projection,
            options
        );
    }
}
