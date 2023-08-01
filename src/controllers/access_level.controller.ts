import { inject, injectable } from "inversify";
import { Router } from "express";
import {
    AccessLevelService,
    AuthService,
    UserService,
} from "../services/index";
import { Controller } from "./controller";
import { ServiceType } from "../types";

@injectable()
export class AccessLevelController extends Controller {
    public readonly router = Router();
    public readonly path = "/access_level";

    constructor(
        @inject(ServiceType.Auth) private authService: AuthService,
        @inject(ServiceType.AccessLevel)
        private accessLevelService: AccessLevelService,
        @inject(ServiceType.User) private userService: UserService
    ) {
        super();
    }
}
