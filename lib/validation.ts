import { z } from 'zod';

export const uuidSchema = z.string().uuid('المعرّف غير صالح');
// Older installations use integer story IDs; newer installations use UUIDs.
export const entityIdSchema = z.union([uuidSchema, z.string().regex(/^[1-9]\d{0,18}$/, 'المعرّف غير صالح')]);
export const postContentSchema = z.string().trim().min(1, 'اكتب محتوى المنشور').max(2000, 'الحد الأقصى 2000 حرف');
export const commentContentSchema = z.string().trim().min(1, 'اكتب التعليق').max(500, 'الحد الأقصى 500 حرف');
export const reportReasonSchema = z.string().trim().min(3, 'وضح سبب الإبلاغ').max(500, 'الحد الأقصى 500 حرف');
export const usernameSchema = z.string().trim().min(1).max(80);

export function parseInput<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw new Error(result.error.issues[0]?.message || 'البيانات غير صالحة');
  return result.data;
}
