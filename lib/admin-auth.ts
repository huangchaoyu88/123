import { cookies } from 'next/headers';

const ADMIN_COOKIE = 'admin_auth';

export function isAdminAuthenticated(): boolean {
  return cookies().get(ADMIN_COOKIE)?.value === '1';
}

export function loginAdmin(password: string): boolean {
  if (!process.env.ADMIN_PASSWORD) {
    throw new Error('ADMIN_PASSWORD not configured');
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    return false;
  }

  cookies().set(ADMIN_COOKIE, '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  });
  return true;
}

export function logoutAdmin(): void {
  cookies().delete(ADMIN_COOKIE);
}
