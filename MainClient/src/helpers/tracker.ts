
import { Detection } from './helpers';

export class SimpleTracker {
  private nextId = 0;
  private tracks: Map<number, Detection> = new Map();

  update(detections: Detection[]): Detection[] {
    const updated: Detection[] = [];
    const matched = new Set<number>();
    const newDets = detections.filter(d => !d.trackId);

    // Match existing
    for (const det of detections) {
      if (det.trackId !== undefined) {
        this.tracks.set(det.trackId, det);
        updated.push(det);
        matched.add(det.trackId);
      }
    }

    // Assign new IDs to unmatched
    for (const det of newDets) {
      let bestMatch = -1;
      let bestIou = 0.3;

      for (const [id, track] of this.tracks.entries()) {
        if (matched.has(id)) continue;
        const score = iou(det.bbox, track.bbox);
        if (score > bestIou) {
          bestIou = score;
          bestMatch = id;
        }
      }

      let assignedId: number;
      if (bestMatch !== -1) {
        assignedId = bestMatch;
        matched.add(bestMatch);
      } else {
        assignedId = this.nextId++;
      }

      const trackedDet = { ...det, trackId: assignedId };
      this.tracks.set(assignedId, trackedDet);
      updated.push(trackedDet);
    }

    // Clean old tracks
    for (const id of this.tracks.keys()) {
      if (!matched.has(id)) this.tracks.delete(id);
    }

    return updated;
  }
}

function iou(a: number[], b: number[]) {
  const [ax1, ay1, ax2, ay2] = a;
  const [bx1, by1, bx2, by2] = b;
  const x1 = Math.max(ax1, bx1), y1 = Math.max(ay1, by1);
  const x2 = Math.min(ax2, bx2), y2 = Math.min(ay2, by2);
  if (x2 <= x1 || y2 <= y1) return 0;
  const inter = (x2 - x1) * (y2 - y1);
  return inter / ((ax2 - ax1) * (ay2 - ay1) + (bx2 - bx1) * (by2 - by1) - inter);
}