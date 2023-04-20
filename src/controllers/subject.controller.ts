import { inject, injectable } from "inversify";
import { Router } from "express";
import { Controller } from "./controller";
import { Request, Response, ServiceType } from "../types";
import { AuthService } from "../services";
import { SubjectService } from "../services/subject.service";
import { MaterialService } from "../services/material.service";
import { PreviousExamService } from "../services/previous-exams.service";
import { userMayCreateSubject } from "../models/user.model";
import { Types } from "mongoose";

@injectable()
export class SubjectController extends Controller {
    public readonly router = Router();
    public readonly path = "/subject";

    constructor(
        @inject(ServiceType.Auth) private authService: AuthService,
        @inject(ServiceType.Subject) private subjectService: SubjectService,
        @inject(ServiceType.Material) private materialService: MaterialService,
        @inject(ServiceType.PreviousExam)
        private previousExamService: PreviousExamService
    ) {
        super();
        this.router.all("*", this.authService.authenticate());

        // My profile
        this.router.post("/", this.create.bind(this));
        this.router.get("/all", this.getAllSubjects.bind(this));
        this.router.delete("/delete/:docId", this.deleteOne.bind(this));
    }

    async create(req: Request, res: Response) {
        try {
            const { userId } = req.tokenMeta;
            const { name } = req.body;
            if (!userMayCreateSubject(req.tokenMeta.role)) {
                throw new Error(
                    `You don't have the permission to perform this action`
                );
            }
            if (!name) {
                throw new Error(`Missing 'name' field`);
            }

            const doc = await this.subjectService.create(name, userId);
            res.composer.success(doc);
        } catch (error) {
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async getAllSubjects(req: Request, res: Response) {
        try {
            const ans = await this.subjectService.find({});
            res.composer.success(ans);
        } catch (error) {
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async deleteOne(req: Request, res: Response) {
        try {
            const docId = new Types.ObjectId(req.params.docId);
            const sub = await this.subjectService.findOne({
                _id: docId,
                writeAccess: req.tokenMeta.role,
            });
            if (!sub) {
                throw new Error(`Subject doesn't exist`);
            }

            // there must be no material and prev exams that have this subject
            const ans = await Promise.all([
                this.materialService.findOne({ subject: docId }),
                this.previousExamService.findOne({ subject: docId }),
            ]);
            if (ans[0] || ans[1]) {
                throw new Error(
                    `There is still a material or previous exam that has this subject, please delete them first`
                );
            }
            await this.subjectService.findOneAndDelete({ _id: docId });
            res.composer.success(true);
        } catch (error) {
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }
}
