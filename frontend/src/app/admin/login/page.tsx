import type { Metadata } from 'next';
import Login from '@/components/admin/Login';

export const metadata: Metadata = {
  title: 'VocabKicker — Admin Login',
  description: 'Sign in to the VocabKicker admin panel to manage quiz questions.',
};

export default function LoginPage() {
  return <Login />;
}
