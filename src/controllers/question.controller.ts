import { Router } from "express";
import { Controller } from "./controller";
import { Request, Response, ServiceType } from "../types";
import {
    AccessLevelService,
    AuthService,
    ChapterService,
    QuestionService,
    QuizService,
    SubjectService,
} from "../services/index";
import _ from "lodash";
import { logger } from "../lib/logger";
import { CharStream, CommonTokenStream } from "antlr4";
import QuestionGrammarVisitor from "../lib/question-generation/QuestionGrammarVisitor";
import GrammarParser from "../lib/question-generation/GrammarParser";
import GrammarLexer from "../lib/question-generation/GrammarLexer";
import { FilterQuery, Types } from "mongoose";
import { Permission } from "../models/access_level.model";
import { QuestionDocument, QuestionType } from "../models/question.model";
import { DEFAULT_PAGINATION_SIZE } from "../config";
import { inject, injectable } from "inversify";

@injectable()
export class QuestionController extends Controller {
    public readonly router = Router();
    public readonly path = "/question/";

    constructor(
        @inject(ServiceType.Auth) private authService: AuthService,
        @inject(ServiceType.Question) private questionService: QuestionService,
        @inject(ServiceType.AccessLevel)
        private accessLevelService: AccessLevelService,
        @inject(ServiceType.Subject) private subjectService: SubjectService,
        @inject(ServiceType.Quiz) private quizService: QuizService,
        @inject(ServiceType.Chapter) private chapterService: ChapterService
    ) {
        super();

        this.router.all("*", authService.authenticate());

        this.router.post("/test_code", this.testCode.bind(this));
        this.router.post(
            "/test_concrete_question/:questionId",
            this.testConcreteQuestionGeneration.bind(this)
        );
        this.router.post("/preview", this.previewQuestion.bind(this));
        this.router.post("/", this.create.bind(this));
        this.router.get("/", this.getAll.bind(this));
        this.router.delete("/:questionId", this.delete.bind(this));
    }

