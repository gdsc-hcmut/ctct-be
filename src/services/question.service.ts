import { injectable } from "inversify";
import { logger } from "../lib/logger";
import { FilterQuery, PopulateOptions, QueryOptions, Types } from "mongoose";
import QuestionModel, {
    ConcreteQuestion,
    QuestionDocument,
    QuestionType,
    UserAnswer,
} from "../models/question.model";
import { CharStream, CommonTokenStream } from "antlr4";
import GrammarLexer from "../lib/question-generation/GrammarLexer";
import GrammarParser from "../lib/question-generation/GrammarParser";
import QuestionGrammarVisitor from "../lib/question-generation/QuestionGrammarVisitor";
import Mustache from "mustache";
import _ from "lodash";
import { CreateQuestionDto } from "../lib/dto/create_question.dto";
import { PreviewQuestionDto } from "../lib/dto/index";

@injectable()
export class QuestionService {
    constructor() {
        logger.info("[Question] Initializing...");
    }

    async create(userId: Types.ObjectId, data: CreateQuestionDto) {
        /**
         * data should include metadata (as indicated by the model)
         * except createdBy and createdAt (automatically generated)
         */
        const now = Date.now();
        const options = data.options
            ? data.options.map((opt, index) => ({
                  key: index,
                  description: opt,
              }))
            : [];
        return (
            await QuestionModel.create([
                {
                    ..._.omit(data, "options"),
                    options: options,

                    createdAt: now,
                    createdBy: userId,
                    lastUpdatedAt: now,
                },
            ])
        )[0];
    }

    previewQuestion(question: PreviewQuestionDto) {
        const options = question.options
            ? question.options.map((opt, index) => ({
                  key: index,
                  description: opt,
              }))
            : [];
        const questionDocument = new QuestionModel({
            ..._.omit(question, "options"),
            options: options,
        });
        return this.generateConcreteQuestion(questionDocument, 0);
    }

    generateConcreteQuestion(question: QuestionDocument, questionId: number) {
        const charStream = new CharStream(question.code);
        const lexer = new GrammarLexer(charStream);
        const tokenStream = new CommonTokenStream(lexer);
        const parser = new GrammarParser(tokenStream);
        const visitor = new QuestionGrammarVisitor();

        visitor.visitProg(parser.prog());
        const symbols = Object.fromEntries(visitor.getSymbols());

        const result: ConcreteQuestion = {
            questionId,
            type: question.type,
            description: Mustache.render(question.description, symbols),
            explanation: Mustache.render(question.explanation, symbols),
            isCorrect: false,
            isFlagged: false,
            userNote: "",
        };

        switch (question.type) {
            case QuestionType.MULTIPLE_CHOICE_SINGLE_ANSWER: {
                let options = question.options.map((opt) => ({
                    description: Mustache.render(opt.description, symbols),
                    key: opt.key,
                }));

                if (question.shuffleOptions) {
                    options = _.shuffle(options);
                }

                result.options = options;
                result.answerKeys = question.answerKeys;
                break;
            }
            case QuestionType.MULTIPLE_CHOICE_MULTIPLE_ANSWERS: {
                let options = question.options.map((opt) => ({
                    description: Mustache.render(opt.description, symbols),
                    key: opt.key,
                }));

                if (question.shuffleOptions) {
                    options = _.shuffle(options);
                }

                result.options = options;
                result.answerKeys = question.answerKeys;
                break;
            }
            case QuestionType.NUMBER: {
                result.answerField = parseFloat(
                    Mustache.render(question.answerField, symbols)
                );
                result.maximumError = question.maximumError;
                break;
            }
            case QuestionType.TEXT: {
                result.answerField = Mustache.render(
                    question.answerField,
                    symbols
                );
                result.matchCase = question.matchCase;
                break;
            }
            default: {
                throw new Error(
                    `Unrecognized question option: ${question.type}`
                );
            }
        }

        return result;
    }

