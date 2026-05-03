import { BOARD, CHANCE_CARDS, COMMUNITY_CARDS, PLAYER_COLORS } from "./data.js";

const STARTING_CASH = 1500;
const GO_CASH = 200;
const JAIL_INDEX = 10;

export class MonopolyGame {
  constructor() {
    this.board = BOARD.map((space, index) => ({
      ...space,
      index,
      ownerId: null,
      houses: 0,
      mortgaged: false,
    }));
    this.players = [];
    this.currentPlayerIndex = 0;
    this.started = false;
    this.lastRoll = null;
    this.doublesInRow = 0;
    this.awaitingAction = false;
    this.logs = [];
    this.chanceDeck = shuffle([...CHANCE_CARDS]);
    this.communityDeck = shuffle([...COMMUNITY_CARDS]);
  }

  start(playerCount) {
    this.players = Array.from({ length: playerCount }, (_, index) => ({
      id: index,
      name: `Spieler ${index + 1}`,
      token: String(index + 1),
      color: PLAYER_COLORS[index],
      cash: STARTING_CASH,
      position: 0,
      inJail: false,
      jailTurns: 0,
      bankrupt: false,
      properties: [],
      isAi: false,
    }));
    this.currentPlayerIndex = 0;
    this.started = true;
    this.lastRoll = null;
    this.doublesInRow = 0;
    this.awaitingAction = false;
    this.logs = ["Spiel gestartet. Jeder Spieler erhaelt 1500 M."];
  }

  get currentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  rollDice() {
    if (!this.started || this.awaitingAction) return;
    const player = this.currentPlayer;
    if (player.bankrupt) return this.endTurn();

    const dieOne = randomDie();
    const dieTwo = randomDie();
    const total = dieOne + dieTwo;
    const isDouble = dieOne === dieTwo;
    this.lastRoll = { dieOne, dieTwo, total, isDouble };

    if (player.inJail) {
      this.handleJailRoll(player, isDouble, total);
      return;
    }

    this.doublesInRow = isDouble ? this.doublesInRow + 1 : 0;
    this.log(`${player.name} wuerfelt ${dieOne} + ${dieTwo}.`);

    if (this.doublesInRow === 3) {
      this.log(`${player.name} hat drei Pasche in Folge und geht ins Gefaengnis.`);
      this.sendToJail(player);
      this.awaitingAction = false;
      return;
    }

    this.movePlayer(player, total);
    this.resolveLanding(player);
  }

  handleJailRoll(player, isDouble, total) {
    player.jailTurns += 1;
    this.log(`${player.name} wuerfelt im Gefaengnis ${this.lastRoll.dieOne} + ${this.lastRoll.dieTwo}.`);
    if (isDouble) {
      player.inJail = false;
      player.jailTurns = 0;
      this.log(`${player.name} kommt mit einem Pasch frei.`);
      this.movePlayer(player, total);
      this.resolveLanding(player);
      return;
    }

    if (player.jailTurns >= 3) {
      this.transferToBank(player, 50, "Gefaengnisgebuehr nach drei Versuchen");
      player.inJail = false;
      player.jailTurns = 0;
      this.movePlayer(player, total);
      this.resolveLanding(player);
      return;
    }

    this.log(`${player.name} bleibt im Gefaengnis.`);
    this.awaitingAction = false;
  }

  payJailFine() {
    const player = this.currentPlayer;
    if (!player.inJail || this.awaitingAction) return;
    this.transferToBank(player, 50, "Gefaengnisgebuehr");
    player.inJail = false;
    player.jailTurns = 0;
    this.log(`${player.name} zahlt 50 M und ist frei.`);
  }

  movePlayer(player, steps) {
    const previous = player.position;
    player.position = mod(player.position + steps, this.board.length);
    if (steps > 0 && player.position < previous) {
      player.cash += GO_CASH;
      this.log(`${player.name} kommt ueber LOS und erhaelt 200 M.`);
    }
  }

  resolveLanding(player, rentModifier = 1) {
    const space = this.board[player.position];
    this.log(`${player.name} landet auf ${space.name}.`);

    if (space.type === "property" || space.type === "railroad" || space.type === "utility") {
      this.resolveOwnable(player, space, rentModifier);
      return;
    }

    if (space.type === "tax") {
      this.transferToBank(player, space.amount, space.name);
      return;
    }

    if (space.type === "chance") {
      this.drawCard("chance");
      return;
    }

    if (space.type === "community") {
      this.drawCard("community");
      return;
    }

    if (space.type === "goToJail") {
      this.sendToJail(player);
      return;
    }

    if (space.type === "freeParking") {
      this.log("Frei Parken ist nach offiziellen Regeln ein freies Feld.");
    }
  }

