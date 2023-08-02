import { Router } from "express";
import { inject, injectable } from "inversify";

import { Request, Response, ServiceType } from "../types";
import { Controller } from "./controller";
import {
    AccessLevelService,
    AuthService,
    MaterialService,
    QuestionService,
    QuizService,
    SubjectService,
} from "../services";
import { ChapterService } from "../services/index";
import { logger } from "../lib/logger";
import { FilterQuery, Types } from "mongoose";
import { ChapterDocument } from "../models/chapter.model";
import { DEFAULT_PAGINATION_SIZE } from "../config";
import _ from "lodash";

@injectable()
export class ChapterController extends Controller {
    public readonly router = Router();
    public readonly path = "/chapter";

    constructor(
        @inject(ServiceType.Auth) private authService: AuthService,
        @inject(ServiceType.Chapter) private chapterService: ChapterService,
        @inject(ServiceType.AccessLevel)
        private accessLevelService: AccessLevelService,
        @inject(ServiceType.Subject) private subjectService: SubjectService,
        @inject(ServiceType.Material) private materialService: MaterialService,
        @inject(ServiceType.Question) private questionService: QuestionService,
        @inject(ServiceType.Quiz) private quizService: QuizService
    ) {
        super();

        this.router.all("*", this.authService.authenticate(false));
        this.router.get("/:chapterId", this.getById.bind(this));
        this.router.get("/", this.getAll.bind(this));
    }

    async getById(req: Request, res: Response) {
        try {
            const chapterId = new Types.ObjectId(req.params.chapterId);

            const chapter = await this.chapterService.getByIdPopulated(
                chapterId,
                {
                    createdAt: 0,
                    createdBy: 0,
                    lastUpdatedAt: 0,
                    __v: 0,
                },
                ["subject"]
            );

            if (!chapter) {
                throw new Error(`Chapter does not exist`);
            }

            const result = _.omit(chapter.toObject(), [
                "subject.__v",
                "subject.createdAt",
                "subject.createdBy",
                "subject.lastUpdatedAt",
            ]);

            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.error(error);
            res.composer.badRequest(error);
        }
    }

    async getAll(req: Request, res: Response) {
        try {
            const query: FilterQuery<ChapterDocument> = {};
            if (req.query.subject) {
                query.subject = new Types.ObjectId(req.query.subject as string);
            }
            if (req.query.name) {
                query.name = {
                    $regex: decodeURIComponent(req.query.name as string),
                };
            }

            const pageSize: number = req.query.pageSize
                ? parseInt(req.query.pageSize as string)
                : DEFAULT_PAGINATION_SIZE;
            const pageNumber: number = req.query.pageNumber
                ? parseInt(req.query.pageNumber as string)
                : 1;

            const hiddenFields = [
                "subject.__v",
                "subject.createdAt",
                "subject.createdBy",
                "subject.lastUpdatedAt",
            ];

            if (req.query.pagination === "false") {
                const result = (
                    await this.chapterService.getPopulated(
                        query,
                        {
                            createdAt: 0,
                            createdBy: 0,
                            lastUpdatedAt: 0,
                            __v: 0,
                        },
                        ["subject"]
                    )
                ).map((chapter) => _.omit(chapter.toObject(), hiddenFields));
                res.composer.success({
                    total: result.length,
                    result,
                });
            } else {
                const [total, unmappedResult] =
                    await this.chapterService.getPaginated(
                        query,
                        {
                            createdAt: 0,
                            createdBy: 0,
                            lastUpdatedAt: 0,
                            __v: 0,
                        },
                        ["subject"],
                        pageSize,
                        pageNumber
                    );

                const result = unmappedResult.map((chapter) =>
                    _.omit(chapter.toObject(), hiddenFields)
                );

                res.composer.success({
                    total,
                    pageCount: Math.max(Math.ceil(total / pageSize), 1),
                    pageSize,
                    result,
                });
            }
        } catch (error) {
            logger.error(error.message);
            console.error(error);
            res.composer.badRequest(error.message);
        }
    }
}
