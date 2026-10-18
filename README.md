# Sweatpants vs Dory — The Decider

A match page for a friendly 6-a-side: if Dory lose, Sweatpants take their place in the school tournament.

Live: https://ahmedps520-svg.github.io/sweatpants-vs-dory/

- **Countdown, venue and score** come from Supabase (`bet_matches`), so changing them there updates every phone at once. No redeploy needed. See the bottom of [`sql/setup.sql`](sql/setup.sql) for the one-line updates (set the date, go live, full time).
- **Predictions** are saved in `bet_votes`: one changeable vote per device, closed at kick-off.
- **Line-ups and positions** are at the top of [`assets/js/main.js`](assets/js/main.js) (`TEAMS`).
- Preview other states without changing anything: `?preview=count`, `?preview=live`, `?preview=ft`, `?preview=ftb`, `?preview=draw`.

Plain HTML, CSS and JS. No build step. Site by [Mamar](https://mamar.site).
