import { inject, injectable } from "inversify";
import { Controller } from "./controller";
import { Router } from "express";
import { Request, Response, ServiceType } from "../types";
import {
    AccessLevelService,
    AuthService,
    ChapterService,
    QuestionService,
    QuizService,
    SubjectService,
} from "../services/index";
import { FilterQuery, Types } from "mongoose";
import { logger } from "../lib/logger";
import { Permission } from "../models/access_level.model";
import { QuizDocument } from "../models/quiz.model";
import { DEFAULT_PAGINATION_SIZE } from "../config";
import _ from "lodash";

@injectable()
export class QuizController extends Controller {
    public readonly router = Router();
    public readonly path = "/quiz";

    constructor(
        @inject(ServiceType.Auth) private authService: AuthService,
        @inject(ServiceType.Quiz) private quizService: QuizService,
        @inject(ServiceType.AccessLevel)
        private accessLevelService: AccessLevelService,
        @inject(ServiceType.Subject) private subjectService: SubjectService,
        @inject(ServiceType.Question) private questionService: QuestionService,
        @inject(ServiceType.Chapter) private chapterService: ChapterService
    ) {
        super();

        this.router.all("*", authService.authenticate(false));

        this.router.get("/", this.getAll.bind(this));
    }

    async getAll(req: Request, res: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );
            const canView = await canPerform(Permission.VIEW_QUIZ);
            if (!canView) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const query: FilterQuery<QuizDocument> = {
                isHidden: false,
            };

            if (req.query.name) {
                query.name = {
                    $regex: decodeURIComponent(req.query.name as string),
                };
            }
            if (req.query.subject) {
                query.subject = new Types.ObjectId(req.query.subject as string);
            }
            if (req.query.chapter) {
                query.chapter = new Types.ObjectId(req.query.chapter as string);
            }

            const pageSize: number = req.query.pageSize
                ? parseInt(req.query.pageSize as string)
                : DEFAULT_PAGINATION_SIZE;
            const pageNumber: number = req.query.pageNumber
                ? parseInt(req.query.pageNumber as string)
                : 1;

            if (req.query.pagination === "false") {
                const result = await this.quizService.getPopulated(
                    query,
                    {
                        potentialQuestions: 0,
                        createdAt: 0,
                        createdBy: 0,
                        lastUpdatedAt: 0,
                        __v: 0,
                    },
                    [
                        { path: "subject", select: "_id name" },
                        { path: "chapter", select: "_id name" },
                    ]
                );
                res.composer.success({
                    total: result.length,
                    result,
                });
            } else {
                const [total, result] = await this.quizService.getPaginated(
                    query,
                    {
                        potentialQuestions: 0,
                        createdAt: 0,
                        createdBy: 0,
                        lastUpdatedAt: 0,
                        __v: 0,
                    },
                    [
                        { path: "subject", select: "_id name" },
                        { path: "chapter", select: "_id name" },
                    ],
                    pageSize,
                    pageNumber
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
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }
}
