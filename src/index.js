import 'phaser';
import { Board } from './board.js';

var config = {
    type: Phaser.AUTO,
    width: 600,
    height: 600,
    scene: Board
};

var game = new Phaser.Game(config);