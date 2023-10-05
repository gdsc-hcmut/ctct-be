import { Router } from "express";
import { injectable } from "inversify";
import { Controller } from "../controller";
import container from "../../container";
import { AdminMaterialController } from "./material.controller";
import { AdminAccessLevelController } from "./access_level.controller";
import { AdminPreviousExamController } from "./previous_exam.controller";
import { AdminChapterController } from "./chapter.controller";
import { AdminSubjectController } from "./subject.controller";
import { AdminQuestionController } from "./question.controller";
import { AdminQuizController } from "./quiz.controller";
import { AdminExamController } from "./exam.controller";

@injectable()
export class AdminController extends Controller {
    public readonly router = Router();
    public readonly path = "/admin";

    private SUBROUTES: Controller[] = [
        container.resolve<AdminAccessLevelController>(
            AdminAccessLevelController
        ),
        container.resolve<AdminSubjectController>(AdminSubjectController),
        container.resolve<AdminChapterController>(AdminChapterController),
        container.resolve<AdminMaterialController>(AdminMaterialController),
        container.resolve<AdminPreviousExamController>(
            AdminPreviousExamController
        ),
        container.resolve<AdminQuestionController>(AdminQuestionController),
        container.resolve<AdminQuizController>(AdminQuizController),
        container.resolve<AdminExamController>(AdminExamController),
    ];

    constructor() {
        super();

        this.SUBROUTES.forEach((controller) => {
            this.router.use(controller.path, controller.router);
        });
    }
}
