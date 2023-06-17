import { injectable } from "inversify";
import SubjectModel from "../models/subject.model";
import { Types } from "mongoose";
import { UserRole } from "../models/user.model";
import { logger } from "../lib/logger";

@injectable()
export class SubjectService {
    constructor() {
        logger.info("Constructing Subject service");
    }

    async create(name: string, userId: Types.ObjectId, description: string) {
        const t = Date.now();
        return await SubjectModel.create({
            name: name,
            description: description,
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
