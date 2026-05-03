# Monopoly Web App

A browser-based board game prototype inspired by classic property trading games.

## Goal

Build a playable web app with:

- interactive board movement
- local multiplayer turns
- property buying and rent payments
- money tracking
- chance/community-style event cards
- simple win and bankruptcy rules

## Tech Direction

Suggested stack:

- React or Next.js for the frontend
- TypeScript for game state safety
- CSS modules or Tailwind for styling
- Zustand, Redux Toolkit, or plain reducers for game state

## Run

```bash
npm start
```

Then open `http://localhost:4173`.

No dependencies or build step are required for the current static prototype.

## Implemented

- complete 40-field board data
- 2-6 local players
- two dice and turn order
- passing LOS
- buying unowned properties
- rent for streets, stations, and utilities
- event and community cards
- jail movement, jail rolls, and jail fine
- basic mortgages
- basic house and hotel building when a player owns a full color group
- bankruptcy reset

## Next Milestones

1. Add real auctions when a player declines a purchase.
2. Add even-building validation across color groups.
3. Add selling houses/hotels back to the bank.
4. Add configurable AI players.
5. Add saved games and optional online multiplayer.

## Note

This project should use original names, artwork, card text, and board design rather than copying official Monopoly assets.
