import { BookingStatus, Prisma, SlotStatus } from '@prisma/client';
import { prisma } from './prisma';

export class BookingError extends Error {}

export type TxClient = Pick<Prisma.TransactionClient, 'timeSlot' | 'booking'>;

export async function createBookingTx(
  tx: TxClient,
  input: {
    timeSlotId: string;
    name: string;
    phone: string;
    email: string;
    note?: string;
  },
) {
  const slot = await tx.timeSlot.findUnique({ where: { id: input.timeSlotId } });
  if (!slot || slot.status !== SlotStatus.OPEN) {
    throw new BookingError('時段不可預約');
  }
  if (slot.bookedCount >= slot.capacity) {
    throw new BookingError('名額已滿');
  }

  const booking = await tx.booking.create({
    data: {
      timeSlotId: slot.id,
      name: input.name,
      phone: input.phone,
      email: input.email,
      note: input.note,
      status: BookingStatus.ACTIVE,
    },
  });

  await tx.timeSlot.update({
    where: { id: slot.id },
    data: { bookedCount: { increment: 1 } },
  });

  return booking;
}

export async function cancelBookingTx(tx: TxClient, bookingId: string) {
  const booking = await tx.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.status === BookingStatus.CANCELED) {
    return null;
  }

  await tx.booking.update({ where: { id: bookingId }, data: { status: BookingStatus.CANCELED } });
  await tx.timeSlot.update({
    where: { id: booking.timeSlotId },
    data: { bookedCount: { decrement: 1 } },
  });

  return booking;
}

export async function createBooking(input: {
  timeSlotId: string;
  name: string;
  phone: string;
  email: string;
  note?: string;
}) {
  return prisma.$transaction((tx) => createBookingTx(tx, input), {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  });
}

export async function cancelBooking(bookingId: string) {
  return prisma.$transaction((tx) => cancelBookingTx(tx, bookingId));
}
