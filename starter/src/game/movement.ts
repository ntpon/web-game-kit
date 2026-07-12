// Wall-slide movement ported from Taladtaek's simulation core: when the
// diagonal step is blocked, try the horizontal and vertical components
// separately so the actor slides along walls instead of sticking to them.
export type Point = Readonly<{ x: number; y: number }>;

export type Blocker = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

export type WalkableArea = Readonly<{
  width: number;
  height: number;
  blockers: readonly Blocker[];
}>;

export type MovementConfig = Readonly<{
  unitsPerSecond: number;
  actorRadius: number;
}>;

function normalizeInput(input: Point): Point {
  const length = Math.hypot(input.x, input.y);
  if (length === 0) return { x: 0, y: 0 };
  return { x: input.x / length, y: input.y / length };
}

function clampToArea(point: Point, area: WalkableArea, radius: number): Point {
  return {
    x: Math.min(area.width - radius, Math.max(radius, point.x)),
    y: Math.min(area.height - radius, Math.max(radius, point.y)),
  };
}

function overlapsBlocker(point: Point, blocker: Blocker, radius: number): boolean {
  return (
    point.x > blocker.x - radius &&
    point.x < blocker.x + blocker.width + radius &&
    point.y > blocker.y - radius &&
    point.y < blocker.y + blocker.height + radius
  );
}

function isWalkable(point: Point, area: WalkableArea, radius: number): boolean {
  return area.blockers.every((blocker) => !overlapsBlocker(point, blocker, radius));
}

export function moveActor(
  position: Point,
  input: Point,
  deltaSeconds: number,
  area: WalkableArea,
  config: MovementConfig,
): Point {
  const direction = normalizeInput(input);
  const distance = config.unitsPerSecond * deltaSeconds;
  const target = clampToArea(
    {
      x: position.x + direction.x * distance,
      y: position.y + direction.y * distance,
    },
    area,
    config.actorRadius,
  );

  if (isWalkable(target, area, config.actorRadius)) {
    return target;
  }

  const horizontalTarget = clampToArea({ x: target.x, y: position.y }, area, config.actorRadius);
  const verticalTarget = clampToArea({ x: position.x, y: target.y }, area, config.actorRadius);

  return {
    x: isWalkable(horizontalTarget, area, config.actorRadius) ? horizontalTarget.x : position.x,
    y: isWalkable(verticalTarget, area, config.actorRadius) ? verticalTarget.y : position.y,
  };
}
