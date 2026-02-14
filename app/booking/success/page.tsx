import Link from 'next/link';

export default function BookingSuccessPage({ searchParams }: { searchParams: { bookingId?: string } }) {
  return (
    <div className="rounded border bg-white p-6">
      <h1 className="text-2xl font-bold text-green-700">預約成功</h1>
      <p className="mt-2">您的預約已建立，編號：{searchParams.bookingId ?? 'N/A'}</p>
      <Link href="/courses" className="mt-4 inline-block text-blue-700 hover:underline">
        返回課程列表
      </Link>
    </div>
  );
}
