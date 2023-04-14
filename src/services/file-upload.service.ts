import { injectable } from "inversify";
import admin from "firebase-admin";
import serviceAccount from "../../googleServiceAccountKey.json";

@injectable()
export class FileUploadService {
    /**
     * Handles uploading of files through Firebase Storage
     * All requests are independent of each other, so no lock is needed
     */
    constructor() {
        admin.initializeApp({
            credential: admin.credential.cert(
                serviceAccount as admin.ServiceAccount
            ),
            databaseURL: "ctct-be.appspot.com",
        });
        console.log("Initialized file upload service");
    }
}
