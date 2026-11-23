export const RUN_MS = 20000;
export const FREEZE_MS = 5000;
export const RUN_SPEED_BASE = 12;
export const RUN_SPEED_STEP = 1.5;
export const RUN_SPEED_CAP = 28;

export function roundSpeedBounds(roundIndex = 0) {
  const start = Math.min(RUN_SPEED_CAP - 2, RUN_SPEED_BASE + roundIndex * RUN_SPEED_STEP);
  const end = Math.min(RUN_SPEED_CAP, start + RUN_SPEED_STEP);
  return { start, end };
}

export function runSpeedAt(activeMs, roundIndex = 0) {
  const { start, end } = roundSpeedBounds(roundIndex);
  const t = Math.max(0, Math.min(1, activeMs / RUN_MS));
  return start + (end - start) * t;
}

// Pure local simulation: no Firebase traffic per frame, coin or collision.
export function createRunStage(startedAt, seed = '', roundIndex = 0) {
  let hash = 2166136261;
  for (const c of seed) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619);
  const random = () => { hash ^= hash << 13; hash ^= hash >>> 17; hash ^= hash << 5; return (hash >>> 0) / 4294967296; };
  const items = [];
  for (let row = 0; row < 34; row++) {
    const lane = Math.floor(random() * 3);
    const distance = 24 + row * 17;
    items.push({ kind:'obstacle', type:['train','overhead','barrier'][row%3], lane, distance, done:false });
    // One obstructed lane per row leaves two safe routes.
    const safe = (lane + 1 + Math.floor(random() * 2)) % 3;
    for (let n = 0; n < 3; n++) items.push({ kind:'coin', lane:safe, distance:distance - 7 + n * 3, done:false });
  }
  const { start } = roundSpeedBounds(roundIndex);
  return { startedAt, until:startedAt + RUN_MS, lastAt:startedAt, activeMs:0, roundIndex, speed:start, distance:0, lane:1, frozenUntil:0, jumpUntil:0, slideUntil:0, coins:0, collisions:0, items };
}

export function stepRun(stage, clock) {
  const end = Math.min(clock, stage.until);
  if (end <= stage.lastAt) return { coin:0, hit:false };
  const from = Math.max(stage.lastAt, stage.frozenUntil);
  if (end <= from) {
    stage.lastAt = end;
    return { coin:0, hit:false };
  }
  const dtMs = end - from;
  const avgSpeed = runSpeedAt(stage.activeMs + dtMs / 2, stage.roundIndex);
  const before = stage.distance;
  stage.distance += (dtMs / 1000) * avgSpeed;
  stage.activeMs += dtMs;
  stage.speed = runSpeedAt(stage.activeMs, stage.roundIndex);
  let coin = 0, hit = false;
  for (const item of stage.items) {
    if (item.done || item.distance > stage.distance || item.distance <= before) continue;
    item.done = true;
    if (item.lane !== stage.lane) continue;
    const span = stage.distance - before;
    const frac = span > 0 ? (item.distance - before) / span : 0;
    const crossedAt = from + frac * dtMs;
    if (item.kind === 'coin') { coin++; stage.coins++; }
    else if (item.type==='train' || (item.type==='overhead' ? crossedAt>=stage.slideUntil : crossedAt>=stage.jumpUntil)) {
      stage.activeMs -= (end - crossedAt);
      stage.speed = runSpeedAt(stage.activeMs, stage.roundIndex);
      stage.distance = item.distance;
      stage.frozenUntil = crossedAt + FREEZE_MS;
      stage.until += FREEZE_MS;
      stage.collisions++;
      hit = true;
      stage.lastAt = crossedAt;
      return { coin, hit };
    }
  }
  stage.lastAt = end;
  return { coin, hit };
}

export function steerRun(stage, direction, clock) {
  stepRun(stage, clock);
  if (clock >= stage.until || clock < stage.frozenUntil) return false;
  stage.lane = Math.max(0, Math.min(2, stage.lane + direction));
  return true;
}

export function jumpRun(stage, clock) {
  stepRun(stage, clock);
  if (clock >= stage.until || clock < stage.frozenUntil || clock < stage.jumpUntil) return false;
  stage.jumpUntil = clock + 850;
  stage.slideUntil = 0;
  return true;
}

export function slideRun(stage, clock) {
  stepRun(stage, clock);
  if(clock>=stage.until||clock<stage.frozenUntil||clock<stage.slideUntil)return false;
  stage.slideUntil=clock+1100;stage.jumpUntil=0;return true;
}
