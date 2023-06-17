import multer from "multer";

/**
 * Defines global file uploader object for multer
 * Maximum upload size is 50MB
 */

export const fileUploader = multer({
    storage: multer.memoryStorage(),
    limits: {
        fieldSize: 50 * 1024 * 1024,
    },
});
