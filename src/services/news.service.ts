import { injectable } from "inversify";
import { logger } from "../lib/logger";

import NewsModel, { NewsDocument } from "../models/news.model";
import { CreateNewsDto } from "../lib/dto/create_news.dto";

import _ from "lodash";

import {
    FilterQuery,
    PopulateOptions,
    ProjectionType,
    QueryOptions,
    Types,
    UpdateQuery,
} from "mongoose";

@injectable()
export class NewsService {
    constructor() {
        logger.info(`[News] Initializing...`);
    }

    public censorNewsInformationForUser(news: NewsDocument) {
        return {
            ..._.pick(news, [
                "_id",
                "title",
                "content",
                "thumbnailUrl",
                "author",
                "createdAt",
                "lastUpdatedAt",
            ]),
        };
    }

    public async create(dto: CreateNewsDto, createdBy: Types.ObjectId) {
        const now = Date.now();

        return await NewsModel.create({
            ...dto,
            createdBy,
            createdAt: now,
            lastUpdatedAt: now,
        });
    }

    public async editOne(
        newsId: Types.ObjectId,
        update: UpdateQuery<NewsDocument>,
        options: QueryOptions<NewsDocument> = {}
    ) {
        return await NewsModel.findOneAndUpdate(
            { _id: newsId, deletedAt: { $exists: false } },
            { ...update, lastUpdatedAt: Date.now() },
            { ...options, new: true }
        );
    }

    public async getOne(
        query: FilterQuery<NewsDocument>,
        projection: ProjectionType<NewsDocument> = {},
        options: QueryOptions<NewsDocument> = {}
    ): Promise<NewsDocument> {
        return await NewsModel.findOne(
            { ...query, deletedAt: { $exists: false } },
            projection,
            options
        );
    }

    public async getById(
        id: Types.ObjectId,
        projection: ProjectionType<NewsDocument> = {},
        options: QueryOptions<NewsDocument> = {}
    ): Promise<NewsDocument> {
        return await this.getOne({ _id: id }, projection, options);
    }

    public async get(
        query: FilterQuery<NewsDocument>,
        projection: ProjectionType<NewsDocument>,
        options: QueryOptions<NewsDocument>
    ) {
        return await NewsModel.find(
            { ...query, deletedAt: { $exists: false } },
            projection,
            options
        );
    }

    public async getPaginated(
        query: FilterQuery<NewsDocument>,
        projection: ProjectionType<NewsDocument>,
        populateOptions: PopulateOptions | (string | PopulateOptions)[],
        pageSize: number,
        pageNumber: number
    ) {
        return await Promise.all([
            NewsModel.count({ ...query, deletedAt: { $exists: false } }),
            NewsModel.find(
                { ...query, deletedAt: { $exists: false } },
                projection,
                { ort: { createdAt: -1 } }
            )
                .skip(Math.max(pageSize * (pageNumber - 1), 0))
                .limit(pageSize)
                .populate(populateOptions),
        ]);
    }

    public async markAsDeleted(
        newsId: Types.ObjectId,
        options: QueryOptions<NewsDocument> = {}
    ) {
        return await NewsModel.findOneAndUpdate(
            { _id: newsId, deletedAt: { $exists: false } },
            { deletedAt: Date.now() },
            options
        );
    }
}
