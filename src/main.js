import { MonopolyGame } from "./game.js";
import { MonopolyUi } from "./ui.js";

const game = new MonopolyGame();
const ui = new MonopolyUi(game);

ui.bind();
