import { describe, expect, it } from 'vitest';
import { BookingStatus, SlotStatus } from '@prisma/client';
import { BookingError, cancelBookingTx, createBookingTx } from '@/lib/booking-service';

function createFakeTx(slotSeed: { capacity: number; bookedCount: number; status?: SlotStatus }) {
  let slot = {
    id: 'slot_1',
    courseId: 'course_1',
    teacherId: 'teacher_1',
    startTime: new Date(),
    capacity: slotSeed.capacity,
    bookedCount: slotSeed.bookedCount,
    status: slotSeed.status ?? SlotStatus.OPEN,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const bookings = new Map<string, any>();

  return {
    tx: {
      timeSlot: {
        findUnique: async ({ where: { id } }: any) => (id === slot.id ? slot : null),
        update: async ({ data }: any) => {
          if (data.bookedCount?.increment) slot = { ...slot, bookedCount: slot.bookedCount + data.bookedCount.increment };
          if (data.bookedCount?.decrement) slot = { ...slot, bookedCount: slot.bookedCount - data.bookedCount.decrement };
          return slot;
        },
      },
      booking: {
        create: async ({ data }: any) => {
          const b = { id: `booking_${bookings.size + 1}`, ...data, createdAt: new Date(), updatedAt: new Date() };
          bookings.set(b.id, b);
          return b;
        },
        findUnique: async ({ where: { id } }: any) => bookings.get(id) ?? null,
        update: async ({ where: { id }, data }: any) => {
          const current = bookings.get(id);
          const next = { ...current, ...data };
          bookings.set(id, next);
          return next;
        },
      },
    },
    getSlot: () => slot,
    getBooking: (id: string) => bookings.get(id),
  };
}

describe('booking-service transaction logic', () => {
  it('rejects booking when capacity is full', async () => {
    const fake = createFakeTx({ capacity: 1, bookedCount: 1 });

    await expect(
      createBookingTx(fake.tx as any, {
        timeSlotId: 'slot_1',
        name: 'Amy',
        phone: '123456',
        email: 'amy@example.com',
      }),
    ).rejects.toThrow(BookingError);
  });

  it('cancel booking releases seat', async () => {
    const fake = createFakeTx({ capacity: 2, bookedCount: 0 });
    const booking = await createBookingTx(fake.tx as any, {
      timeSlotId: 'slot_1',
      name: 'Bob',
      phone: '999999',
      email: 'bob@example.com',
    });

    expect(fake.getSlot().bookedCount).toBe(1);

    await cancelBookingTx(fake.tx as any, booking.id);
    expect(fake.getSlot().bookedCount).toBe(0);
    expect(fake.getBooking(booking.id).status).toBe(BookingStatus.CANCELED);
  });
});
