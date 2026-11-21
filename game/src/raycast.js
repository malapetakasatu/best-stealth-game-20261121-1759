// 2D Line-segment intersection and polygonal vision cone raycasting
export function lineIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (denom === 0) return null;
  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return {
      x: x1 + ua * (x2 - x1),
      y: y1 + ua * (y2 - y1),
      dist: ua
    };
  }
  return null;
}

export function castVisionCone(originX, originY, angle, fov, range, segments, rayCount = 48) {
  const halfFov = fov / 2;
  const points = [];
  const startAngle = angle - halfFov;
  const step = fov / rayCount;

  for (let i = 0; i <= rayCount; i++) {
    const curAngle = startAngle + i * step;
    const endX = originX + Math.cos(curAngle) * range;
    const endY = originY + Math.sin(curAngle) * range;

    let closestDist = range;
    let hitX = endX;
    let hitY = endY;

    for (let s = 0; s < segments.length; s++) {
      const seg = segments[s];
      const hit = lineIntersection(originX, originY, endX, endY, seg.x1, seg.y1, seg.x2, seg.y2);
      if (hit) {
        const d = Math.hypot(hit.x - originX, hit.y - originY);
        if (d < closestDist) {
          closestDist = d;
          hitX = hit.x;
          hitY = hit.y;
        }
      }
    }
    points.push({ x: hitX, y: hitY });
  }

  return points;
}

export function hasLineOfSight(x1, y1, x2, y2, segments) {
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (lineIntersection(x1, y1, x2, y2, seg.x1, seg.y1, seg.x2, seg.y2)) {
      return false;
    }
  }
  return true;
}
