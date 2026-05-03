import { GROUPS } from "./data.js";

const BOARD_SIZE = 11;

export class MonopolyUi {
  constructor(game) {
    this.game = game;
    this.boardEl = document.querySelector("#board");
    this.playersEl = document.querySelector("#players");
    this.actionPanelEl = document.querySelector("#actionPanel");
    this.portfolioEl = document.querySelector("#portfolio");
    this.logEl = document.querySelector("#log");
    this.turnSummaryEl = document.querySelector("#turnSummary");
    this.dieOneEl = document.querySelector("#dieOne");
    this.dieTwoEl = document.querySelector("#dieTwo");
    this.rollButton = document.querySelector("#rollDice");
    this.endTurnButton = document.querySelector("#endTurn");
  }

  bind() {
    document.querySelector("#startGame").addEventListener("click", () => {
      const count = Number(document.querySelector("#playerCount").value);
      this.game.start(count);
      this.render();
    });

    this.rollButton.addEventListener("click", () => {
      this.game.rollDice();
      this.render();
    });

    this.endTurnButton.addEventListener("click", () => {
      this.game.endTurn();
      this.render();
    });

    this.render();
  }

  render() {
    this.renderBoard();
    this.renderPlayers();
    this.renderActions();
    this.renderPortfolio();
    this.renderLog();
    this.renderTurn();
  }

  renderBoard() {
    this.boardEl.innerHTML = "";
    this.game.board.forEach((space) => {
      const tile = document.createElement("article");
      tile.className = `space ${isCorner(space.index) ? "corner" : ""}`;
      const { column, row } = boardCoordinates(space.index);
      tile.style.gridColumn = String(column);
      tile.style.gridRow = String(row);

      if (space.type === "property") {
        const band = document.createElement("div");
        band.className = "color-band";
        band.style.background = GROUPS[space.group].color;
        tile.append(band);
      }

      const name = document.createElement("div");
      name.className = "space-name";
      name.textContent = space.name;
      tile.append(name);

      const price = document.createElement("div");
      price.className = "space-price";
      price.textContent = priceLabel(space);
      tile.append(price);

      if (space.ownerId !== null) {
        const owner = this.game.players[space.ownerId];
        const ownerMark = document.createElement("span");
        ownerMark.className = "owner-mark";
        ownerMark.style.background = owner.color;
        tile.append(ownerMark);
      }

      if (space.houses > 0) {
        const houses = document.createElement("div");
        houses.className = "houses";
        const count = space.houses === 5 ? 1 : space.houses;
        for (let i = 0; i < count; i += 1) {
          const marker = document.createElement("span");
          marker.className = space.houses === 5 ? "hotel" : "house";
          houses.append(marker);
        }
        tile.append(houses);
      }

      const tokens = document.createElement("div");
      tokens.className = "tokens";
      this.game.players
        .filter((player) => player.position === space.index && !player.bankrupt)
        .forEach((player) => tokens.append(this.createToken(player)));
      tile.append(tokens);

      this.boardEl.append(tile);
    });
  }

  renderPlayers() {
    this.playersEl.innerHTML = "";
    this.game.players.forEach((player, index) => {
      const card = document.createElement("article");
      card.className = `player-card ${index === this.game.currentPlayerIndex ? "active" : ""}`;
      const dot = document.createElement("span");
      dot.className = "player-dot";
      dot.style.background = player.color;
      const info = document.createElement("div");
      info.innerHTML = `<div class="player-name">${player.name}</div><div class="player-meta">${player.cash} M · ${this.game.board[player.position].name}${player.inJail ? " · Gefaengnis" : ""}</div>`;
      const count = document.createElement("strong");
      count.textContent = String(player.properties.length);
      card.append(dot, info, count);
      this.playersEl.append(card);
    });
  }

