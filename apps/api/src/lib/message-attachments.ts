import crypto from "node:crypto";
import path from "node:path";
import { MessageAttachmentCategory } from "@prisma/client";
import { env } from "../config/env";

export const MAX_ATTACHMENTS_PER_MESSAGE = 8;
export const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;

const MESSAGE_ATTACHMENT_ALGORITHM = "aes-256-gcm";
const MESSAGE_ATTACHMENT_IV_LENGTH = 12;
const MESSAGE_ATTACHMENT_KEY = crypto.scryptSync(
  env.ATTACHMENTS_ENCRYPTION_KEY ?? env.JWT_SECRET,
  "oxlis-message-attachments",
  32,
);

const extensionMimeTypeMap = new Map<string, string>([
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".gif", "image/gif"],
  [".webp", "image/webp"],
  [".svg", "image/svg+xml"],
  [".mp4", "video/mp4"],
  [".mov", "video/quicktime"],
  [".webm", "video/webm"],
  [".avi", "video/x-msvideo"],
  [".mp3", "audio/mpeg"],
  [".wav", "audio/wav"],
  [".m4a", "audio/mp4"],
  [".ogg", "audio/ogg"],
  [".pdf", "application/pdf"],
  [".txt", "text/plain"],
  [".csv", "text/csv"],
  [".rtf", "application/rtf"],
  [".json", "application/json"],
  [".xml", "application/xml"],
  [".zip", "application/zip"],
  [".doc", "application/msword"],
  [".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  [".xls", "application/vnd.ms-excel"],
  [".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  [".ppt", "application/vnd.ms-powerpoint"],
  [".pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  [".odt", "application/vnd.oasis.opendocument.text"],
  [".ods", "application/vnd.oasis.opendocument.spreadsheet"],
  [".odp", "application/vnd.oasis.opendocument.presentation"],
]);

const supportedDocumentMimeTypes = new Set<string>([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/vnd.oasis.opendocument.presentation",
  "application/rtf",
  "application/json",
  "application/xml",
  "application/zip",
  "application/x-zip-compressed",
  "text/plain",
  "text/csv",
]);

function normalizeMimeType(mimeType: string, originalName: string) {
  const normalizedMimeType = mimeType.toLowerCase().trim();

  if (normalizedMimeType && normalizedMimeType !== "application/octet-stream") {
    return normalizedMimeType;
  }

  return extensionMimeTypeMap.get(path.extname(originalName).toLowerCase()) ?? normalizedMimeType;
}

export function resolveMessageAttachmentType(mimeType: string, originalName: string) {
  const resolvedMimeType = normalizeMimeType(mimeType, originalName);

  if (!resolvedMimeType) {
    return null;
  }

  if (resolvedMimeType.startsWith("image/")) {
    return { category: MessageAttachmentCategory.IMAGE, mimeType: resolvedMimeType };
  }

  if (resolvedMimeType.startsWith("video/")) {
    return { category: MessageAttachmentCategory.VIDEO, mimeType: resolvedMimeType };
  }

  if (resolvedMimeType.startsWith("audio/")) {
    return { category: MessageAttachmentCategory.AUDIO, mimeType: resolvedMimeType };
  }

  if (supportedDocumentMimeTypes.has(resolvedMimeType) || resolvedMimeType.startsWith("text/")) {
    return { category: MessageAttachmentCategory.DOCUMENT, mimeType: resolvedMimeType };
  }

  return null;
}

export function sanitizeMessageAttachmentName(originalName: string) {
  const sanitized = path.basename(originalName || "piece-jointe")
    .replace(/[\\/]+/g, "_")
    .replace(/\0/g, "")
    .trim();

  return sanitized || "piece-jointe";
}

export function encryptMessageAttachment(buffer: Buffer) {
  const iv = crypto.randomBytes(MESSAGE_ATTACHMENT_IV_LENGTH);
  const cipher = crypto.createCipheriv(MESSAGE_ATTACHMENT_ALGORITHM, MESSAGE_ATTACHMENT_KEY, iv);
  const blob = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    algorithm: MESSAGE_ATTACHMENT_ALGORITHM,
    iv,
    authTag,
    blob,
    contentSha256: crypto.createHash("sha256").update(buffer).digest("hex"),
  };
}

export function decryptMessageAttachment(payload: {
  algorithm: string;
  blob: Buffer;
  iv: Buffer;
  authTag: Buffer;
}) {
  const decipher = crypto.createDecipheriv(payload.algorithm, MESSAGE_ATTACHMENT_KEY, payload.iv) as crypto.DecipherGCM;
  decipher.setAuthTag(payload.authTag);

  return Buffer.concat([decipher.update(payload.blob), decipher.final()]);
}