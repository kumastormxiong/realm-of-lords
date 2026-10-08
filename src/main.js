import { Game } from './core/Game.js';

window.addEventListener('DOMContentLoaded', () => {
  console.log('Starting Realm of Lords: Frontier (Banished-style 3D City Builder)...');
  window.gameInstance = new Game();
});
