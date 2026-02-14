import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { adminLoginAction } from './actions';

export default function AdminLoginPage({ searchParams }: { searchParams: { error?: string } }) {
  if (isAdminAuthenticated()) {
    redirect('/admin/courses');
  }

  return (
    <div className="mx-auto max-w-md rounded border bg-white p-6">
      <h1 className="text-2xl font-bold">管理員登入</h1>
      <form action={adminLoginAction} className="mt-4 grid gap-3">
        <label className="grid gap-1">密碼<input type="password" name="password" className="rounded border px-3 py-2" required /></label>
        <button className="rounded bg-slate-900 px-4 py-2 text-white">登入</button>
      </form>
      {searchParams.error ? <p className="mt-3 text-red-600">{searchParams.error}</p> : null}
    </div>
  );
}
