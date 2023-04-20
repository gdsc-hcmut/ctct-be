import { injectable } from "inversify";
import SubjectModel from "../models/subject.model";
import { Types } from "mongoose";
import { UserRole } from "../models/user.model";

@injectable()
export class SubjectService {
    constructor() {
        console.log("[SubjectService] Construct");
    }

    async create(name: string, userId: Types.ObjectId) {
        const t = Date.now();
        return await SubjectModel.create({
            name: name,
            writeAccess: [UserRole.ADMIN],
            createdAt: t,
            createdBy: userId,
            lastUpdatedAt: t,
        });
    }

    async findOneAndDelete(query: any) {
        return await SubjectModel.findOneAndDelete(query);
    }

    async findById(id: Types.ObjectId) {
        return await SubjectModel.findById(id);
    }

    async findOne(query: any) {
        return await SubjectModel.findOne(query);
    }

    async findOneAndUpdate(query: any, upd: any) {
        return await SubjectModel.findOneAndUpdate(query, upd);
    }

    async find(query: any) {
        return await SubjectModel.find(query);
    }
}
