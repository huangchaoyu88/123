import Link from 'next/link';
import { adminLogoutAction } from '@/app/admin/actions';

export function AdminNav() {
  return (
    <div className="mb-6 flex items-center gap-4 border-b pb-4 text-sm">
      <Link href="/admin/courses" className="hover:underline">課程管理</Link>
      <Link href="/admin/timeslots" className="hover:underline">時段管理</Link>
      <Link href="/admin/bookings" className="hover:underline">預約管理</Link>
      <form action={adminLogoutAction} className="ml-auto">
        <button className="text-red-600 hover:underline">登出</button>
      </form>
    </div>
  );
}
