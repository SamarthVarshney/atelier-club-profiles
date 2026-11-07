---
name: onboard-club-member
description: Onboard a new club member profile into the Atelier Club Dossier roster by adding a typed MemberProfile entry or importing an exported JSON dossier config.
---

# Onboard Club Member Dossier

Use this skill when a club member wants to add or update their profile in the Atelier Club Roster via code or pull request.

## Steps
1. Ask for or inspect the member's `@handle`, Display Name, Club Role, Department (`Engineering`, `Design`, `Sound & Media`, `Systems`, `Research`), and preferred layout (`default`, `modern`, `simplistic`, `sleek`).
2. Add or update the member entry inside `src/data/seedData.ts` (`INITIAL_MEMBERS`) or merge their exported `<handle>-atelier-dossier.json` file.
3. Run `npm run lint`, `npm test`, and `npm run build` to verify TypeScript schema conformance and build health before opening a PR.
