import { canvas, clear, start, ParticleEmitter, updateParticles, renderParticles } from "@danprince/games";
import * as sprites from "./sprites";

function loop() {
  clear();
  updateParticles();
  renderParticles();
}

function init() {
  let emitter = new ParticleEmitter({
    x: 100,
    y: 100,
    frequency: 0.1,
    velocity: [0, 100],
    angle: [0, Math.PI * 2],
    duration: [10, 2000],
    variants: [
      [sprites.bishop_blue, sprites.pawn_blue],
      [sprites.bishop_red, sprites.pawn_red],
    ]
  });
  emitter.burst(10);

  start({ loop });
  document.body.append(canvas);
}

init();
