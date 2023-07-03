import { injectable } from "inversify";
import { logger } from "../lib/logger";
import { FilterQuery, Types } from "mongoose";
import QuestionTemplateModel, {
    ConcreteQuestion,
    QuestionTemplateDocument,
    QuestionType,
} from "../models/question_template.model";
import { CharStream, CommonTokenStream } from "antlr4";
import GrammarLexer from "../lib/question-generation/GrammarLexer";
import GrammarParser from "../lib/question-generation/GrammarParser";
import QuestionGrammarVisitor from "../lib/question-generation/QuestionGrammarVisitor";
import Mustache from "mustache";
import _ from "lodash";

@injectable()
export class QuestionTemplateService {
    constructor() {
        logger.info("Constructing Question Template service");
    }

    async create(userId: Types.ObjectId, data: any) {
        /**
         * data should include metadata (as indicated by the model)
         * except createdBy and createdAt (automatically generated)
         */
        return await QuestionTemplateModel.create({
            ...data,
            createdAt: Date.now(),
            createdBy: userId,
        });
    }

    generateConcreteQuestion(questionTemplate: QuestionTemplateDocument) {
        const result: ConcreteQuestion = {
            questions: [],
            hasAnswered: false,
        };

        const charStream = new CharStream(questionTemplate.code);
        const lexer = new GrammarLexer(charStream);
        const tokenStream = new CommonTokenStream(lexer);
        const parser = new GrammarParser(tokenStream);
        const visitor = new QuestionGrammarVisitor();

        visitor.visitProg(parser.prog());
        const symbols = Object.fromEntries(visitor.getSymbols());

        if (questionTemplate.description !== undefined) {
            result.description = Mustache.render(
                questionTemplate.description,
                symbols
            );
        }

        for (const question of questionTemplate.questions) {
            switch (question.questionType) {
                case QuestionType.MULTIPLE_CHOICE_SINGLE_ANSWER: {
                    result.questions.push({
                        questionType: question.questionType,
                        description: Mustache.render(
                            question.description,
                            symbols
                        ),
                        options: _.shuffle(
                            question.options.map((opt) => ({
                                description: Mustache.render(
                                    opt.description,
                                    symbols
                                ),
                                key: opt.key,
                            }))
                        ),
                        answerKey: question.answerKey,
                        explanation: Mustache.render(
                            question.explanation,
                            symbols
                        ),
                        isCorrect: false,
                    });
                    break;
                }
                case QuestionType.MULTIPLE_CHOICE_MULTIPLE_ANSWERS: {
                    result.questions.push({
                        questionType: question.questionType,
                        description: Mustache.render(
                            question.description,
                            symbols
                        ),
                        options: _.shuffle(
                            question.options.map((opt) => ({
                                description: Mustache.render(
                                    opt.description,
                                    symbols
                                ),
                                key: opt.key,
                            }))
                        ),
                        answerKeys: question.answerKeys,
                        explanation: Mustache.render(
                            question.explanation,
                            symbols
                        ),
                        isCorrect: false,
                    });
                    break;
                }
                case QuestionType.NUMBER: {
                    result.questions.push({
                        questionType: question.questionType,
                        description: Mustache.render(
                            question.description,
                            symbols
                        ),
                        answerField: parseFloat(
                            Mustache.render(question.answerField, symbols)
                        ),
                        maximumError: question.maximumError,
                        explanation: Mustache.render(
                            question.explanation,
                            symbols
                        ),
                        isCorrect: false,
                    });
                    break;
                }
                case QuestionType.TEXT: {
                    result.questions.push({
                        questionType: question.questionType,
                        description: Mustache.render(
                            question.description,
                            symbols
                        ),
                        answerField: Mustache.render(
                            question.answerField,
                            symbols
                        ),
                        matchCase: question.matchCase,
                        explanation: Mustache.render(
                            question.explanation,
                            symbols
                        ),
                        isCorrect: false,
                    });
                    break;
                }
                default: {
                    throw new Error(
                        `Unrecognized question option: ${question.questionType}`
                    );
                }
            }
        }

        return result;
    }

    maskAnswerFromConcreteQuestion(concreteQuestion: ConcreteQuestion) {
        const result = { ...concreteQuestion };
        result.questions = result.questions.map((question) =>
            _.omit(question, [
                "answerKey",
                "answerKeys",
                "answerField",
                "explanation",
            ])
        );
        return result;
    }

    async questionTemplatesExist(questions: Types.ObjectId[]) {
        const result = await Promise.all(
            questions.map((question) =>
                (async () => {
                    return (
                        (await QuestionTemplateModel.findById(question)) != null
                    );
                })()
            )
        );
        return result.every((x) => x);
    }

    async findOne(query: FilterQuery<QuestionTemplateDocument>) {
        return QuestionTemplateModel.findOne(query);
    }

    async deleteOne(query: FilterQuery<QuestionTemplateDocument>) {
        return await QuestionTemplateModel.deleteOne(query);
    }

    async findOneAndDelete(query: FilterQuery<QuestionTemplateDocument>) {
        return await QuestionTemplateModel.findOneAndDelete(query);
    }

    async find(query: FilterQuery<QuestionTemplateDocument>) {
        return await QuestionTemplateModel.find(query);
    }
}
