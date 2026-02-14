import { prisma } from '../lib/prisma';

async function main() {
  await prisma.booking.deleteMany();
  await prisma.timeSlot.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.course.deleteMany();

  const teachers = await prisma.$transaction([
    prisma.teacher.create({ data: { name: '王老師' } }),
    prisma.teacher.create({ data: { name: '李老師' } }),
    prisma.teacher.create({ data: { name: '陳老師' } }),
  ]);

  const courses = await prisma.$transaction([
    prisma.course.create({ data: { title: '瑜珈入門', description: '放鬆與核心訓練', durationMinutes: 60, price: 1200, isActive: true } }),
    prisma.course.create({ data: { title: '商務英文會話', description: '提升職場溝通', durationMinutes: 90, price: 1800, isActive: true } }),
    prisma.course.create({ data: { title: '程式設計基礎', description: 'TypeScript 與實作練習', durationMinutes: 120, price: 2500, isActive: true } }),
  ]);

  const start = new Date();
  start.setUTCHours(2, 0, 0, 0);

  const slots = courses.flatMap((course, idx) =>
    Array.from({ length: 7 }).map((_, day) => {
      const dt = new Date(start);
      dt.setUTCDate(start.getUTCDate() + day);
      dt.setUTCHours(2 + idx, 0, 0, 0);
      return {
        courseId: course.id,
        teacherId: teachers[(idx + day) % teachers.length].id,
        startTime: dt,
        capacity: 5,
        bookedCount: 0,
        status: 'OPEN' as const,
      };
    }),
  );

  await prisma.timeSlot.createMany({ data: slots });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
