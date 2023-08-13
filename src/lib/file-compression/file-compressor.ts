import { FileCompressionStrategy } from "./strategies";
import express from "express";
import multer from "multer";

class FileCompressor {
    private strategy: FileCompressionStrategy;

    constructor(s: FileCompressionStrategy) {
        this.strategy = s;
    }

    public setStrategy(s: FileCompressionStrategy) {
        this.strategy = s;
    }

    async compress(file: Express.Multer.File): Promise<Buffer> {
        return await this.strategy.compress(file);
    }
}
