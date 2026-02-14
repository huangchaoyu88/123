import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';
import { AdminNav } from '@/components/AdminNav';
import { formatDateTimeUTCToTaipei } from '@/lib/time';
import { cancelBookingAction } from '../actions';

export default async function AdminBookingsPage() {
  requireAdmin();
  const bookings = await prisma.booking.findMany({
    include: { timeSlot: { include: { course: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return (
    <div>
      <AdminNav />
      <h1 className="text-2xl font-bold">預約管理</h1>
      <div className="mt-4 space-y-2">
        {bookings.map((booking) => (
          <div key={booking.id} className="grid items-center gap-2 rounded border bg-white p-3 md:grid-cols-7">
            <p className="text-sm">{booking.name}</p>
            <p className="text-sm">{booking.email}</p>
            <p className="text-sm">{booking.timeSlot.course.title}</p>
            <p className="text-sm">{formatDateTimeUTCToTaipei(booking.timeSlot.startTime)}</p>
            <p className="text-sm">{booking.status}</p>
            <p className="text-sm">{booking.phone}</p>
            <form action={cancelBookingAction}>
              <input type="hidden" name="id" value={booking.id} />
              <button disabled={booking.status === 'CANCELED'} className="rounded bg-red-700 px-3 py-1 text-white disabled:bg-gray-300">
                取消預約
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
