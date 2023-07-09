import { injectable } from "inversify";
import { ServiceType } from "../types";
import { FileUploadService } from "./file-upload.service";
import {
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
        visibleTo: Types.ObjectId[],
        options: SaveOptions = {}
    ) {
        console.assert(files.length === 1);
        const compressedFiles = await this.fileUploadService.uploadFiles(
            files,
            compressionStrategy
        );
        const currentTime = Date.now();

        return (
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
                options
            )
        )[0];
    }

    async deleteById(id: Types.ObjectId, options: QueryOptions = {}) {
        const doc = await MaterialModel.findOneAndDelete({ _id: id }, options);
        if (!doc) {
            return null;
        }

        await this.fileUploadService.deleteFiles([doc.resource], options);
        return doc;
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
}
