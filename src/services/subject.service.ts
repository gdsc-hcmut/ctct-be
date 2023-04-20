import { injectable } from "inversify";
import SubjectModel from "../models/subject.model";
import { Types } from "mongoose";

@injectable()
export class SubjectService {
    constructor() {
        console.log("[SubjectService] Construct");
    }

    async create(name: string, userId: Types.ObjectId) {
        const t = Date.now();
        return await SubjectModel.create({
            name: name,
            createdAt: t,
            createdBy: userId,
            lastUpdatedAt: t,
        });
    }

    async findById(id: Types.ObjectId) {
        return await SubjectModel.findById(id);
    }

    async updateOne(query: any, upd: any) {
        return await SubjectModel.findOneAndUpdate(query, upd);
    }

    async find(query: any) {
        return await SubjectModel.find(query);
    }
}