    /**
     * Checks if the saved answer of a question is correct, and updates
     * the question object accordingly
     */
    processQuestionAnswer(question: ConcreteQuestion) {
        switch (question.type) {
            case QuestionType.MULTIPLE_CHOICE_SINGLE_ANSWER: {
                if (question.userAnswerKeys !== undefined) {
                    question.isCorrect = _.isEqual(
                        question.userAnswerKeys.sort(),
                        question.answerKeys.sort()
                    );
                }
                break;
            }
            case QuestionType.MULTIPLE_CHOICE_MULTIPLE_ANSWERS: {
                if (question.userAnswerKeys !== undefined) {
                    question.isCorrect = _.isEqual(
                        question.userAnswerKeys.sort(),
                        question.answerKeys.sort()
                    );
                }
                break;
            }
            case QuestionType.NUMBER: {
                if (question.userAnswerField !== undefined) {
                    question.isCorrect =
                        Math.abs(
                            (question.userAnswerField as number) -
                                (question.answerField as number)
                        ) <= question.maximumError;
                }
                break;
            }
            case QuestionType.TEXT: {
                if (question.userAnswerField !== undefined) {
                    question.isCorrect = question.matchCase
                        ? (question.userAnswerField as string) ===
                          (question.answerField as string)
                        : (question.userAnswerField as string).toLowerCase() ===
                          (question.answerField as string).toLowerCase();
                }
                break;
            }
            default: {
                throw new Error(`Unrecognized question type: ${question.type}`);
            }
        }
    }

    /**
     * Attaches the user's answers to the question object
     */
    attachUserAnswerToQuestion(question: ConcreteQuestion, answer: UserAnswer) {
        switch (question.type) {
            case QuestionType.MULTIPLE_CHOICE_SINGLE_ANSWER: {
                if (answer.answerKeys !== undefined) {
                    question.userAnswerKeys = answer.answerKeys as number[];
                }
                break;
            }
            case QuestionType.MULTIPLE_CHOICE_MULTIPLE_ANSWERS: {
                if (answer.answerKeys !== undefined) {
                    question.userAnswerKeys = answer.answerKeys as number[];
                }
                break;
            }
            case QuestionType.NUMBER: {
                if (answer.answerField !== undefined) {
                    question.userAnswerField = answer.answerField as number;
                }
                break;
            }
            case QuestionType.TEXT: {
                if (answer.answerField !== undefined) {
                    question.userAnswerField = answer.answerField as string;
                }
                break;
            }
            default: {
                throw new Error(`Unrecognized question type: ${question.type}`);
            }
        }
    }

    async questionExists(questions: Types.ObjectId[]) {
        const result = await Promise.all(
            questions.map((question) =>
                (async () => {
                    return (
                        (await QuestionModel.findOne({
                            _id: question,
                            deletedAt: { $exists: false },
                        })) != null
                    );
                })()
            )
        );
        return _.every(result);
    }

    async markAsDeleted(
        id: Types.ObjectId,
        options: QueryOptions<QuestionDocument> = {}
    ) {
        return await QuestionModel.findOneAndUpdate(
            { _id: id },
            { deletedAt: Date.now() },
            { ...options, new: true }
        );
    }

    async getPaginated(
        query: FilterQuery<QuestionDocument>,
        populateOptions: PopulateOptions | (string | PopulateOptions)[],
        pageSize: number,
        pageNumber: number
    ) {
        return await Promise.all([
            QuestionModel.count({
                ...query,
                deletedAt: { $exists: false },
            }),
            QuestionModel.find({
                ...query,
                deletedAt: { $exists: false },
            })
                .skip(Math.max(pageSize * (pageNumber - 1), 0))
                .limit(pageSize)
                .populate(populateOptions),
        ]);
    }

    async getPopulated(
        query: FilterQuery<QuestionDocument>,
        populateOptions: PopulateOptions | (string | PopulateOptions)[]
    ) {
        return await QuestionModel.find({
            ...query,
            deletedAt: { $exists: false },
        }).populate(populateOptions);
    }

    async getById(id: Types.ObjectId) {
        return await QuestionModel.findOne({
            _id: id,
            deletedAt: { $exists: false },
        });
    }

    async getByIdPopulated(
        id: Types.ObjectId,
        populateOptions: PopulateOptions | (string | PopulateOptions)[]
    ) {
        return await QuestionModel.findOne({
            _id: id,
            deletedAt: { $exists: false },
        }).populate(populateOptions);
    }

    async questionWithSubjectExists(subjectId: Types.ObjectId) {
        return (
            (await QuestionModel.findOne({
                subject: subjectId,
                deletedAt: { $exists: false },
            })) != null
        );
    }

    async questionWithChapterExists(chapterId: Types.ObjectId) {
        return (
            (await QuestionModel.findOne({
                chapter: chapterId,
                deletedAt: { $exists: false },
            })) != null
        );
    }
}
