import { z } from "zod";

export const signUpSchema = z.object({
  fullName: z.string().min(1, { message: 'FullName is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  universityId: z.coerce.number(),
  universityCard: z.string().nonempty("University card is required"),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long' }),
});

export const signInSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long' }),
});

export const bookSchema = z.object({
  title: z.string().trim().min(2).max(100),
  description: z.string().trim().min(10).max(1000),
  author: z.string().trim().min(2).max(100),
  genre: z.string().trim().min(2).max(50),
  rating: z.number().min(1).max(5),
  totalCopies: z.coerce.number().int().positive().lte(10000),
  coverUrl: z.string().nonempty(),
  coverColor: z
    .string()
    .trim()
    .regex(/^[0-9A-F]{6}$/i), //16進数のカラーコード形式
  videoUrl: z.string().nonempty(),
  summary: z.string().trim().min(10),
});
