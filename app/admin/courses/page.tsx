import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';
import { AdminNav } from '@/components/AdminNav';
import { createCourseAction, updateCourseAction } from '../actions';

export default async function AdminCoursesPage() {
  requireAdmin();
  const courses = await prisma.course.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <div>
      <AdminNav />
      <h1 className="text-2xl font-bold">課程管理</h1>
      <section className="mt-4 rounded border bg-white p-4">
        <h2 className="font-semibold">新增課程</h2>
        <form action={createCourseAction} className="mt-3 grid gap-2 md:grid-cols-2">
          <input name="title" placeholder="標題" className="rounded border px-3 py-2" required />
          <input name="durationMinutes" type="number" placeholder="時長(分)" className="rounded border px-3 py-2" required />
          <input name="price" type="number" placeholder="價格" className="rounded border px-3 py-2" required />
          <label className="flex items-center gap-2"><input type="checkbox" name="isActive" defaultChecked />上架</label>
          <textarea name="description" placeholder="描述" className="rounded border px-3 py-2 md:col-span-2" required />
          <button className="rounded bg-blue-700 px-4 py-2 text-white md:col-span-2">建立</button>
        </form>
      </section>

      <section className="mt-4 space-y-3">
        {courses.map((course) => (
          <form key={course.id} action={updateCourseAction} className="rounded border bg-white p-4">
            <input type="hidden" name="id" value={course.id} />
            <div className="grid gap-2 md:grid-cols-2">
              <input name="title" defaultValue={course.title} className="rounded border px-3 py-2" required />
              <input name="durationMinutes" type="number" defaultValue={course.durationMinutes} className="rounded border px-3 py-2" required />
              <input name="price" type="number" defaultValue={course.price} className="rounded border px-3 py-2" required />
              <label className="flex items-center gap-2"><input type="checkbox" name="isActive" defaultChecked={course.isActive} />上架</label>
              <textarea name="description" defaultValue={course.description} className="rounded border px-3 py-2 md:col-span-2" required />
              <button className="rounded bg-slate-900 px-4 py-2 text-white md:col-span-2">更新</button>
            </div>
          </form>
        ))}
      </section>
    </div>
  );
}
