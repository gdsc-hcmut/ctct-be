import { injectable } from "inversify";
import crypto from "crypto";
import passport from "passport";
import {
    Strategy,
    ExtractJwt,
    StrategyOptions,
    VerifiedCallback,
} from "passport-jwt";
import jwt from "jwt-simple";
import { NextFunction } from "express";
import _ from "lodash";
import bcrypt from "bcryptjs";
import moment from "moment";
import User, { UserDocument } from "../models/user.model";
import { parseTokenMeta } from "../models/token.model";

import { Request, Response, ServiceType } from "../types";

import { UserService } from "./user.service";
import Token from "../models/token.model";
import { lazyInject } from "../container";
import mongoose from "mongoose";

@injectable()
export class AuthService {
    @lazyInject(ServiceType.User) private userService: UserService;
    constructor() {
        console.log("[Auth Service] Construct");
    }

    applyMiddleware() {
        const options: StrategyOptions = {
            secretOrKey: process.env.JWT_SECRET,
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        };
        const strategyJwt = new Strategy(
            options,
            this.verifyAccountCode.bind(this)
        );
        passport.use(strategyJwt);
        passport.serializeUser((user: UserDocument, done) => {
            done(null, user.id);
        });

        passport.deserializeUser(async (id, done) => {
            const user: UserDocument = await User.findById(id);
            done(null, user);
        });

        return passport.initialize();
    }

    async verifyAccountCode(payload: any, done: VerifiedCallback) {
        const tokenMeta = parseTokenMeta(payload);

        try {
            const token = await Token.findOne({
                _id: tokenMeta._id,
            });
            if (token) {
                return done(null, tokenMeta);
            }

            return done(null, false, "Invalid token");
        } catch (error) {
            done(error, null);
        }
    }

    authenticate(block = true) {
        return (req: Request, res: Response, next: NextFunction) => {
            try {
                passport.authenticate("jwt", async (err, tokenMeta, info) => {
                    req.tokenMeta = tokenMeta;
                    if (block && _.isEmpty(tokenMeta)) {
                        res.composer.unauthorized();
                        return;
                    }

                    next();
                })(req, res, next);
            } catch (err: any) {
                console.log(err);
            }
        };
    }

    private async createToken(
        userId: mongoose.Types.ObjectId,
        userAgent: string
    ) {
        const result = await Token.create({
            userId: userId,
            createdAt: moment().unix(),
            expiredAt: moment().unix() + process.env.TOKEN_TTL,

            userAgent: userAgent,
        });
        const EncodeToken = jwt.encode(
            {
                _id: result._id,
                userAgent,
                userId,
                createdAt: moment().unix(),
                expiredAt: moment().unix() + process.env.TOKEN_TTL,
            },
            process.env.JWT_SECRET
        );

        // const createdToken = result.ops[0] as TokenDocument;
        return EncodeToken;
    }

    async generateTokenUsingUsername(
        username: string,
        password: string,
        userAgent: string
    ) {
        if (!username || !password) {
            throw new Error("missing input field");
        }
        const user = await this.userService.findOne({ username: username });
        if (!user) {
            throw new Error(`No user matches the given username`);
        }

        if (!(await bcrypt.compare(password, user.password))) {
            throw new Error(`Wrong password`);
        }

        return await this.createToken(user._id, userAgent);
    }

    async recoverPasswordRequest(email: string) {
        let user = null;
        try {
            user = await this.userService.findOne({ email }, true);
        } catch (err) {
            throw new Error(
                `The email address that you've entered doesn't match any account.`
            );
        }

        const recoverPasswordCode = crypto.randomBytes(20).toString("hex");

        await this.userService.updateOne(user._id, {
            recoverPasswordCode,
            recoverPasswordExpires: moment().add(2, "hours").unix(),
        });
    }

    async recoverPassword(recoverPasswordCode: string, newPassword: string) {
        let user = null;
        try {
            user = await this.userService.findOne(
                { recoverPasswordCode },
                true
            );
        } catch (err) {
            throw new Error(
                `The email address that you've entered doesn't match any account.`
            );
        }
        newPassword = await bcrypt.hash(newPassword, process.env.HASH_ROUNDS);

        await this.userService.updateOne(user._id, {
            password: newPassword,
            recoverPasswordCode: null,
            recoverPasswordExpires: 0,
        });
    }
}
