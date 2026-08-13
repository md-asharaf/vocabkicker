const DRAG_SCALE_X = 190;   // px to reach ±1 aimX
const DRAG_SCALE_Y = 210;   // px to reach full aimY height

export class Input {
  private _canvas: HTMLCanvasElement;
  private _active: boolean;
  private _startX: number;
  private _startY: number;
  private _path: { x: number, y: number }[];

  public onDragStart: ((x: number, y: number) => void) | null;
  public onDragMove: ((aimX: number, aimY: number, curveFactor: number, power: number, screenX: number, screenY: number) => void) | null;
  public onDragEnd: ((aimX: number, aimY: number, curveFactor: number, power: number) => void) | null;
  public onCancel: (() => void) | null;

  public enabled: boolean;

  constructor(canvas: HTMLCanvasElement) {
    this._canvas = canvas;
    this._active = false;
    this._startX = 0;
    this._startY = 0;
    this._path = [];

    this.onDragStart = null;
    this.onDragMove = null;
    this.onDragEnd = null;
    this.onCancel = null;

    this.enabled = true;

    this._bind();
  }

  private _bind() {
    const c = this._canvas;
    c.addEventListener('mousedown', (e: MouseEvent) => this._start(e.clientX, e.clientY));
    c.addEventListener('mousemove', (e: MouseEvent) => this._move(e.clientX, e.clientY));
    c.addEventListener('mouseup', (e: MouseEvent) => this._end(e.clientX, e.clientY));
    c.addEventListener('mouseleave', () => this._cancel());

    c.addEventListener('touchstart', (e: TouchEvent) => { e.preventDefault(); const t = e.touches[0]; this._start(t.clientX, t.clientY); }, { passive: false });
    c.addEventListener('touchmove', (e: TouchEvent) => { e.preventDefault(); const t = e.touches[0]; this._move(t.clientX, t.clientY); }, { passive: false });
    c.addEventListener('touchend', (e: TouchEvent) => { e.preventDefault(); const t = e.changedTouches[0]; this._end(t.clientX, t.clientY); }, { passive: false });
  }

  private _clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

  private _compute(cx: number, cy: number) {
    const dx = cx - this._startX;
    const dy = this._startY - cy;

    const aimX = this._clamp(dx / DRAG_SCALE_X, -1.6, 1.6);
    const aimY = this._clamp(0.45 + dy / DRAG_SCALE_Y, -0.2, 1.6);
    const power = this._clamp(Math.hypot(dx, dy) / 200, 0, 1);

    let curveFactor = 0;
    if (this._path.length > 2) {
      const len = Math.hypot(dx, -dy);
      if (len > 10) {
        let maxDev = 0;
        for (const pt of this._path) {
          const dev = ((pt.x - this._startX) * (-dy) - (pt.y - this._startY) * dx) / len;
          if (Math.abs(dev) > Math.abs(maxDev)) maxDev = dev;
        }
        curveFactor = this._clamp(-maxDev / 60, -1, 1);
      }
    }

    return { aimX, aimY, curveFactor, power, screenX: cx, screenY: cy };
  }

  private _start(x: number, y: number) {
    if (this._active || !this.enabled) return;
    this._active = true;
    this._startX = x;
    this._startY = y;
    this._path = [{ x, y }];
    this.onDragStart?.(x, y);
  }

  private _move(cx: number, cy: number) {
    if (!this._active) return;
    this._path.push({ x: cx, y: cy });
    const v = this._compute(cx, cy);
    this.onDragMove?.(v.aimX, v.aimY, v.curveFactor, v.power, v.screenX, v.screenY);
  }

  private _end(cx: number, cy: number) {
    if (!this._active) return;
    this._active = false;
    const v = this._compute(cx, cy);
    const dist = Math.hypot(cx - this._startX, cy - this._startY);
    if (dist < 14) { this.onCancel?.(); return; }
    this.onDragEnd?.(v.aimX, v.aimY, v.curveFactor, v.power);
  }

  private _cancel() {
    if (!this._active) return;
    this._active = false;
    this.onCancel?.();
  }
}
