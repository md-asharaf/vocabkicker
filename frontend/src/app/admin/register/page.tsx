import type { Metadata } from 'next';
import Register from '@/components/admin/Register';

export const metadata: Metadata = {
  title: 'VocabKicker — Create Admin',
  description: 'Register a new admin account for the VocabKicker admin panel.',
};

export default function RegisterPage() {
  return <Register />;
}
