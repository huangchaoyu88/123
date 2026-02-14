import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from './admin-auth';

export function requireAdmin() {
  if (!isAdminAuthenticated()) {
    redirect('/admin');
  }
}
