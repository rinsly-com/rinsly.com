# Proof: redesign round v8 drafts, PR head f07b11f (not for merge)

Follow-up to `v8-23633f5/`: Marketeer confirmed the EN frame labels for #132 (Save, Live, Staging). Only the EN home and prijzen drafts changed; NL is unchanged from 23633f5.

- `crops/en-figure@2x.png` and `crops/en-prijzen-figure@2x.png`: retaken at this head (the phone now says Save; the prijzen frame now has Live and Staging).
- `shots/en-*`: retaken EN draft shots at this head. `shots/nl-*` and `compare/` are the 23633f5 renders (NL drafts identical).
- `checks.json`: NL rows from 23633f5, EN rows from this head. Two EN mobile rows first read CLS 0.8472; a second pass on the same local D1 was 0.0000, and those two shots were retaken. All reported CLS values are 0.0000.
- `logs/local-d1.log`: up, re-run up, down, down again, up, migrate:down, migrate, publish dry run against the committed manifest at f07b11f.
- `logs/gates-f07b11f.out`: box gates at this head (lint:content, lint:migrations, tsc, eslint, unit, int, OpenNext).
