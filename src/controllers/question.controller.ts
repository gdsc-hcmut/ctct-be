import { inject, injectable } from "inversify";
import { Router } from "express";
import { Controller } from "./controller";
import { Request, Response, ServiceType } from "../types";
import { AuthService } from "../services/index";
import _ from "lodash";
import { logger } from "../lib/logger";
import { CharStream, CommonTokenStream } from "antlr4";
import QuestionGrammarVisitor from "../lib/question-generation/QuestionGrammarVisitor";
import GrammarParser from "../lib/question-generation/GrammarParser";
import GrammarLexer from "../lib/question-generation/GrammarLexer";

@injectable()
export class QuestionController extends Controller {
    public readonly router = Router();
    public readonly path = "/question";

    constructor(@inject(ServiceType.Auth) private authService: AuthService) {
        super();

        this.router.all("*", authService.authenticate());

        this.router.post("/test_code", this.testCode.bind(this));
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
}
