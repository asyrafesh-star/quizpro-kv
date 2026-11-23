export const RUN_MS = 30000;
export const FREEZE_MS = 5000;
export const RUN_SPEED = 12;

// Pure local simulation: no Firebase traffic per frame, coin or collision.
export function createRunStage(startedAt, seed = '') {
  let hash = 2166136261;
  for (const c of seed) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619);
  const random = () => { hash ^= hash << 13; hash ^= hash >>> 17; hash ^= hash << 5; return (hash >>> 0) / 4294967296; };
  const items = [];
  for (let row = 0; row < 18; row++) {
    const lane = Math.floor(random() * 3);
    const distance = 26 + row * 19;
    items.push({ kind:'obstacle', type:['train','overhead','barrier'][row%3], lane, distance, done:false });
    // One obstructed lane per row leaves two safe routes.
    const safe = (lane + 1 + Math.floor(random() * 2)) % 3;
    for (let n = 0; n < 3; n++) items.push({ kind:'coin', lane:safe, distance:distance - 8 + n * 3, done:false });
  }
  return { startedAt, until:startedAt + RUN_MS, lastAt:startedAt, distance:0, lane:1, frozenUntil:0, jumpUntil:0, slideUntil:0, coins:0, collisions:0, items };
}

export function stepRun(stage, clock) {
  const end = Math.min(clock, stage.until);
  if (end <= stage.lastAt) return { coin:0, hit:false };
  const from = Math.max(stage.lastAt, stage.frozenUntil);
  const before = stage.distance;
  stage.distance += Math.max(0, end - from) / 1000 * RUN_SPEED;
  let coin = 0, hit = false;
  for (const item of stage.items) {
    if (item.done || item.distance > stage.distance || item.distance <= before) continue;
    item.done = true;
    if (item.lane !== stage.lane) continue;
    const crossedAt = from + (item.distance - before) / RUN_SPEED * 1000;
    if (item.kind === 'coin') { coin++; stage.coins++; }
    else if (item.type==='train' || (item.type==='overhead' ? crossedAt>=stage.slideUntil : crossedAt>=stage.jumpUntil)) {
      stage.distance = item.distance;
      stage.frozenUntil = crossedAt + FREEZE_MS;
      stage.collisions++; hit = true; break;
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
