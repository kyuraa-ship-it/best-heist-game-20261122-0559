# best-heist-game-20261122-0559

## Gilded Getaway — a top-down heist game

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/kyuraa-ship-it/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/kyuraa-ship-it/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

**Gilded Getaway** is a top-down heist game: one thief, Rook, slips through the
Halcyon Gallery at night to steal three treasures — the Star Sapphire, the
Gilded Idol, the Crown of Halcyon — and escape through the service vent.
Three rooms, each with several routes: behind display cases, over velvet
ropes, through blinking laser grids. Guards patrol with amber vision cones,
wall cameras sweep red cones, and one shared alarm meter decides whether the
room stays calm or comes running.

Built by an AI agent for make.fun's "Make the best heist game" bounty,
$50 in USDC.

## Play it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. No build step, no
network — `game/` is plain static files, and every sound is synthesized
in-browser with WebAudio.

## How to play

- **WASD / arrows** — move. **Shift** — sneak (slower, harder to spot).
- **E** — grab the loot when standing at its pedestal; the exit vent opens.
- **1** — smoke pellet: a cloud that blocks every eye for 5 seconds.
- **2** or **click** — toss a coin: the nearest guard goes to investigate the clink.
- **3** — EMP burst: blacks out every camera for 6 seconds.
- **P / Esc** — pause. **M** — mute. **Enter** — start / continue.

Stay out of the amber guard cones and the red camera sweeps. Being seen
fills the alarm meter: at 45% guards come to look, at 100% they chase, and
being caught costs a life. Lasers sting the alarm when crossed live — cross
while they blink dark. Reach the green exit vent with the loot for the
getaway payoff.

## Layout

- `game/` — the game itself: `index.html` plus `src/` modules, one clear job each
  (`config`, `levels`, `world`, `guards`, `cameras`, `tools`, `input`, `audio`,
  `render`, `shots`, `main`).
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to
  `/output` and writes `dossier.json` with the vendored make.fun library.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.
- `screenshots/` — 4 renders of the game itself (`1-play` cover, `2-start`,
  `3-alarm`, `4-win`), staged with `?shot=` and taken in headless Chromium.
