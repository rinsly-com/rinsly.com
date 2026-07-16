import * as migration_20260716_191956_initial from './20260716_191956_initial';

export const migrations = [
  {
    up: migration_20260716_191956_initial.up,
    down: migration_20260716_191956_initial.down,
    name: '20260716_191956_initial'
  },
];
