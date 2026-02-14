import { z } from 'zod';

export const bookingSchema = z.object({
  timeSlotId: z.string().min(1),
  name: z.string().min(2).max(40),
  phone: z.string().min(6).max(20),
  email: z.string().email(),
  note: z.string().max(300).optional().or(z.literal('')),
});

export const courseSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().min(1).max(1000),
  durationMinutes: z.coerce.number().int().min(1).max(480),
  price: z.coerce.number().int().min(0),
  isActive: z.coerce.boolean(),
});

export const timeSlotBatchSchema = z.object({
  courseId: z.string().min(1),
  teacherId: z.string().min(1),
  startDate: z.string().min(1),
  days: z.coerce.number().int().min(1).max(30),
  hour: z.coerce.number().int().min(0).max(23),
  minute: z.coerce.number().int().min(0).max(59),
  capacity: z.coerce.number().int().min(1).max(100),
});
