import { inject, injectable } from "inversify";
import { Router } from "express";
import { Controller } from "./controller";
import { Request, Response, ServiceType } from "../types";
import {
    AccessLevelService,
    AuthService,
    QuestionTemplateService,
} from "../services/index";
import _ from "lodash";
import { logger } from "../lib/logger";
import { CharStream, CommonTokenStream } from "antlr4";
import QuestionGrammarVisitor from "../lib/question-generation/QuestionGrammarVisitor";
import GrammarParser from "../lib/question-generation/GrammarParser";
import GrammarLexer from "../lib/question-generation/GrammarLexer";
import mongoose, { Types } from "mongoose";
import { Permission } from "../models/access_level.model";
import { QuestionType } from "../models/question_template.model";

@injectable()
export class QuestionTemplateController extends Controller {
    public readonly router = Router();
    public readonly path = "/question_template/";

    constructor(
        @inject(ServiceType.Auth) private authService: AuthService,
        @inject(ServiceType.QuestionTemplate)
        private questionTemplateService: QuestionTemplateService,
        @inject(ServiceType.AccessLevel)
        private accessLevelService: AccessLevelService
    ) {
        super();

        this.router.all("*", authService.authenticate());

        this.router.post("/test_code", this.testCode.bind(this));
        this.router.post(
            "/test_concrete_question/:questionId",
            this.testConcreteQuestionGeneration.bind(this)
        );
        this.router.post("/", this.create.bind(this));
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
            const question = await this.questionTemplateService.findOne({
                _id: questionId,
            });
            const result =
                this.questionTemplateService.generateConcreteQuestion(question);
            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async create(req: Request, res: Response) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const userAccessLevels = req.tokenMeta?.accessLevels;

            if (
                !(await this.accessLevelService.accessLevelsCanPerformAction(
                    userAccessLevels,
                    Permission.CREATE_QUESTION_TEMPLATE,
                    req.tokenMeta.isManager
                ))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const userId = req.tokenMeta.userId;

            req.body = _.pick(req.body, ["description", "questions", "code"]);
            req.body.code = req.body.code || "";

            const questions: any[] = req.body.questions;
            if (!questions) {
                throw new Error(`Missing 'questions' field`);
            }

            for (let i = 0; i < questions.length; i++) {
                questions[i] = _.pick(questions[i], [
                    "questionType",
                    "description",
                    "options",
                    "answerKey",
                    "answerKeys",
                    "answerField",
                    "matchCase",
                    "maximumError",
                ]);
                if (!questions[i].description) {
                    throw new Error(`Missing description for question`);
                }
                const type = questions[i].questionType as QuestionType;
                switch (type) {
                    case QuestionType.MULTIPLE_CHOICE_SINGLE_ANSWER: {
                        const [options, answerKey] = [
                            questions[i].options as any[],
                            questions[i].answerKey as number,
                        ];
                        if (!options) {
                            throw new Error(
                                `Missing options for multiple choice, single answer question`
                            );
                        }
                        if (answerKey === undefined) {
                            throw new Error(
                                `Missing answer key for multiple choice, single answer question`
                            );
                        }
                        for (const opt of options) {
                            const [id, questionDescription] = [
                                opt.id as number,
                                opt.description as string,
                            ];
                            if (id === undefined || !questionDescription) {
                                throw new Error(
                                    `Missing id or description for one of the options for multiple choice, single answer question`
                                );
                            }
                        }
                        if (
                            new Set(options.map((x) => x.id)).size !==
                            options.length
                        ) {
                            throw new Error(`ID's of questions are not unique`);
                        }
                        break;
                    }
                    case QuestionType.MULTIPLE_CHOICE_MULTIPLE_ANSWERS: {
                        const [options, answerKeys] = [
                            questions[i].options as any[],
                            questions[i].answerKeys as number[],
                        ];
                        if (!options) {
                            throw new Error(
                                `Missing options for multiple choice, multiple answers question`
                            );
                        }
                        if (!answerKeys) {
                            throw new Error(
                                `Missing answer keys for multiple choice, multiple answers question`
                            );
                        }
                        for (const opt of options) {
                            const [id, questionDescription] = [
                                opt.id as number,
                                opt.description as string,
                            ];
                            if (id === undefined || !questionDescription) {
                                throw new Error(
                                    `Missing id or description for one of the options for multiple choice, multiple answers question`
                                );
                            }
                        }
                        if (
                            new Set(options.map((x) => x.id)).size !==
                            options.length
                        ) {
                            throw new Error(`ID's of questions are not unique`);
                        }
                        if (new Set(answerKeys).size !== answerKeys.length) {
                            throw new Error(`Answer keys are not unique`);
                        }
                        break;
                    }
                    case QuestionType.TEXT: {
                        if (
                            questions[i].answerField === undefined ||
                            typeof questions[i].answerField !== "string"
                        ) {
                            throw new Error(
                                `Question missing 'answerField' or 'answerField' is not a string`
                            );
                        }
                        if (questions[i].matchCase === undefined) {
                            throw new Error(`Question missing 'matchCase'`);
                        }
                        break;
                    }
                    case QuestionType.NUMBER: {
                        if (
                            questions[i].answerField === undefined ||
                            typeof questions[i].answerField !== "string"
                        ) {
                            throw new Error(
                                `Question missing 'answerField' or 'answerField' is not a string`
                            );
                        }
                        if (questions[i].maximumError === undefined) {
                            throw new Error(`Question missing 'maximumError'`);
                        }
                        break;
                    }
                    default: {
                        throw new Error(
                            `questionType should be one of [${Object.values(
                                QuestionType
                            )}], received '${type}'`
                        );
                    }
                }
            }

            const result = await this.questionTemplateService.create(
                userId,
                req.body
            );
            res.composer.success(result);
            await session.commitTransaction();
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            await session.abortTransaction();
            res.composer.badRequest(error.message);
        } finally {
            await session.endSession();
        }
    }
}
