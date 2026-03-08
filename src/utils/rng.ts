/**
 * Seeded pseudo-random number generator (Mulberry32).
 *
 * Fast, deterministic PRNG for reproducible skybox generation.
 * Takes a 32-bit integer seed and produces uniform [0, 1) values.
 */

export class SeededRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed | 0;
  }

  /** Get next random number in [0, 1) */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Get a random float in [min, max) */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** Get a random integer in [min, max] inclusive */
  intRange(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  /** Get a random value from a normal distribution (Box-Muller) */
  gaussian(mean = 0, stddev = 1): number {
    const u1 = this.next();
    const u2 = this.next();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z * stddev;
  }

  /** Reset the PRNG with a new seed */
  reset(seed: number): void {
    this.state = seed | 0;
  }
}
