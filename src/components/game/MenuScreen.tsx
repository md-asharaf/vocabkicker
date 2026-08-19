export default function MenuScreen({ onStart }: { onStart: () => void }) {
  return (
    <div id="menuScreen" style={{ display: 'flex' }}>
      <div className="menuBall">&#x26BD;</div>
      <h1>VOCABKICKER 3D</h1>
      <p className="menuSub">Kick to the right answer!</p>
      <p className="menuTag">Master vocabulary through penalty kicks &middot; Full 3D</p>
      <button className="menuBtn" onClick={onStart}>&#x26BD;&nbsp; KICK OFF</button>
      <div className="menuFeatures">
        <span className="featBadge">&#x1F9E0; Multiple Questions</span>
        <span className="featBadge">&#x1F945; 4 Goalkeepers</span>
        <span className="featBadge">&#x1F4AF; +100 / &minus;10 pts</span>
        <span className="featBadge">&#x1F300; Curve Shot</span>
        <span className="featBadge">&#x1F3B5; 3D Audio</span>
      </div>
    </div>
  );
}