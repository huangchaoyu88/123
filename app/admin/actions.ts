'use server';

import { redirect } from 'next/navigation';
import { loginAdmin, logoutAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { cancelBooking } from '@/lib/booking-service';
import { courseSchema, timeSlotBatchSchema } from '@/lib/schemas';

export async function adminLoginAction(formData: FormData) {
  const password = String(formData.get('password') ?? '');
  const ok = loginAdmin(password);
  if (!ok) {
    redirect('/admin?error=密碼錯誤');
  }
  redirect('/admin/courses');
}

export async function adminLogoutAction() {
  logoutAdmin();
  redirect('/admin');
}

export async function createCourseAction(formData: FormData) {
  const parsed = courseSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    durationMinutes: formData.get('durationMinutes'),
    price: formData.get('price'),
    isActive: formData.get('isActive') === 'on',
  });
  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message ?? 'invalid');
  await prisma.course.create({ data: parsed.data });
  redirect('/admin/courses');
}

export async function updateCourseAction(formData: FormData) {
  const id = String(formData.get('id'));
  const parsed = courseSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    durationMinutes: formData.get('durationMinutes'),
    price: formData.get('price'),
    isActive: formData.get('isActive') === 'on',
  });
  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message ?? 'invalid');
  await prisma.course.update({ where: { id }, data: parsed.data });
  redirect('/admin/courses');
}

export async function createTimeSlotBatchAction(formData: FormData) {
  const parsed = timeSlotBatchSchema.safeParse({
    courseId: formData.get('courseId'),
    teacherId: formData.get('teacherId'),
    startDate: formData.get('startDate'),
    days: formData.get('days'),
    hour: formData.get('hour'),
    minute: formData.get('minute'),
    capacity: formData.get('capacity'),
  });

  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message ?? 'invalid');

  const start = new Date(`${parsed.data.startDate}T00:00:00+08:00`);
  const entries = Array.from({ length: parsed.data.days }).map((_, i) => {
    const dt = new Date(start);
    dt.setUTCDate(dt.getUTCDate() + i);
    dt.setUTCHours(parsed.data.hour - 8, parsed.data.minute, 0, 0);
    return {
      courseId: parsed.data.courseId,
      teacherId: parsed.data.teacherId,
      startTime: dt,
      capacity: parsed.data.capacity,
      bookedCount: 0,
      status: 'OPEN' as const,
    };
  });

  await prisma.timeSlot.createMany({ data: entries });
  redirect('/admin/timeslots');
}

export async function updateTimeSlotAction(formData: FormData) {
  const id = String(formData.get('id'));
  const capacity = Number(formData.get('capacity'));
  const status = String(formData.get('status')) as 'OPEN' | 'CLOSED';

  await prisma.timeSlot.update({ where: { id }, data: { capacity, status } });
  redirect('/admin/timeslots');
}

export async function cancelBookingAction(formData: FormData) {
  const id = String(formData.get('id'));
  await cancelBooking(id);
  redirect('/admin/bookings');
}
