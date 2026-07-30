import * as migration_20260718_152236 from './20260718_152236';
import * as migration_20260729_181721_check_aanvragen from './20260729_181721_check_aanvragen';
import * as migration_20260730_165530_check_runs from './20260730_165530_check_runs';

export const migrations = [
  {
    up: migration_20260718_152236.up,
    down: migration_20260718_152236.down,
    name: '20260718_152236',
  },
  {
    up: migration_20260729_181721_check_aanvragen.up,
    down: migration_20260729_181721_check_aanvragen.down,
    name: '20260729_181721_check_aanvragen',
  },
  {
    up: migration_20260730_165530_check_runs.up,
    down: migration_20260730_165530_check_runs.down,
    name: '20260730_165530_check_runs'
  },
];
