import { injectable } from "inversify";
import { ServiceType } from "../types";
import { FileUploadService } from "./file-upload.service";
import { FilterQuery, QueryOptions, Types, UpdateQuery } from "mongoose";
import MaterialModel, { MaterialDocument } from "../models/material.model";
import { FileCompressionStrategy } from "../lib/file-compression/strategies";
import { lazyInject } from "../container";
import { logger } from "../lib/logger";

@injectable()
export class MaterialService {
    @lazyInject(ServiceType.FileUpload)
    private fileUploadService: FileUploadService;

    constructor() {
        logger.info("Constructing Material service");
    }

    // TODO: doc this
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
        console.assert(files.length === 1);
        const compressedFiles = await this.fileUploadService.uploadFiles(
            files,
            compressionStrategy
        );
        const currentTime = Date.now();

        return await MaterialModel.create({
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
        });
    }

    async deleteById(id: Types.ObjectId) {
        const doc = await MaterialModel.findOneAndDelete({ _id: id });
        if (!doc) {
            return false;
        }

        await this.fileUploadService.deleteFiles([doc.resource]);
        return true;
    }

    async findOneAndUpdate(
        query: FilterQuery<MaterialDocument>,
        upd: UpdateQuery<MaterialDocument>,
        opt: QueryOptions<MaterialDocument> = {}
    ) {
        return await MaterialModel.findOneAndUpdate(query, upd, opt);
    }

    async findById(id: Types.ObjectId) {
        return await MaterialModel.findById(id);
    }

    async findOne(query: FilterQuery<MaterialDocument>) {
        return await MaterialModel.findOne(query);
    }

    async findByIdPopulated(id: Types.ObjectId, query: string | string[]) {
        return await MaterialModel.findById(id).populate(query);
    }

    async find(query: FilterQuery<MaterialDocument>) {
        return await MaterialModel.find(query);
    }

    async findPopulated(
        f: FilterQuery<MaterialDocument>,
        p: string | string[]
    ) {
        return await MaterialModel.find(f).populate(p);
    }

    async updateMany(
        query: FilterQuery<MaterialDocument>,
        update: UpdateQuery<MaterialDocument>,
        options: QueryOptions<MaterialDocument> = {}
    ) {
        return await MaterialModel.updateMany(query, update, options);
    }
}
