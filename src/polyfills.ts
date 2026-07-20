// Node globals for the browser. This module MUST be the first import of the
// entrypoint: ES imports are hoisted and evaluated in order, so putting the
// assignment here guarantees it runs before web3.js / spl-token modules that
// may touch Buffer during their own module initialization.
import { Buffer } from 'buffer'

const g = globalThis as typeof globalThis & { Buffer?: typeof Buffer; global?: typeof globalThis }
g.Buffer ??= Buffer
g.global ??= globalThis
