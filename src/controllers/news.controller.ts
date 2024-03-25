import { Router } from "express";
import { Controller } from "./controller";
import { inject, injectable } from "inversify";
import { logger } from "../lib/logger";
import { Request, Response, ServiceType } from "../types";
import { AuthService, NewsService, UserService } from "../services/index";
import { FilterQuery, Types } from "mongoose";
import { EventDocument } from "../models/event.model";
import { DEFAULT_PAGINATION_SIZE } from "../config";
import _ from "lodash";

@injectable()
export class NewsController implements Controller {
    public readonly router = Router();
    public readonly path = "/event";

    constructor(
        @inject(ServiceType.Auth) private authService: AuthService,
        @inject(ServiceType.User) private userService: UserService,
        @inject(ServiceType.News) private newsService: NewsService
    ) {
        this.router.all("*", authService.authenticate());

        this.router.get("/:newsId", this.getById.bind(this));
        this.router.get("/", this.getAll.bind(this));
    }

    public async getById(request: Request, response: Response) {
        try {
            const eventId = new Types.ObjectId(request.params.id);

            const news = await this.newsService.getById(
                eventId,
                {},
                {
                    populate: [{ path: "createdBy" }],
                }
            );

            if (!news) {
                throw new Error(`News not found`);
            }

            response.composer.success(
                this.newsService.censorNewsInformationForUser(news)
            );
        } catch (error) {
            logger.error(error.message);
            console.error(error);
            response.composer.badRequest(error.message);
        }
    }

    public async getAll(request: Request, response: Response) {
        try {
            const query: FilterQuery<EventDocument> = {};

            if (request.query.title) {
                query.title = {
                    $regex: decodeURIComponent(request.query.name as string),
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
                const [total, tempResult] = await this.newsService.getPaginated(
                    query,
                    {},
                    { path: "createdBy" },
                    pageSize,
                    pageNumber
                );

                const result = _.map(tempResult, (news) =>
                    this.newsService.censorNewsInformationForUser(news)
                );

                response.composer.success({
                    total,
                    pageCount: Math.max(Math.ceil(total / pageSize), 1),
                    pageSize,
                    result,
                });
            } else {
                const tempResult = await this.newsService.get(
                    query,
                    {
                        __v: 0,
                    },
                    [{ path: "createdBy" }]
                );

                const result = _.map(tempResult, (news) =>
                    this.newsService.censorNewsInformationForUser(news)
                );

                response.composer.success({
                    total: tempResult.length,
                    result,
                });
            }
        } catch (error) {
            logger.error(error.message);
            console.error(error);
            response.composer.badRequest(error.message);
        }
    }
}
