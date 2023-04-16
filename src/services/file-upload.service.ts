import { injectable } from "inversify";
import admin from "firebase-admin";
import serviceAccount from "../../googleServiceAccountKey.json";
import { UploadFileInfo, DownloadFileInfo } from "../types";
import { Bucket } from "@google-cloud/storage";
import { randomUUID } from "crypto";
import { FileCompressionStrategy } from "../lib/file-compression/strategies";
import getRawBody from "raw-body";
import AttachmentModel from "../models/attachment.model";
import { AttachmentDocument } from "../models/attachment.model";
import { Types } from "mongoose";

@injectable()
export class FileUploadService {
    /**
     * Handles uploading of files through Firebase Storage
     * All requests are independent of each other, so no lock is needed
     */
    bucket: Bucket;

    constructor() {
        admin.initializeApp({
            credential: admin.credential.cert(
                serviceAccount as admin.ServiceAccount
            ),
            storageBucket: "ctct-be.appspot.com",
        });
        this.bucket = admin.storage().bucket();
        console.log("Initialized file upload service");
    }

    async uploadFiles(
        files: Express.Multer.File[],
        compressionStrategy: FileCompressionStrategy
    ): Promise<AttachmentDocument[]> {
        const res: AttachmentDocument[] = await Promise.all(
            files.map((file) =>
                (async () => {
                    const refName = `${
                        file.originalname
                    }_${randomUUID().toString()}`;
                    const f = this.bucket.file(refName);
                    const compressedBuffer = await compressionStrategy.compress(
                        file
                    );
                    await f.save(compressedBuffer, {
                        contentType: file.mimetype,
                    });

                    return await AttachmentModel.create({
                        originalName: file.originalname,
                        refName: refName,
                        mimetype: file.mimetype,
                    });
                })()
            )
        );

        return res;
    }

    async downloadFile(id: Types.ObjectId): Promise<DownloadFileInfo> {
        const doc = await AttachmentModel.findById(id);
        if (!doc) {
            return null;
        }

        const { originalName, refName, mimetype } = doc;
        const file = this.bucket.file(refName);
        const buffer = await getRawBody(file.createReadStream());

        return {
            originalName: originalName,
            refName: refName,
            mimetype: mimetype,
            buffer: buffer,
        };
    }
}
