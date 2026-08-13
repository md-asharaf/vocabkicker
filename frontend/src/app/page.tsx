import GameCanvas from '../components/GameCanvas';

export default function Home() {
  return (
    <main className="w-full h-[100dvh] overflow-hidden bg-gray-900 text-white">
      <GameCanvas />
    </main>
  );
}
