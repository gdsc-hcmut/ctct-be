import { injectable } from "inversify";
import { ServiceType } from "../types";
import { FileUploadService } from "./file-upload.service";
import { Types } from "mongoose";
import PreviousExamModel from "../models/previous-exam.model";
import { FileCompressionStrategy } from "../lib/file-compression/strategies";
import { lazyInject } from "../container";

@injectable()
export class PreviousExamService {
    @lazyInject(ServiceType.FileUpload)
    private fileUploadService: FileUploadService;

    constructor() {
        console.log("[PreviousExamService] Construct");
    }

    /**
     * Create a new previous exam return the newly created document
     * @param name Name of this document
     * @param userId ID of the user that is creating this document
     * @param files The files to be uploaded, assumed to have already been validated
     * @param hidden Determine whether a student should be able to see this document
     * @param tags The tags of this document, assumed to have already been validated
     * @param compressionStrategy How the uploaded files should be compressed
     * @returns The document of the newly created previous exam
     */
    async create(
        name: string,
        userId: Types.ObjectId,
        files: Express.Multer.File[],
        hidden: true,
        tags: Types.ObjectId[],
        compressionStrategy: FileCompressionStrategy
    ) {
        console.assert(files.length === 1);
        const uploadedAttachments = await this.fileUploadService.uploadFiles(
            files,
            compressionStrategy
        );
        const currentTime = Date.now();

        return await PreviousExamModel.create({
            name: name,
            isHiddenFromStudents: hidden,
            tags: tags,
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
    async deleteOne(id: Types.ObjectId) {
        const doc = await PreviousExamModel.findOneAndDelete({ _id: id });
        if (!doc) {
            return false;
        }

        await this.fileUploadService.deleteFiles([doc.resource]);
        return true;
    }

    async findOne(id: Types.ObjectId) {
        return await PreviousExamModel.findOne(id);
    }

    async findOnePopulated(id: Types.ObjectId, query: string | string[]) {
        return await PreviousExamModel.findOne(id).populate(query);
    }

    async find(query: any) {
        return await PreviousExamModel.find(query);
    }

    async findPopulated(f: any, p: string | string[]) {
        return await PreviousExamModel.find(f).populate(p);
    }
}
