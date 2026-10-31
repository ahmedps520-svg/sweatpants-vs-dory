# Sweatpants vs Dory — The Decider

A match page for a friendly 6-a-side: if Dory lose, Sweatpants take their place in the school tournament.

Live: https://ahmedps520-svg.github.io/sweatpants-vs-dory/

- **Countdown, venue and score** come from Mamar's ForgeBase (project **Mamar**, table `bet_matches`; the logic is `platform/forgebase/api/rpc/bet.js` in the mamar repo). Change them in the ForgeBase Studio → Database → `bet_matches` and every phone updates at once, no redeploy. `kickoff` is UTC, e.g. `2026-11-05T17:00:00.000Z` for 20:00 Jeddah; set `status` to `live` or `full_time` with `score_a` (Sweatpants) / `score_b` (Dory).
- **Predictions** are saved in `bet_votes`: one changeable vote per device, closed at kick-off.
- **Line-ups and positions** are at the top of [`assets/js/main.js`](assets/js/main.js) (`TEAMS`).
- Preview other states without changing anything: `?preview=count`, `?preview=live`, `?preview=ft`, `?preview=ftb`, `?preview=draw`.

Plain HTML, CSS and JS. No build step. Site by [Mamar](https://mamar.site).
