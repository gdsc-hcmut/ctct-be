import { inject, injectable } from "inversify";
import { Router } from "express";
import { Controller } from "./controller";
import { Request, Response, ServiceType } from "../types";
import { AuthService } from "../services";
import { SubjectService } from "../services/subject.service";
import { userMayCreateSubject } from "../models/user.model";

@injectable()
export class SubjectController extends Controller {
    public readonly router = Router();
    public readonly path = "/subject";

    constructor(
        @inject(ServiceType.Auth) private authService: AuthService,
        @inject(ServiceType.Subject) private subjectService: SubjectService
    ) {
        super();
        this.router.all("*", this.authService.authenticate());

        // My profile
        this.router.post("/", this.create.bind(this));
        this.router.get("/all", this.getAllSubjects.bind(this));
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
}
