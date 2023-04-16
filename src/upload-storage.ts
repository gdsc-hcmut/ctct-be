import multer from "multer";

/**
 * Defines global file uploader object for multer
 */

export const fileUploader = multer({ storage: multer.memoryStorage() });
