export interface UploadValidatorStrategy {
    validate(files: Express.Multer.File[]): void;
}

export class NoUploadValidation implements UploadValidatorStrategy {
    validate(files: Express.Multer.File[]): void {
        console.log("empty validation");
    }
}

export class MaterialUploadValidation implements UploadValidatorStrategy {
    validate(files: Express.Multer.File[]): void {
        if (
            !files.some(
                (f) =>
                    f.originalname === "main.tex" && f.mimetype === "text/latex"
            )
        ) {
            throw new Error(
                `To upload LaTeX documents, a 'main.tex' file must be present`
            );
        }
    }
}

export class PreviousExamUploadValidation implements UploadValidatorStrategy {
    validate(files: Express.Multer.File[]): void {
        if (files.length != 1) {
            throw new Error(`Exactly one file is allowed for this operation`);
        }
        if (
            files[0].originalname != "main.pdf" ||
            files[0].mimetype != "application/pdf"
        ) {
            throw new Error(
                `The specified file must be of type 'pdf' and have the name 'main.pdf'`
            );
        }
    }
}
