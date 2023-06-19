import { injectable } from "inversify";
import SubjectModel, { SubjectDocument } from "../models/subject.model";
import { FilterQuery, QueryOptions, Types, UpdateQuery } from "mongoose";
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

    async findOneAndDelete(query: FilterQuery<SubjectDocument>) {
        return await SubjectModel.findOneAndDelete(query);
    }

    async findById(id: Types.ObjectId) {
        return await SubjectModel.findById(id);
    }

    async findOne(query: FilterQuery<SubjectDocument>) {
        return await SubjectModel.findOne(query);
    }

    async findOneAndUpdate(
        query: FilterQuery<SubjectDocument>,
        upd: UpdateQuery<SubjectDocument>,
        opt: QueryOptions<SubjectDocument> = {}
    ) {
        return await SubjectModel.findOneAndUpdate(query, upd, opt);
    }

    async find(query: FilterQuery<SubjectDocument>) {
        return await SubjectModel.find(query);
    }
}
