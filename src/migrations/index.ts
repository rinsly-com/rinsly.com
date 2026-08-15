import * as migration_20260718_152236 from './20260718_152236';
import * as migration_20260729_181721_check_aanvragen from './20260729_181721_check_aanvragen';
import * as migration_20260730_165530_check_runs from './20260730_165530_check_runs';
import * as migration_20260803_201709_partner_aanvragen from './20260803_201709_partner_aanvragen';
import * as migration_20260805_203609 from './20260805_203609';
import * as migration_20260805_211835 from './20260805_211835';
import * as migration_20260815_154536 from './20260815_154536';

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
    name: '20260730_165530_check_runs',
  },
  {
    up: migration_20260803_201709_partner_aanvragen.up,
    down: migration_20260803_201709_partner_aanvragen.down,
    name: '20260803_201709_partner_aanvragen',
  },
  {
    up: migration_20260805_203609.up,
    down: migration_20260805_203609.down,
    name: '20260805_203609',
  },
  {
    up: migration_20260805_211835.up,
    down: migration_20260805_211835.down,
    name: '20260805_211835',
  },
  {
    up: migration_20260815_154536.up,
    down: migration_20260815_154536.down,
    name: '20260815_154536'
  },
];