  resolveOwnable(player, space, rentModifier) {
    if (space.ownerId === null) {
      this.awaitingAction = true;
      this.log(`${space.name} kann fuer ${space.price} M gekauft werden.`);
      return;
    }

    if (space.ownerId === player.id || space.mortgaged) return;

    const owner = this.players[space.ownerId];
    const rent = this.calculateRent(space, this.lastRoll?.total ?? 0) * rentModifier;
    this.payPlayer(player, owner, rent, `Miete fuer ${space.name}`);
  }

  buyCurrentProperty() {
    const player = this.currentPlayer;
    const space = this.board[player.position];
    if (!this.awaitingAction || !isOwnable(space) || space.ownerId !== null) return;
    if (player.cash < space.price) {
      this.log(`${player.name} hat nicht genug Geld fuer ${space.name}.`);
      return;
    }
    this.transferToBank(player, space.price, `Kauf von ${space.name}`);
    space.ownerId = player.id;
    player.properties.push(space.index);
    this.awaitingAction = false;
    this.log(`${player.name} kauft ${space.name}.`);
  }

  skipBuy() {
    const player = this.currentPlayer;
    const space = this.board[player.position];
    if (!this.awaitingAction || !isOwnable(space)) return;
    this.awaitingAction = false;
    this.log(`${player.name} kauft ${space.name} nicht. Auktionen werden als naechster Mechanik-Schritt ausgebaut.`);
  }

  buildHouse(spaceIndex) {
    const player = this.currentPlayer;
    const space = this.board[spaceIndex];
    if (!this.canBuild(player, space)) return;
    this.transferToBank(player, space.houseCost, `Hausbau auf ${space.name}`);
    space.houses += 1;
    this.log(`${player.name} baut auf ${space.name}.`);
  }

  mortgage(spaceIndex) {
    const player = this.currentPlayer;
    const space = this.board[spaceIndex];
    if (space.ownerId !== player.id || space.mortgaged || space.houses > 0) return;
    space.mortgaged = true;
    player.cash += space.mortgage;
    this.log(`${player.name} belastet ${space.name} mit einer Hypothek und erhaelt ${space.mortgage} M.`);
  }

  redeemMortgage(spaceIndex) {
    const player = this.currentPlayer;
    const space = this.board[spaceIndex];
    const cost = Math.ceil(space.mortgage * 1.1);
    if (space.ownerId !== player.id || !space.mortgaged || player.cash < cost) return;
    this.transferToBank(player, cost, `Hypothek abloesen: ${space.name}`);
    space.mortgaged = false;
  }

  drawCard(deckName) {
    const deck = deckName === "chance" ? this.chanceDeck : this.communityDeck;
    const card = deck.shift();
    deck.push(card);
    this.log(`${deckName === "chance" ? "Ereignis" : "Gemeinschaft"}: ${card.text}`);
    this.applyCard(card);
  }

  applyCard(card) {
    const player = this.currentPlayer;
    const effect = card.effect;
    if (effect.money) this.applyMoney(player, effect.money);
    if (effect.payEachPlayer) {
      this.players.filter((target) => target.id !== player.id && !target.bankrupt).forEach((target) => {
        this.payPlayer(player, target, effect.payEachPlayer, card.text);
      });
    }
    if (effect.collectEachPlayer) {
      this.players.filter((target) => target.id !== player.id && !target.bankrupt).forEach((target) => {
        this.payPlayer(target, player, effect.collectEachPlayer, card.text);
      });
    }
    if (effect.jail) this.sendToJail(player);
    if (Number.isInteger(effect.moveBy)) {
      this.movePlayer(player, effect.moveBy);
      this.resolveLanding(player);
    }
    if (Number.isInteger(effect.moveTo)) {
      this.moveTo(player, effect.moveTo, effect.collectGo);
      this.resolveLanding(player);
    }
    if (effect.nearest) {
      const target = this.findNearest(player.position, effect.nearest);
      this.moveTo(player, target, true);
      this.resolveLanding(player, effect.doubleRent ? 2 : 1);
    }
  }

