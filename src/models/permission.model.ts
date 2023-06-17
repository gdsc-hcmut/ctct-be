import mongoose, { Document, Schema } from "mongoose";
import { UserRole } from "./user.model";

export enum Permission {
    UPLOAD_MATERIAL = "UPLOAD_MATERIAL",
    VIEW_MATERIAL = "VIEW_MATERIAL",
    EDIT_MATERIAL = "EDIT_MATERIAL",
    DELETE_MATERIAL = "DELETE_MATERIAL",
    UPLOAD_PREVIOUS_EXAM = "UPLOAD_PREVIOUS_EXAM",
    VIEW_PREVIOUS_EXAM = "VIEW_PREVIOUS_EXAM",
    EDIT_PREVIOUS_EXAM = "EDIT_PREVIOUS_EXAM",
    DELETE_PREVIOUS_EXAM = "DELETE_PREVIOUS_EXAM",
    CREATE_SUBJECT = "CREATE_SUBJECT",
    EDIT_SUBJECT = "EDIT_SUBJECT",
    DELETE_SUBJECT = "DELETE_SUBJECT",
}

export type PermissionDocument = Document & {
    role: UserRole;
    permissions: Permission[];
};

const permissionSchema = new Schema<PermissionDocument>({
    role: { type: String, enum: UserRole, unique: true },
    permissions: Array<Permission>,
});

const PermissionModel = mongoose.model<PermissionDocument>(
    "permissions",
    permissionSchema
);
export default PermissionModel;
