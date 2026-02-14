import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export default async function CoursesPage() {
  const courses = await prisma.course.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">課程列表</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {courses.map((course) => (
          <article key={course.id} className="rounded border bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold">{course.title}</h2>
            <p className="mt-2 line-clamp-3 text-sm text-slate-600">{course.description}</p>
            <p className="mt-2 text-sm">時長：{course.durationMinutes} 分鐘</p>
            <p className="text-sm">價格：NT$ {course.price}</p>
            <Link href={`/courses/${course.id}`} className="mt-3 inline-block text-blue-700 hover:underline">
              查看時段與預約
            </Link>
          </article>
        ))}
      </div>
      {courses.length === 0 ? <p>目前尚無上架課程。</p> : null}
    </div>
  );
}
