import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';
import { AdminNav } from '@/components/AdminNav';
import { createTimeSlotBatchAction, updateTimeSlotAction } from '../actions';
import { formatDateTimeUTCToTaipei } from '@/lib/time';

export default async function AdminTimeSlotsPage() {
  requireAdmin();
  const [courses, teachers, slots] = await Promise.all([
    prisma.course.findMany({ orderBy: { title: 'asc' } }),
    prisma.teacher.findMany({ orderBy: { name: 'asc' } }),
    prisma.timeSlot.findMany({
      include: { course: true, teacher: true },
      orderBy: { startTime: 'asc' },
      take: 100,
    }),
  ]);

  return (
    <div>
      <AdminNav />
      <h1 className="text-2xl font-bold">時段管理</h1>
      <section className="mt-4 rounded border bg-white p-4">
        <h2 className="font-semibold">批次建立時段</h2>
        <form action={createTimeSlotBatchAction} className="mt-3 grid gap-2 md:grid-cols-3">
          <select name="courseId" className="rounded border px-3 py-2" required>{courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select>
          <select name="teacherId" className="rounded border px-3 py-2" required>{teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
          <input type="date" name="startDate" className="rounded border px-3 py-2" required />
          <input type="number" name="days" defaultValue={7} min={1} className="rounded border px-3 py-2" required />
          <input type="number" name="hour" defaultValue={10} min={0} max={23} className="rounded border px-3 py-2" required />
          <input type="number" name="minute" defaultValue={0} min={0} max={59} className="rounded border px-3 py-2" required />
          <input type="number" name="capacity" defaultValue={5} min={1} className="rounded border px-3 py-2" required />
          <button className="rounded bg-blue-700 px-4 py-2 text-white">建立時段</button>
        </form>
      </section>

      <div className="mt-4 space-y-2">
        {slots.map((slot) => (
          <form key={slot.id} action={updateTimeSlotAction} className="grid items-center gap-2 rounded border bg-white p-3 md:grid-cols-6">
            <input type="hidden" name="id" value={slot.id} />
            <p className="text-sm">{slot.course.title}</p>
            <p className="text-sm">{slot.teacher.name}</p>
            <p className="text-sm">{formatDateTimeUTCToTaipei(slot.startTime)}</p>
            <input type="number" name="capacity" defaultValue={slot.capacity} className="rounded border px-2 py-1" />
            <select name="status" defaultValue={slot.status} className="rounded border px-2 py-1">
              <option value="OPEN">OPEN</option>
              <option value="CLOSED">CLOSED</option>
            </select>
            <button className="rounded bg-slate-900 px-3 py-1 text-white">更新</button>
          </form>
        ))}
      </div>
    </div>
  );
}
