import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { formatDateTimeUTCToTaipei, formatDateUTCToTaipei } from '@/lib/time';
import { submitBooking } from './actions';

export default async function CourseDetailPage({ params }: { params: { id: string } }) {
  const course = await prisma.course.findUnique({
    where: { id: params.id },
    include: {
      timeSlots: {
        where: { status: 'OPEN' },
        include: { teacher: true },
        orderBy: { startTime: 'asc' },
      },
    },
  });

  if (!course || !course.isActive) {
    notFound();
  }

  const grouped = course.timeSlots.reduce<Record<string, typeof course.timeSlots>>((acc, slot) => {
    const key = formatDateUTCToTaipei(slot.startTime);
    acc[key] = acc[key] ? [...acc[key], slot] : [slot];
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <section className="rounded border bg-white p-5">
        <h1 className="text-2xl font-bold">{course.title}</h1>
        <p className="mt-3 text-slate-700">{course.description}</p>
      </section>

      <section className="rounded border bg-white p-5">
        <h2 className="text-xl font-semibold">可預約時段</h2>
        <div className="mt-4 space-y-4">
          {Object.entries(grouped).map(([date, slots]) => (
            <div key={date}>
              <h3 className="font-medium">{date}</h3>
              <ul className="mt-2 grid gap-2 md:grid-cols-2">
                {slots.map((slot) => {
                  const remaining = slot.capacity - slot.bookedCount;
                  return (
                    <li key={slot.id} className="rounded border p-3 text-sm">
                      <p>{formatDateTimeUTCToTaipei(slot.startTime)}（+08:00）</p>
                      <p>老師：{slot.teacher.name}</p>
                      <p>剩餘名額：{remaining}</p>
                      {remaining <= 0 ? <p className="font-medium text-red-600">已額滿</p> : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {course.timeSlots.length === 0 ? <p>目前無可預約時段。</p> : null}
        </div>
      </section>

      <section className="rounded border bg-white p-5">
        <h2 className="text-xl font-semibold">立即預約</h2>
        <form action={submitBooking} className="mt-4 grid gap-3 md:max-w-xl">
          <label className="grid gap-1">
            時段
            <select name="timeSlotId" required className="rounded border px-3 py-2">
              <option value="">請選擇時段</option>
              {course.timeSlots
                .filter((s) => s.capacity > s.bookedCount)
                .map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {formatDateTimeUTCToTaipei(slot.startTime)}｜{slot.teacher.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="grid gap-1">姓名<input className="rounded border px-3 py-2" name="name" required /></label>
          <label className="grid gap-1">電話<input className="rounded border px-3 py-2" name="phone" required /></label>
          <label className="grid gap-1">Email<input type="email" className="rounded border px-3 py-2" name="email" required /></label>
          <label className="grid gap-1">備註<textarea className="rounded border px-3 py-2" name="note" rows={3} /></label>
          <button className="rounded bg-blue-700 px-4 py-2 text-white hover:bg-blue-800">送出預約</button>
        </form>
      </section>
    </div>
  );
}
