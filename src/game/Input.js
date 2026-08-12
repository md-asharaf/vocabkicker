/**
 * Input.js  —  Mouse + touch drag → aim vector and curve factor.
 *
 * How it works
 * ────────────
 * The player drags anywhere on the canvas.
 * · Horizontal delta  → aimX    (−1 far-left … +1 far-right inside goal)
 * · Vertical delta    → aimY    (0 low … 1 high inside goal)
 * · curveFactor       → derived from aimX: wide aims produce more curl.
 *
 * Callbacks
 * ─────────
 * onDragStart(x, y)
 * onDragMove(aimX, aimY, curveFactor, power, screenX, screenY)
 * onDragEnd(aimX, aimY, curveFactor, power)
 * onCancel()
 */

const DRAG_SCALE_X = 190;   // px to reach ±1 aimX
const DRAG_SCALE_Y = 210;   // px to reach full aimY height

export class Input {
  constructor(canvas) {
    this._canvas   = canvas;
    this._active   = false;
    this._startX   = 0;
    this._startY   = 0;
    this._path     = [];

    // Expose callbacks
    this.onDragStart = null;
    this.onDragMove  = null;
    this.onDragEnd   = null;
    this.onCancel    = null;

    this.enabled     = true;

    this._bind();
  }

  _bind() {
    const c = this._canvas;
    c.addEventListener('mousedown',  e => this._start(e.clientX, e.clientY));
    c.addEventListener('mousemove',  e => this._move(e.clientX, e.clientY));
    c.addEventListener('mouseup',    e => this._end(e.clientX, e.clientY));
    c.addEventListener('mouseleave', ()  => this._cancel());

    c.addEventListener('touchstart', e => { e.preventDefault(); const t = e.touches[0]; this._start(t.clientX, t.clientY); }, { passive: false });
    c.addEventListener('touchmove',  e => { e.preventDefault(); const t = e.touches[0]; this._move(t.clientX, t.clientY); },  { passive: false });
    c.addEventListener('touchend',   e => { e.preventDefault(); const t = e.changedTouches[0]; this._end(t.clientX, t.clientY); }, { passive: false });
  }

  _clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  _compute(cx, cy) {
    const dx = cx - this._startX;
    const dy = this._startY - cy;          // up = positive

    const aimX  = this._clamp(dx / DRAG_SCALE_X, -1.6, 1.6);
    const aimY  = this._clamp(0.45 + dy / DRAG_SCALE_Y, -0.2, 1.6);
    const power = this._clamp(Math.hypot(dx, dy) / 200, 0, 1);

    // Calculate curve based on horizontal deviation from straight path
    let curveFactor = 0;
    if (this._path.length > 2) {
      const len = Math.hypot(dx, -dy); // dx, y2-y1 (which is -dy)
      if (len > 10) {
        let maxDev = 0;
        for (const pt of this._path) {
          const dev = ((pt.x - this._startX) * (-dy) - (pt.y - this._startY) * dx) / len;
          if (Math.abs(dev) > Math.abs(maxDev)) maxDev = dev;
        }
        // Dev is negative if path bulges right. We want positive curve for right bulge.
        curveFactor = this._clamp(-maxDev / 60, -1, 1);
      }
    }

    return { aimX, aimY, curveFactor, power, screenX: cx, screenY: cy };
  }

  _start(x, y) {
    if (this._active || !this.enabled) return;
    this._active = true;
    this._startX = x;
    this._startY = y;
    this._path   = [{ x, y }];
    this.onDragStart?.(x, y);
  }

  _move(cx, cy) {
    if (!this._active) return;
    this._path.push({x: cx, y: cy});
    const v = this._compute(cx, cy);
    this.onDragMove?.(v.aimX, v.aimY, v.curveFactor, v.power, v.screenX, v.screenY);
  }

  _end(cx, cy) {
    if (!this._active) return;
    this._active = false;
    const v = this._compute(cx, cy);
    const dist = Math.hypot(cx - this._startX, cy - this._startY);
    if (dist < 14) { this.onCancel?.(); return; }
    this.onDragEnd?.(v.aimX, v.aimY, v.curveFactor, v.power);
  }

  _cancel() {
    if (!this._active) return;
    this._active = false;
    this.onCancel?.();
  }
}
