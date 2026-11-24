/** PCG32 XSH-RR — engine_version documents this implementation. */
export const RNG_VERSION = "pcg32-xsh-rr-v1";

const MASK32 = 0xffffffffn;
const MASK64 = 0xffffffffffffffffn;
const MUL = 6364136223846793005n;
const INC = 14426950461296721713n; // odd

export class Pcg32 {
  private state: bigint;

  constructor(seed: bigint) {
    this.state = 0n;
    this.step();
    this.state = (this.state + (seed & MASK64)) & MASK64;
    this.step();
  }

  private step(): void {
    this.state = (this.state * MUL + INC) & MASK64;
  }

  /** Uniform uint32 */
  nextUint32(): number {
    const old = this.state;
    this.step();
    const xorshifted = Number((((old >> 18n) ^ old) >> 27n) & MASK32);
    const rot = Number((old >> 59n) & 0x1fn);
    return ((xorshifted >>> rot) | (xorshifted << ((-rot) & 31))) >>> 0;
  }

  /**
   * Uniform integer in [0, bound) via rejection sampling.
   * bound must be a positive integer <= 2^32.
   */
  nextBelow(bound: number): number {
    if (!Number.isInteger(bound) || bound <= 0 || bound > 0x100000000) {
      throw new RangeError(`invalid bound: ${bound}`);
    }
    if (bound === 1) return 0;
    const threshold = (0x100000000 % bound) >>> 0;
    for (;;) {
      const r = this.nextUint32();
      if (r >= threshold) return r % bound;
    }
  }
}

export function parseSeed(seed: string): bigint {
  const trimmed = seed.trim();
  if (!/^\d+$/.test(trimmed)) {
    throw new Error("seed must be a non-negative decimal integer string");
  }
  return BigInt(trimmed);
}

export function createSeed(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let value = 0n;
  for (const b of bytes) {
    value = (value << 8n) | BigInt(b);
  }
  return value.toString();
}
