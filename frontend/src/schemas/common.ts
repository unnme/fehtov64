import { z } from "zod";

/**
 * Common validation schemas and utilities for forms.
 */

/**
 * Normalizes string by trimming whitespace.
 */
export const normalizeString = (value: string) => value.trim();

/**
 * Email validation schema.
 */
export const emailSchema = z
  .email({ message: "Неверный email" })
  .transform(normalizeString);

/**
 * Optional email validation schema (empty string is valid).
 */
export const optionalEmailSchema = z
  .string()
  .default("")
  .refine((value) => !value || z.email().safeParse(value).success, {
    message: "Неверный формат email",
  })
  .transform((value) => (value ? normalizeString(value) : ""));

/**
 * Required string schema with min length.
 */
export const requiredStringSchema = (minLength = 1, message?: string) =>
  z
    .string()
    .min(minLength, { message: message || `Минимум ${minLength} символ(ов)` })
    .transform(normalizeString);

/**
 * Optional string schema that normalizes to undefined if empty.
 */
export const optionalStringSchema = z
  .string()
  .optional()
  .transform((value) => {
    if (!value) return undefined;
    const trimmed = String(value).trim();
    return trimmed || undefined;
  });

/**
 * Optional link schema (URL) that normalizes to undefined if empty.
 */
export const optionalLinkSchema = z
  .string()
  .transform((value) => {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  })
  .optional();

/**
 * Password schema with minimum length validation.
 */
export const passwordSchema = z
  .string()
  .min(1, { message: "Пароль обязателен" })
  .min(8, { message: "Минимум 8 символов" });

/**
 * UUID string schema.
 */
export const uuidSchema = z.uuid({ message: "Неверный формат UUID" });
