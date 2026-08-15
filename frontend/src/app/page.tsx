import type { Metadata } from 'next';
import GameCanvas from '../components/game/GameCanvas';

export const metadata: Metadata = {
  title: 'VocabKicker 3D — Play',
  description: 'Test your vocabulary with the immersive 3D VocabKicker quiz. Dodge the wrong answers and catch the right ones!',
};

export default function Home() {
  return (
    <main className="w-full h-[100dvh] overflow-hidden bg-gray-900 text-white">
      <GameCanvas />
    </main>
  );
}
