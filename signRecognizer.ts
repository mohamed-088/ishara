import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

export const SEQ_LEN = 20;
export type Template = { id?: string; label: string; frames: number[][] };

export async function createTracker() {
  const fileset = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm');
  return HandLandmarker.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numHands: 2,
  });
}

// ميزات الإطار: لكل يد 21 نقطة (نسبة للمعصم ومقياس حجم اليد) + موضع المعصم. اليدان في خانتين ثابتتين (يسار/يمين).
export function frameFeature(res: any): number[] | null {
  if (!res?.landmarks?.length) return null;
  const slots: (any | null)[] = [null, null];
  res.landmarks.forEach((lm: any, i: number) => {
    const side = res.handednesses?.[i]?.[0]?.categoryName === 'Left' ? 0 : 1;
    if (!slots[side]) slots[side] = lm; else slots[1 - side] = slots[1 - side] || lm;
  });
  const f: number[] = [];
  for (const lm of slots) {
    if (!lm) { for (let i = 0; i < 65; i++) f.push(0); continue; }
    const w = lm[0];
    const scale = Math.hypot(lm[9].x - w.x, lm[9].y - w.y, lm[9].z - w.z) || 1;
    for (const p of lm) f.push((p.x - w.x) / scale, (p.y - w.y) / scale, (p.z - w.z) / scale);
    f.push(w.x, w.y);
  }
  return f;
}

export function resample(seq: number[][], n = SEQ_LEN) {
  const out: number[][] = [];
  for (let i = 0; i < n; i++) {
    const t = (i * (seq.length - 1)) / (n - 1);
    const a = Math.floor(t), b = Math.min(a + 1, seq.length - 1), k = t - a;
    out.push(seq[a].map((v, j) => v + (seq[b][j] - v) * k));
  }
  return out;
}

const fdist = (a: number[], b: number[]) => {
  let s = 0;
  for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d; }
  return Math.sqrt(s / a.length);
};

export function dtw(A: number[][], B: number[][], band = 5) {
  const n = A.length;
  const D = Array.from({ length: n + 1 }, () => Array(n + 1).fill(Infinity));
  D[0][0] = 0;
  for (let i = 1; i <= n; i++)
    for (let j = Math.max(1, i - band); j <= Math.min(n, i + band); j++)
      D[i][j] = fdist(A[i - 1], B[j - 1]) + Math.min(D[i - 1][j], D[i][j - 1], D[i - 1][j - 1]);
  return D[n][n] / (2 * n);
}

// عتبة القبول لكل إشارة = أكبر فرق بين عيناتها × 1.5 (تحتاج عينتين على الأقل، ويفضّل 4-5)
export function thresholds(templates: Template[]) {
  const by: Record<string, Template[]> = {};
  templates.forEach(t => (by[t.label] = by[t.label] || []).push(t));
  const out: Record<string, number> = {};
  for (const [label, arr] of Object.entries(by)) {
    let m = 0;
    for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++) m = Math.max(m, dtw(arr[i].frames, arr[j].frames));
    out[label] = arr.length >= 2 ? Math.max(m * 1.5, 0.12) : 0.3;
  }
  return out;
}

export function classify(seq: number[][], templates: Template[], thr: Record<string, number>) {
  const best: Record<string, number> = {};
  for (const t of templates) {
    const d = dtw(seq, t.frames);
    if (!(t.label in best) || d < best[t.label]) best[t.label] = d;
  }
  const ranked = Object.entries(best).sort((a, b) => a[1] - b[1]);
  if (!ranked.length) return null;
  const [label, d] = ranked[0];
  if (d > thr[label]) return null;
  if (ranked[1] && ranked[1][1] < d * 1.15) return null; // التباس بين إشارتين
  return { label, dist: d };
}
