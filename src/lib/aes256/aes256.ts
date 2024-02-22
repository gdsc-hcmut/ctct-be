import * as crypto from "crypto";

export function aes256Encrypt(data: string, key: string) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    const encrypted = cipher.update(data);
    return (
        iv.toString("hex") +
        ":" +
        Buffer.concat([encrypted, cipher.final()]).toString("hex")
    );
}

export function aes256Decrypt(data: string, key: string) {
    const [iv, encrypted] = data.split(":");
    const decipher = crypto.createDecipheriv(
        "aes-256-cbc",
        key,
        Buffer.from(iv, "hex")
    );
    const decrypted = decipher.update(Buffer.from(encrypted, "hex"));
    return Buffer.concat([decrypted, decipher.final()]).toString();
}
