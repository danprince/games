import { delta, draw, Rectangle, Sprite, stamp } from ".";

/**
 * An object pool for particles. Once a particle is removed from an emitter
 * it should be returned to this pool.
 */
let _pool: Particle[] = [];

/**
 * All active particle emitters.
 */
let _emitters: ParticleEmitter[] = [];

export class Particle {
  /**
   * The current x coordinate of the particle.
   */
  x: number = 0;
  /**
   * The current y coordinate of the particle.
   */
  y: number = 0;
  /**
   * The particle's horizontal velocity in pixels per second.
   */
  vx: number = 0;
  /**
   * The particle's vertical velocity in pixels per second.
   */
  vy: number = 0;
  /**
   * The bounciness of the particle (0 is no bounce, 1 is a full bounce).
   */
  bounce: number = 0;
  /**
   * The number of milliseconds this particle has been alive for.
   */
  elapsed: number = 0;
  /**
   * The number of milliseconds this particle will be alive for.
   */
  duration: number = 0;
  /**
   * The particle's variant index (see {@link ParticleEmitter}).
   */
  variant: number = 0;
  /**
   * The mass of this particle. Non-zero values affect the particles vertical
   */
  mass: number = 0;
  /**
   * The friction to apply to this particle when it bounces.
   */
  friction: number = 0;
}

/**
 * A particle defined by a bit pattern (see {@link stamp}) and a CSS color.
 */
type Stamp = [pattern: number, color: string];

/**
 * A visual state for a particle as a {@link Sprite} or a {@link Stamp}.
 */
type Variant = Sprite | Stamp;

/**
 * A potential range of values, described by a base number and a max
 * spread.
 */
type Range = [base: number, spread: number];

function randomFromRange([base, spread]: Range): number {
  return base + Math.random() * spread;
}

type ParticleEmitterConfig = Pick<
  ParticleEmitter,
  | keyof Rectangle
  | "variants"
  | "frequency"
  | "velocity"
  | "angle"
  | "duration"
  | "bounce"
  | "friction"
  | "mass"
>;

export class ParticleEmitter implements Rectangle {
  /**
   * The active particles in this emitter.
   */
  particles = new Set<Particle>();

  /**
   * The x coordinate for the top left of this emitter.
   */
  x: number = 0;
  /**
   * The y coordinate for the top left of this emitter.
   */
  y: number = 0;
  /**
   * The width of the emitter (particles will spawn at a random position
   * inside these bounds).
   */
  w: number = 0;
  /**
   * The height of the emitter (particles will spawn at a random position
   * inside these bounds).
   */
  h: number = 0;

  /**
   * A list of visual variations over time. When a particle is created it will
   * pick one of these variants, then over time it will move through each of
   * the steps defined inside.
   */
  variants: Variant[][] = [];
  /**
   * The number of particles this emitter will emit each frame.
   */
  frequency: number = 0;
  /**
   * A range of values to use for initial particle velocity. Note: this is a
   * scalar value and is combined with {@link angle} to create the actual
   * velocity.
   */
  velocity: Range = [0, 0];
  /**
   * A range of values to use for initial particle angle.
   */
  angle: Range = [0, 0];
  /**
   * A range of values to use for particle durations.
   */
  duration: Range = [0, 0];
  /**
   * A range of values to use for particle bounce.
   */
  bounce: Range = [0, 0];
  /**
   * A range of values to use for particle friction.
   */
  friction: Range = [0, 0];
  /**
   * A range of values to use for particle mass.
   */
  mass: Range = [0, 0];

  /**
   * The internal clock used to manage spawn frequencies.
   */
  private clock = 0;

  /**
   * A flag that represents whether this particle emitter has been removed.
   */
  private done = false;

  constructor(props: Partial<ParticleEmitterConfig>) {
    Object.assign(this, props);
    _emitters.push(this);
  }

  /**
   * Mark the emitter as done, which will cause the emitter to stop creating
   * particles. Once there are no active particles left, it will be removed
   * automatically.
   */
  stop() {
    this.done = true;
  }

  /**
   * Update the internal state of the emitter and all the particles inside.
   */
  update() {
    let dt = delta();
    let t = dt / 1000;
    this.clock += this.frequency;

    while (!this.done && this.clock > 0) {
      this.clock -= 1;
      this.emit();
    }

    for (let p of this.particles) {
      p.elapsed += dt;
      p.x += p.vx * t;
      p.y += p.vy * t;
      p.vy -= p.mass * t;

      if (p.y <= 0) {
        p.y = 0;
        p.vy *= -p.bounce;
        p.vx *= p.friction;
      }

      if (p.elapsed >= p.duration) {
        this.particles.delete(p);
        _pool.push(p);
      }
    }

    if (this.done && this.particles.size === 0) {
      _emitters.splice(_emitters.indexOf(this), 1);
    }
  }

  /**
   * Emit a single new particle.
   */
  emit() {
    let p = _pool.pop() || new Particle();
    let velocity = randomFromRange(this.velocity);
    let angle = randomFromRange(this.angle);
    p.x = randomFromRange([this.x, this.w]);
    p.y = randomFromRange([this.y, this.h]);
    p.vx = Math.cos(angle) * velocity;
    p.vy = Math.sin(angle) * velocity;
    p.elapsed = 0;
    p.duration = randomFromRange(this.duration);
    p.bounce = randomFromRange(this.bounce);
    p.friction = randomFromRange(this.friction);
    p.mass = randomFromRange(this.mass);
    p.variant = Math.floor(randomFromRange([0, this.variants.length]));
    this.particles.add(p);
  }

  /**
   * Emit a burst of particles simultaneously.
   */
  burst(count: number) {
    for (let i = 0; i < count; i++) {
      this.emit();
    }
  }

  /**
   * Render the particles in this emitter.
   */
  render() {
    for (let p of this.particles) {
      let variant = this.variants[p.variant];
      let progress = p.elapsed / p.duration;
      let spriteOrStamp = variant[progress * variant.length | 0];

      if (Array.isArray(spriteOrStamp)) {
        stamp(spriteOrStamp[0], p.x - 2, p.y - 2, spriteOrStamp[1]);
      } else {
        draw(
          spriteOrStamp,
          p.x - spriteOrStamp.w / 2,
          p.y - spriteOrStamp.h / 2,
        );
      }
    }
  }
}

/**
 * Update all active particle emitters.
 */
export function updateParticles() {
  for (let emitter of _emitters) {
    emitter.update();
  }
}

/**
 * Render all active particle emitters.
 */
export function renderParticles() {
  for (let emitter of _emitters) {
    emitter.render();
  }
}
