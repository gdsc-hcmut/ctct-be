import { inject, injectable } from "inversify";
import { Controller } from "../controller";
import { Router } from "express";
import { logger } from "../../lib/logger";
import { Permission } from "../../models/access_level.model";
import { AccessLevelService, AuthService, NewsService } from "../../services";
import { Request, Response, ServiceType } from "../../types";
import { CreateNewsDto } from "../../lib/dto/create_news.dto";
import { EditNewsDto } from "../../lib/dto/edit_news.dto";
import { FilterQuery, Types } from "mongoose";
import { DEFAULT_PAGINATION_SIZE } from "../../config";
import _ from "lodash";
import { NewsDocument } from "../../models/news.model";

@injectable()
export class AdminNewsController implements Controller {
    public readonly router = Router();
    public readonly path = "/news";

    constructor(
        @inject(ServiceType.Auth) private authService: AuthService,
        @inject(ServiceType.AccessLevel)
        private accessLevelService: AccessLevelService,
        @inject(ServiceType.News) private newsService: NewsService
    ) {
        this.router.all("*", authService.authenticate());
        this.router.post("/", this.create.bind(this));

        this.router.get("/:newsId", this.getById.bind(this));
        this.router.get("/", this.getAll.bind(this));

        this.router.patch("/:newsId", this.editOne.bind(this));

        this.router.delete("/:newsId", this.deleteOne.bind(this));
    }

    public async create(request: Request, response: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                request.tokenMeta
            );

            const canCreateNews = await canPerform(
                Permission.ADMIN_CREATE_NEWS
            );

            if (!canCreateNews) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const newsInfo: CreateNewsDto = {
                title: request.body.title,
                content: request.body.content,
                thumbnailUrl: request.body.thumbnailUrl,
                author: request.body.author,
            };

            if (_.isEmpty(newsInfo.title)) {
                throw new Error("News title is required");
            }

            if (_.isEmpty(newsInfo.content)) {
                throw new Error("News content is required");
            }

            if (_.isEmpty(newsInfo.thumbnailUrl)) {
                throw new Error("News thumbnailUrl is required");
            }

            if (_.isEmpty(newsInfo.author)) {
                throw new Error("News author is required");
            }

            const { userId: createdBy } = request.tokenMeta;
            const news = await this.newsService.create(newsInfo, createdBy);

            response.composer.success(news);
        } catch (error) {
            logger.error(error.message);
            console.error(error);
            response.composer.badRequest(error.message);
        }
    }

    public async editOne(request: Request, response: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                request.tokenMeta
            );

            const canEditNews = await canPerform(Permission.ADMIN_EDIT_NEWS);

            if (!canEditNews) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const newsId = new Types.ObjectId(request.params.newsId);
            const news = await this.newsService.getById(newsId);

            if (!news) {
                throw new Error(`News not found`);
            }

            const newsInfo: EditNewsDto = {
                title: request.body.title,
                content: request.body.content,
                thumbnailUrl: request.body.thumbnailUrl,
                author: request.body.author,
            };

            if (_.isEmpty(newsInfo.title)) {
                throw new Error("News title is required");
            }

            if (_.isEmpty(newsInfo.content)) {
                throw new Error("News content is required");
            }

            if (_.isEmpty(newsInfo.thumbnailUrl)) {
                throw new Error("News thumbnailUrl is required");
            }

            if (_.isEmpty(newsInfo.author)) {
                throw new Error("News author is required");
            }

            const updatedNews = await this.newsService.editOne(
                newsId,
                newsInfo
            );

            response.composer.success(updatedNews);
        } catch (error) {
            logger.error(error.message);
            console.error(error);
            response.composer.badRequest(error.message);
        }
    }

    public async getById(request: Request, response: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                request.tokenMeta
            );

            const canViewNews = await canPerform(Permission.ADMIN_VIEW_NEWS);
            if (!canViewNews) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const newsId = new Types.ObjectId(request.params.newsId);
            const news = await this.newsService.getById(
                newsId,
                {},
                {
                    populate: [{ path: "createdBy" }],
                }
            );

            if (!news) {
                throw new Error(`News not found`);
            }

            response.composer.success(news);
        } catch (error) {
            logger.error(error.message);
            console.error(error);
            response.composer.badRequest(error.message);
        }
    }

    public async getAll(request: Request, response: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                request.tokenMeta
            );

            const canViewNews = await canPerform(Permission.ADMIN_VIEW_NEWS);
            if (!canViewNews) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const query: FilterQuery<NewsDocument> = {};

            if (request.query.title) {
                query.title = {
                    $regex: decodeURIComponent(request.query.title as string),
                };
            }

            if (request.query.author) {
                query.author = {
                    $regex: decodeURIComponent(request.query.author as string),
                };
            }

            const isUsePagination =
                request.query.pagination === "true" ||
                request.query.pagination === undefined;

            const pageSize: number = request.query.pageSize
                ? parseInt(request.query.pageSize as string)
                : DEFAULT_PAGINATION_SIZE;

            const pageNumber: number = request.query.pageNumber
                ? parseInt(request.query.pageNumber as string)
                : 1;

            if (isUsePagination) {
                const [total, result] = await this.newsService.getPaginated(
                    query,
                    {
                        __v: 0,
                    },
                    [{ path: "createdBy" }],
                    pageSize,
                    pageNumber
                );

                response.composer.success({
                    total,
                    pageCount: Math.max(Math.ceil(total / pageSize), 1),
                    pageSize,
                    result,
                });
            } else {
                const result = await this.newsService.get(
                    query,
                    {
                        __v: 0,
                    },
                    [{ path: "createdBy" }]
                );

                response.composer.success({
                    total: result.length,
                    result,
                });
            }
        } catch (error) {
            logger.error(error.message);
            console.error(error);
            response.composer.badRequest(error.message);
        }
    }

    public async deleteOne(request: Request, response: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                request.tokenMeta
            );

            const canDeleteNews = await canPerform(
                Permission.ADMIN_DELETE_NEWS
            );

            if (!canDeleteNews) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const newsId = new Types.ObjectId(request.params.newsId);
            const news = await this.newsService.getById(newsId);

            if (!news) {
                throw new Error(`News not found`);
            }

            const deleteNews = await this.newsService.markAsDeleted(newsId);

            response.composer.success(deleteNews);
        } catch (error) {
            logger.error(error.message);
            console.error(error);
            response.composer.badRequest(error.message);
        }
    }
}