  endTurn() {
    if (!this.started || this.awaitingAction) return;
    const player = this.currentPlayer;
    const earnedExtraTurn = this.lastRoll?.isDouble && !player.inJail && this.doublesInRow > 0;
    if (earnedExtraTurn) {
      this.log(`${player.name} hat einen Pasch und ist nochmal dran.`);
      this.lastRoll = null;
      return;
    }
    this.currentPlayerIndex = this.nextActivePlayerIndex();
    this.doublesInRow = 0;
    this.lastRoll = null;
    this.log(`${this.currentPlayer.name} ist am Zug.`);
  }

  calculateRent(space, rollTotal) {
    if (space.type === "railroad") {
      const owner = this.players[space.ownerId];
      const count = owner.properties.filter((index) => this.board[index].type === "railroad").length;
      return [25, 50, 100, 200][count - 1] ?? 25;
    }
    if (space.type === "utility") {
      const owner = this.players[space.ownerId];
      const count = owner.properties.filter((index) => this.board[index].type === "utility").length;
      return rollTotal * (count === 2 ? 10 : 4);
    }
    if (space.type === "property") {
      if (space.houses > 0) return space.rents[space.houses];
      return this.ownsFullGroup(space.ownerId, space.group) ? space.rents[0] * 2 : space.rents[0];
    }
    return 0;
  }

  canBuild(player, space) {
    return Boolean(
      space &&
        space.type === "property" &&
        space.ownerId === player.id &&
        !space.mortgaged &&
        space.houses < 5 &&
        player.cash >= space.houseCost &&
        this.ownsFullGroup(player.id, space.group),
    );
  }

  ownsFullGroup(playerId, group) {
    const groupSpaces = this.board.filter((space) => space.type === "property" && space.group === group);
    return groupSpaces.every((space) => space.ownerId === playerId && !space.mortgaged);
  }

  transferToBank(player, amount, reason) {
    player.cash -= amount;
    this.log(`${player.name} zahlt ${amount} M an die Bank. ${reason}.`);
    this.checkBankruptcy(player);
  }

  payPlayer(from, to, amount, reason) {
    from.cash -= amount;
    to.cash += amount;
    this.log(`${from.name} zahlt ${amount} M an ${to.name}. ${reason}.`);
    this.checkBankruptcy(from);
  }

  applyMoney(player, amount) {
    player.cash += amount;
    this.log(amount >= 0 ? `${player.name} erhaelt ${amount} M.` : `${player.name} zahlt ${Math.abs(amount)} M.`);
    this.checkBankruptcy(player);
  }

  checkBankruptcy(player) {
    if (player.cash >= 0 || player.bankrupt) return;
    player.bankrupt = true;
    this.board.forEach((space) => {
      if (space.ownerId === player.id) {
        space.ownerId = null;
        space.houses = 0;
        space.mortgaged = false;
      }
    });
    player.properties = [];
    this.log(`${player.name} ist bankrott. Besitz geht zurueck an die Bank.`);
  }

  moveTo(player, targetIndex, collectGo = false) {
    if (collectGo && targetIndex < player.position) {
      player.cash += GO_CASH;
      this.log(`${player.name} kommt ueber LOS und erhaelt 200 M.`);
    }
    player.position = targetIndex;
  }

  sendToJail(player) {
    player.position = JAIL_INDEX;
    player.inJail = true;
    player.jailTurns = 0;
    this.doublesInRow = 0;
  }

  findNearest(fromIndex, type) {
    for (let offset = 1; offset <= this.board.length; offset += 1) {
      const index = (fromIndex + offset) % this.board.length;
      if (this.board[index].type === type) return index;
    }
    return fromIndex;
  }

  nextActivePlayerIndex() {
    for (let offset = 1; offset <= this.players.length; offset += 1) {
      const index = (this.currentPlayerIndex + offset) % this.players.length;
      if (!this.players[index].bankrupt) return index;
    }
    return this.currentPlayerIndex;
  }

  log(message) {
    this.logs.unshift(message);
    this.logs = this.logs.slice(0, 80);
  }
}

function isOwnable(space) {
  return ["property", "railroad", "utility"].includes(space.type);
}

function randomDie() {
  return Math.floor(Math.random() * 6) + 1;
}

function shuffle(items) {
  return items
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}

function mod(value, length) {
  return ((value % length) + length) % length;
}
