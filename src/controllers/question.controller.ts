import { Router } from "express";
import { Controller } from "./controller";
import { injectable } from "inversify";

@injectable()
export class QuestionController extends Controller {
    public readonly router = Router();
    public readonly path = "/question";

    constructor() {
        super();
    }
}
