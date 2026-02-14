'use server';

import { redirect } from 'next/navigation';
import { bookingSchema } from '@/lib/schemas';
import { BookingError, createBooking } from '@/lib/booking-service';

export async function submitBooking(formData: FormData) {
  const parsed = bookingSchema.safeParse({
    timeSlotId: formData.get('timeSlotId'),
    name: formData.get('name'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    note: formData.get('note'),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? '資料格式錯誤');
  }

  try {
    const booking = await createBooking(parsed.data);
    redirect(`/booking/success?bookingId=${booking.id}`);
  } catch (error) {
    if (error instanceof BookingError) {
      redirect(`/courses?error=${encodeURIComponent(error.message)}`);
    }
    throw error;
  }
}
