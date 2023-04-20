import { injectable } from "inversify";
import { ServiceType } from "../types";
import { FileUploadService } from "./file-upload.service";
import { Types } from "mongoose";
import MaterialModel from "../models/material.model";
import { FileCompressionStrategy } from "../lib/file-compression/strategies";
import { lazyInject } from "../container";
import { UserRole } from "../models/user.model";

@injectable()
export class MaterialService {
    @lazyInject(ServiceType.FileUpload)
    private fileUploadService: FileUploadService;

    constructor() {
        console.log("[MaterialService] Construct");
    }

    // TODO: doc this
    async create(
        name: string,
        subject: Types.ObjectId,
        chapter: number,
        userId: Types.ObjectId,
        files: Express.Multer.File[],
        compressionStrategy: FileCompressionStrategy
    ) {
        const compressedFiles = await this.fileUploadService.uploadFiles(
            files,
            compressionStrategy
        );
        const currentTime = Date.now();

        return await MaterialModel.create({
            name: name,
            subject: subject,
            chapter: chapter,

            readAccess: [UserRole.STUDENT, UserRole.ADMIN],
            writeAccess: [UserRole.ADMIN],
            resource: compressedFiles.map((f) => f._id),
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

        await this.fileUploadService.deleteFiles(doc.resource);
        return true;
    }

    async findOneAndUpdate(query: any, upd: any) {
        return await MaterialModel.findOneAndUpdate(query, upd);
    }

    async findById(id: Types.ObjectId) {
        return await MaterialModel.findById(id);
    }

    async findOne(query: any) {
        return await MaterialModel.findOne(query);
    }

    async findByIdPopulated(id: Types.ObjectId, query: string | string[]) {
        return await MaterialModel.findById(id).populate(query);
    }

    async find(query: any) {
        return await MaterialModel.find(query);
    }

    async findPopulated(f: any, p: string | string[]) {
        return await MaterialModel.find(f).populate(p);
    }
}
