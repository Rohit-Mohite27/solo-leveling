# Solo Leveling

Personal daily-quest tracker for a small friend group. Game-HUD theme; no leaderboard — you only compete with yourself.

## Demo UI (v1 mock)

Static / client-side demo (localStorage). Screens:

1. **Gate** (`/`) — brand + Enter the Gate  
2. **Hunter Status** (`/status`) — level, XP, streak, CTA  
3. **Daily Quest** (`/daily`) — log counts / Done·Skip, submit day  
4. **Quest Board** (`/board`) — add / remove personal quests  
5. **Level-up overlay** — ally greeting (stylized silhouette)

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Quick demo path

1. Enter a hunter name → **Enter the Gate**  
2. Open **Log today's quests**  
3. Meet or exceed each target (Done on Gym)  
4. **Submit day to System** → Level 2 + Yoo Jinho greeting on first full clear  

## Locked for this demo

- Strict streak (Partial breaks it)  
- Personal quest packs only  
- No party / leaderboard  
- Honor system (typed amounts, no proof)