  renderActions() {
    this.actionPanelEl.innerHTML = "";
    if (!this.game.started) {
      this.actionPanelEl.textContent = "Starte ein Spiel, um Aktionen zu sehen.";
      return;
    }

    const player = this.game.currentPlayer;
    const space = this.game.board[player.position];
    const card = document.createElement("article");
    card.className = "action-card";

    const text = document.createElement("p");
    text.textContent = `${player.name} steht auf ${space.name}.`;
    card.append(text);

    const stack = document.createElement("div");
    stack.className = "button-stack";

    if (player.inJail && !this.game.awaitingAction) {
      stack.append(this.actionButton("50 M zahlen", () => this.game.payJailFine()));
    }

    if (this.game.awaitingAction && isOwnable(space) && space.ownerId === null) {
      stack.append(this.actionButton(`Kaufen (${space.price} M)`, () => this.game.buyCurrentProperty(), player.cash < space.price));
      stack.append(this.actionButton("Nicht kaufen", () => this.game.skipBuy()));
    }

    if (!stack.children.length) {
      const hint = document.createElement("p");
      hint.textContent = "Keine Sonderaktion verfuegbar.";
      card.append(hint);
    } else {
      card.append(stack);
    }

    this.actionPanelEl.append(card);
  }

  renderPortfolio() {
    this.portfolioEl.innerHTML = "";
    if (!this.game.started) return;
    const player = this.game.currentPlayer;
    if (!player.properties.length) {
      this.portfolioEl.textContent = `${player.name} besitzt noch keine Felder.`;
      return;
    }

    player.properties.forEach((index) => {
      const space = this.game.board[index];
      const row = document.createElement("article");
      row.className = "property-row";
      row.innerHTML = `<p><strong>${space.name}</strong><br>${propertyMeta(space)}</p>`;
      const actions = document.createElement("div");
      actions.className = "button-stack";
      if (space.type === "property") {
        actions.append(this.actionButton("Bauen", () => this.game.buildHouse(space.index), !this.game.canBuild(player, space)));
      }
      actions.append(this.actionButton("Hypothek", () => this.game.mortgage(space.index), space.mortgaged || space.houses > 0));
      actions.append(this.actionButton("Ablösen", () => this.game.redeemMortgage(space.index), !space.mortgaged));
      row.append(actions);
      this.portfolioEl.append(row);
    });
  }

  renderLog() {
    this.logEl.innerHTML = "";
    this.game.logs.forEach((entry) => {
      const item = document.createElement("li");
      item.textContent = entry;
      this.logEl.append(item);
    });
  }

  renderTurn() {
    const player = this.game.currentPlayer;
    this.rollButton.disabled = !this.game.started || this.game.awaitingAction || Boolean(this.game.lastRoll);
    this.endTurnButton.disabled = !this.game.started || this.game.awaitingAction || !this.game.lastRoll;
    this.turnSummaryEl.textContent = this.game.started
      ? `${player.name} ist am Zug · ${player.cash} M`
      : "Waehle die Spielerzahl und starte das Spiel.";
    this.dieOneEl.textContent = this.game.lastRoll?.dieOne ?? "-";
    this.dieTwoEl.textContent = this.game.lastRoll?.dieTwo ?? "-";
  }

  createToken(player) {
    const token = document.createElement("span");
    token.className = "token";
    token.style.background = player.color;
    token.textContent = player.token;
    token.title = player.name;
    return token;
  }

  actionButton(label, handler, disabled = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.disabled = disabled;
    button.addEventListener("click", () => {
      handler();
      this.render();
    });
    return button;
  }
}

function boardCoordinates(index) {
  if (index <= 10) return { column: BOARD_SIZE - index, row: BOARD_SIZE };
  if (index <= 20) return { column: 1, row: BOARD_SIZE - (index - 10) };
  if (index <= 30) return { column: index - 19, row: 1 };
  return { column: BOARD_SIZE, row: index - 29 };
}

function isCorner(index) {
  return [0, 10, 20, 30].includes(index);
}

function isOwnable(space) {
  return ["property", "railroad", "utility"].includes(space.type);
}

function priceLabel(space) {
  if (space.price) return `${space.price} M`;
  if (space.amount) return `Zahle ${space.amount} M`;
  return "";
}

function propertyMeta(space) {
  if (space.type === "property") {
    return `${GROUPS[space.group].label} · Miete ${space.rents[0]} M · ${space.houses === 5 ? "Hotel" : `${space.houses} Haus/Haeuser`}${space.mortgaged ? " · Hypothek" : ""}`;
  }
  if (space.type === "railroad") return `Bahnhof · ${space.mortgaged ? "Hypothek" : "aktiv"}`;
  if (space.type === "utility") return `Versorgungswerk · ${space.mortgaged ? "Hypothek" : "aktiv"}`;
  return "";
}
