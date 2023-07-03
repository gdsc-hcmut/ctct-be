import { injectable } from "inversify";
import { ServiceType } from "../types";
import { FileUploadService } from "./file-upload.service";
import { FilterQuery, QueryOptions, Types, UpdateQuery } from "mongoose";
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
        logger.info("Constructing Previous Exam service");
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
        console.assert(files.length === 1);
        const uploadedAttachments = await this.fileUploadService.uploadFiles(
            files,
            compressionStrategy
        );
        const currentTime = Date.now();

        return await PreviousExamModel.create({
            name: name,
            subject: subject,

            subtitle: subtitle,
            description: description,

            visibleTo: visibleTo,
            resource: uploadedAttachments[0]._id,
            createdBy: userId,
            createdAt: currentTime,
            lastUpdatedAt: currentTime,
        });
    }

    /**
     * Delete a previous exam by id, and return whether the document exists
     * @param id ID of the document to be deleted
     * @returns A boolean of whether the document with that ID exists
     * */
    async deleteById(id: Types.ObjectId) {
        const doc = await PreviousExamModel.findOneAndDelete({ _id: id });
        if (!doc) {
            return false;
        }

        await this.fileUploadService.deleteFiles([doc.resource]);
        return true;
    }

    async findOneAndUpdate(
        query: FilterQuery<PreviousExamDocument>,
        upd: UpdateQuery<PreviousExamDocument>,
        opt: QueryOptions<PreviousExamDocument> = {}
    ) {
        return await PreviousExamModel.findOneAndUpdate(query, upd, opt);
    }

    async findById(id: Types.ObjectId) {
        return await PreviousExamModel.findById(id);
    }

    async findOne(query: FilterQuery<PreviousExamDocument>) {
        return await PreviousExamModel.findOne(query);
    }

    async findByIdPopulated(id: Types.ObjectId, query: string | string[]) {
        return await PreviousExamModel.findById(id).populate(query);
    }

    async find(query: FilterQuery<PreviousExamDocument>) {
        return await PreviousExamModel.find(query);
    }

    async findPopulated(
        f: FilterQuery<PreviousExamDocument>,
        p: string | string[]
    ) {
        return await PreviousExamModel.find(f).populate(p);
    }

    async updateMany(
        query: FilterQuery<PreviousExamDocument>,
        update: UpdateQuery<PreviousExamDocument>,
        options: QueryOptions<PreviousExamDocument> = {}
    ) {
        return await PreviousExamModel.updateMany(query, update, options);
    }
}