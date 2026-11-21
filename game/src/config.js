// Game balance, constants, and theme palette
export const VIEWPORT = {
  width: 1024,
  height: 640
};

export const PLAYER_CONFIG = {
  radius: 12,
  walkSpeed: 135,
  sneakSpeed: 70,
  sprintSpeed: 200,
  throwRange: 280,
  maxPebbles: 3,
  maxSmokeBombs: 1
};

export const GUARD_CONFIG = {
  radius: 14,
  patrolSpeed: 52,
  investigateSpeed: 80,
  chaseSpeed: 130,
  coneFov: Math.PI * 0.42, // ~75 degrees
  coneRangeNormal: 220,
  coneRangeLit: 310,
  coneRangeShadow: 120,
  hearRadiusNormal: 90,
  hearRadiusSprint: 180,
  hearRadiusPebble: 240,
  suspicionBuildRate: 1.8,
  suspicionDecayRate: 0.6
};

export const COLORS = {
  bg: '#0c0f17',
  floor: '#131924',
  floorTile: '#171e2c',
  wall: '#263347',
  wallTop: '#3b4d68',
  cover: '#2d3e56',
  coverHatch: '#1e293b',
  player: '#38bdf8',
  playerShadow: '#0284c7',
  guardPatrol: '#f59e0b',
  guardAlert: '#ef4444',
  guardSuspicious: '#eab308',
  laser: '#ff0055',
  lightWarm: 'rgba(254, 240, 138, 0.18)',
  lightCore: 'rgba(253, 224, 71, 0.7)',
  exitOpen: '#10b981',
  exitLocked: '#64748b',
  grass: '#1e3a2f',
  grassDark: '#142720'
};
