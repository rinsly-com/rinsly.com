import * as migration_20260718_152236 from './20260718_152236';
import * as migration_20260729_181721_check_aanvragen from './20260729_181721_check_aanvragen';
import * as migration_20260730_165530_check_runs from './20260730_165530_check_runs';
import * as migration_20260803_201709_partner_aanvragen from './20260803_201709_partner_aanvragen';
import * as migration_20260805_203609 from './20260805_203609';
import * as migration_20260805_211835 from './20260805_211835';
import * as migration_20260815_154536 from './20260815_154536';
import * as migration_20261013_162150_site_core_0_22 from './20261013_162150_site_core_0_22';
import * as migration_20261103_013000_drop_figma_seat from './20261103_013000_drop_figma_seat';
import * as migration_20261126_140500_email_consent from './20261126_140500_email_consent';
import * as migration_20261126_160500_b2b_kvk from './20261126_160500_b2b_kvk';
import * as migration_20261126_232114_content_endpoint from './20261126_232114_content_endpoint';
import * as migration_20261127_170000_content_refactor from './20261127_170000_content_refactor';
import * as migration_20261127_190000_partner_v33_rungs from './20261127_190000_partner_v33_rungs';

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
    name: '20260815_154536',
  },
  {
    up: migration_20261013_162150_site_core_0_22.up,
    down: migration_20261013_162150_site_core_0_22.down,
    name: '20261013_162150_site_core_0_22',
  },
  {
    up: migration_20261103_013000_drop_figma_seat.up,
    down: migration_20261103_013000_drop_figma_seat.down,
    name: '20261103_013000_drop_figma_seat',
  },
  {
    up: migration_20261126_140500_email_consent.up,
    down: migration_20261126_140500_email_consent.down,
    name: '20261126_140500_email_consent',
  },
  {
    up: migration_20261126_160500_b2b_kvk.up,
    down: migration_20261126_160500_b2b_kvk.down,
    name: '20261126_160500_b2b_kvk',
  },
  {
    up: migration_20261126_232114_content_endpoint.up,
    down: migration_20261126_232114_content_endpoint.down,
    name: '20261126_232114_content_endpoint'
  },
  {
    up: migration_20261127_170000_content_refactor.up,
    down: migration_20261127_170000_content_refactor.down,
    name: '20261127_170000_content_refactor',
  },
  {
    up: migration_20261127_190000_partner_v33_rungs.up,
    down: migration_20261127_190000_partner_v33_rungs.down,
    name: '20261127_190000_partner_v33_rungs',
  },
];
