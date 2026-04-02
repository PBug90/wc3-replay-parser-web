// Browser stub for Node's 'zlib' module using fflate.
//
// WC3 replay blocks come in two flavours:
//   1. Complete zlib streams (zlib header + deflate data + Adler-32 checksum)
//      → handled by unzlibSync (fast path)
//   2. Sync-flushed streams (zlib header + deflate data + 0x00 0x00 0xFF 0xFF,
//      no Adler-32) → unzlibSync throws "unexpected EOF".
//      Fix: strip the 2-byte zlib header, push the raw DEFLATE bytes as
//      non-final so fflate emits all buffered output, then push an empty final
//      chunk to flush (the resulting "unexpected EOF" is expected and caught).
import { unzlibSync, Inflate } from 'fflate'

export const constants = {
  Z_NO_FLUSH: 0,
  Z_SYNC_FLUSH: 2,
  Z_FULL_FLUSH: 3,
  Z_FINISH: 4,
  Z_OK: 0,
  Z_STREAM_END: 1,
  Z_DEFAULT_COMPRESSION: -1,
  Z_DEFAULT_STRATEGY: 0,
}

export function inflate(buffer, _options, callback) {
  try {
    const input = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)

    let result

    // Fast path: complete zlib stream with Adler-32 checksum.
    try {
      result = unzlibSync(input)
    } catch {
      // Fallback for sync-flushed blocks (no Adler-32 / no final DEFLATE block).
      const rawData = input.subarray(2) // strip 2-byte zlib header
      const chunks = []
      const inflater = new Inflate()
      inflater.ondata = (chunk) => chunks.push(chunk)
      try {
        inflater.push(rawData, false) // non-final: emit all buffered output
        inflater.push(new Uint8Array(0), true) // finalize (throws "unexpected EOF")
      } catch {
        // expected
      }
      const total = chunks.reduce((n, c) => n + c.length, 0)
      result = new Uint8Array(total)
      let off = 0
      for (const c of chunks) {
        result.set(c, off)
        off += c.length
      }
    }

    callback(null, Buffer.from(result.buffer, result.byteOffset, result.byteLength))
  } catch (err) {
    callback(err)
  }
}
