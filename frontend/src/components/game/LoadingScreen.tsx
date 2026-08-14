export default function LoadingScreen({ message = "Loading VocabKicker 3D…" }: { message?: string }) {
  return (
    <div id="loadingScreen" style={{ display: 'flex' }}>
      <div className="spinner"></div>
      <p>{message}</p>
    </div>
  );
}