    async testCode(req: Request, res: Response) {
        try {
            if (!req.tokenMeta.isManager) {
                throw new Error(`Missing manager permission`);
            }
            if (!req.body.code) {
                throw new Error(`Missing code`);
            }
            const code = req.body.code as string;
            const charStream = new CharStream(code);
            const lexer = new GrammarLexer(charStream);
            const tokenStream = new CommonTokenStream(lexer);
            const tree = new GrammarParser(tokenStream);

            const visitor = new QuestionGrammarVisitor();
            visitor.visitProg(tree.prog());

            const symbols = visitor.getSymbols();
            logger.debug(symbols);
            res.composer.success(Object.fromEntries(symbols));
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async testConcreteQuestionGeneration(req: Request, res: Response) {
        try {
            if (!req.tokenMeta.isManager) {
                throw new Error(`Missing manager permission`);
            }
            const questionId = new Types.ObjectId(req.params.questionId);
            const question = await this.questionService.getById(questionId);
            const result =
                this.questionService.generateConcreteQuestion(question);
            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async previewQuestion(req: Request, res: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );
            const canCreateQuestion = await canPerform(
                Permission.ADMIN_CREATE_QUESTION
            );
            if (!canCreateQuestion) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const info = _.pick(req.body, [
                "code",
                "type",
                "description",
                "options",
                "shuffleOptions",
                "answerKey",
                "answerKeys",
                "answerField",
                "matchCase",
                "maximumError",
                "explanation",
            ]);
            info.code = info.code || "";
            info.description = info.description || "";
            info.explanation = info.explanation || "";
            const type = info.type;
            switch (type) {
                case QuestionType.MULTIPLE_CHOICE_SINGLE_ANSWER: {
                    const [options, shuffleOptions, answerKeys] = [
                        info.options as string[],
                        info.shuffleOptions as boolean,
                        info.answerKeys as number[],
                    ];
                    if (
                        !options ||
                        shuffleOptions === undefined ||
                        answerKeys === undefined
                    ) {
                        throw new Error(
                            `Missing options, shuffleOptions, or answerKeys for multiple choice, single answer question`
                        );
                    }
                    if (
                        !(
                            answerKeys.length === 1 &&
                            answerKeys[0] >= 0 &&
                            answerKeys[0] < options.length
                        )
                    ) {
                        throw new Error(
                            `answerKeys must be of length 1 and within bounds`
                        );
                    }
                    options.forEach((option, index) => {
                        info.options[index] = {
                            key: index,
                            description: option,
                        };
                    });
                    break;
                }
                case QuestionType.MULTIPLE_CHOICE_MULTIPLE_ANSWERS: {
                    const [options, shuffleOptions, answerKeys] = [
                        info.options as string[],
                        info.shuffleOptions as boolean,
                        info.answerKeys as number[],
                    ];
                    if (
                        !options ||
                        shuffleOptions === undefined ||
                        answerKeys === undefined
                    ) {
                        throw new Error(
                            `Missing options, shuffleOptions, or answerKeys for multiple choice, multiple answers question`
                        );
                    }
                    answerKeys.forEach((key, keyIndex) => {
                        if (key < 0 || key >= options.length) {
                            throw new Error(
                                `Answer key ${key} is out of bounds`
                            );
                        }
                        if (
                            answerKeys.some(
                                (otherKey, otherIndex) =>
                                    otherKey === key && otherIndex !== keyIndex
                            )
                        ) {
                            throw new Error(`Answer keys contain duplicates`);
                        }
                    });
                    options.forEach((option, index) => {
                        info.options[index] = {
                            key: index,
                            description: option,
                        };
                    });
                    break;
                }
                case QuestionType.TEXT: {
                    if (info.answerField === undefined) {
                        throw new Error(`Question missing 'answerField'`);
                    }
                    if (info.matchCase === undefined) {
                        throw new Error(`Question missing 'matchCase'`);
                    }
                    break;
                }
                case QuestionType.NUMBER: {
                    if (info.answerField === undefined) {
                        throw new Error(
                            `Question missing 'answerField' or 'answerField' is not a string`
                        );
                    }
                    if (info.maximumError === undefined) {
                        throw new Error(`Question missing 'maximumError'`);
                    }
                    break;
                }
                default: {
                    throw new Error(
                        `type should be one of [${Object.values(
                            QuestionType
                        )}], received '${type}'`
                    );
                }
            }
            const result = this.questionService.generateConcreteQuestion(
                info as any
            );
            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async create(req: Request, res: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );
            const canCreateQuestion = await canPerform(
                Permission.ADMIN_CREATE_QUESTION
            );
            if (!canCreateQuestion) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }
            const { userId } = req.tokenMeta;

            const info = _.pick(req.body, [
                "name",
                "code",
                "subject",
                "chapter",
                "type",
                "description",
                "options",
                "shuffleOptions",
                "answerKey",
                "answerKeys",
                "answerField",
                "matchCase",
                "maximumError",
                "explanation",
            ]);

            const [subject, chapter, name] = [
                new Types.ObjectId(info.subject),
                new Types.ObjectId(info.chapter),
                req.body.name as string,
            ];
            if (!subject) {
                throw new Error(`Missing 'subject' field`);
            }
            if (!name || name.trim().length === 0) {
                throw new Error(`'name' is missing or is an empty string`);
            }
            if (chapter === undefined) {
                throw new Error(`Missing 'chapter' field`);
            }

            const subjectExists = await this.subjectService.subjectExists(
                subject
            );
            const chapterIsChildOfSubject =
                await this.chapterService.isChildOfSubject(chapter, subject);
            if (!subjectExists) {
                throw new Error(`Subject doesn't exist`);
            }
            if (!chapterIsChildOfSubject) {
                throw new Error(
                    `Chapter doesn't exist or does not belong to this subject`
                );
            }

            const type = info.type as QuestionType;
            switch (type) {
                case QuestionType.MULTIPLE_CHOICE_SINGLE_ANSWER: {
                    const [options, shuffleOptions, answerKeys] = [
                        info.options as string[],
                        info.shuffleOptions as boolean,
                        info.answerKeys as number[],
                    ];
                    if (
                        !options ||
                        shuffleOptions === undefined ||
                        answerKeys === undefined
                    ) {
                        throw new Error(
                            `Missing options, shuffleOptions or answerKeys for multiple choice, single answer question`
                        );
                    }
                    if (
                        !(
                            answerKeys.length === 1 &&
                            answerKeys[0] >= 0 &&
                            answerKeys[0] < options.length
                        )
                    ) {
                        throw new Error(
                            `answerKeys must be of length 1 and within bounds`
                        );
                    }
                    options.forEach((option, index) => {
                        info.options[index] = {
                            key: index,
                            description: option,
                        };
                    });
                    break;
                }
                case QuestionType.MULTIPLE_CHOICE_MULTIPLE_ANSWERS: {
                    const [options, shuffleOptions, answerKeys] = [
                        info.options as string[],
                        info.shuffleOptions as boolean,
                        info.answerKeys as number[],
                    ];
                    if (
                        !options ||
                        shuffleOptions === undefined ||
                        answerKeys === undefined
                    ) {
                        throw new Error(
                            `Missing options, shuffleOptions or answerKeys for multiple choice, multiple answers question`
                        );
                    }
                    answerKeys.forEach((key, keyIndex) => {
                        if (key < 0 || key >= options.length) {
                            throw new Error(
                                `Answer key ${key} is out of bounds`
                            );
                        }
                        if (
                            answerKeys.some(
                                (otherKey, otherIndex) =>
                                    otherKey === key && otherIndex !== keyIndex
                            )
                        ) {
                            throw new Error(`Answer keys contain duplicates`);
                        }
                    });
                    options.forEach((option, index) => {
                        info.options[index] = {
                            key: index,
                            description: option,
                        };
                    });
                    break;
                }
                case QuestionType.TEXT: {
                    if (info.answerField === undefined) {
                        throw new Error(
                            `Question missing 'answerField' or 'answerField' is not a string`
                        );
                    }
                    if (info.matchCase === undefined) {
                        throw new Error(`Question missing 'matchCase'`);
                    }
                    break;
                }
                case QuestionType.NUMBER: {
                    if (info.answerField === undefined) {
                        throw new Error(
                            `Question missing 'answerField' or 'answerField' is not a string`
                        );
                    }
                    if (info.maximumError === undefined) {
                        throw new Error(`Question missing 'maximumError'`);
                    }
                    break;
                }
                default: {
                    throw new Error(
                        `type should be one of [${Object.values(
                            QuestionType
                        )}], received '${type}'`
                    );
                }
            }

            const result = await this.questionService.create(userId, info);
            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async getAll(req: Request, res: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );
            const canView = await canPerform(Permission.ADMIN_VIEW_QUESTION);
            if (!canView) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const query: FilterQuery<QuestionDocument> = {};

            if (req.query.subject) {
                query.subject = new Types.ObjectId(req.query.subject as string);
            }
            if (req.query.chapter) {
                query.chapter = new Types.ObjectId(req.query.chapter as string);
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

            if (req.query.pagination === "false") {
                const result = await this.questionService.getPopulated(query, [
                    "subject",
                    "chapter",
                ]);
                res.composer.success({
                    total: result.length,
                    result,
                });
            } else {
                const [total, result] = await this.questionService.getPaginated(
                    query,
                    ["subject", "chapter"],
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

    async delete(req: Request, res: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );
            const canDelete = await canPerform(
                Permission.ADMIN_DELETE_QUESTION
            );
            if (!canDelete) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const questionId = new Types.ObjectId(req.params.questionId);
            const question = await this.questionService.getById(questionId);

            if (!question) {
                throw new Error(`Question does not exist`);
            }

            // check if any quiz or exam that use this question
            const [quizWithThisQuestion] = await Promise.all([
                this.quizService.checkQuizWithQuestion(questionId),
            ]);

            if (quizWithThisQuestion) {
                throw new Error(
                    `There are quiz that contain this question. Please delete them first`
                );
            }

            const result = await this.questionService.markAsDeleted(questionId);
            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }
}
