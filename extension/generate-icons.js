// Script to generate valid PNG icons for HireCompass extension
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createSolidPNG(width, height, r, g, b, a = 255) {
  // Construct a minimal uncompressed/compressed PNG
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: 6 (RGBA)
  ihdrData[10] = 0; // Compression method
  ihdrData[11] = 0; // Filter method
  ihdrData[12] = 0; // Interlace method
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image data with scanline filters (filter byte 0 = None)
  const rawBytes = [];
  const cx = width / 2;
  const cy = height / 2;
  const radius = width / 2 - 1;

  for (let y = 0; y < height; y++) {
    rawBytes.push(0); // filter: None
    for (let x = 0; x < width; x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist <= radius) {
        // Gradient from indigo (79, 70, 229) to violet (147, 51, 234)
        const t = (x + y) / (width + height);
        const red = Math.round(79 + (147 - 79) * t);
        const green = Math.round(70 + (51 - 70) * t);
        const blue = Math.round(229 + (234 - 229) * t);

        // Center compass diamond highlight in pure white
        const dx = Math.abs(x - cx);
        const dy = Math.abs(y - cy);
        if (dx + dy <= radius * 0.55 && (dx <= 1.5 || dy <= 1.5 || dx + dy <= radius * 0.35)) {
          rawBytes.push(255, 255, 255, 255);
        } else {
          rawBytes.push(red, green, blue, 255);
        }
      } else {
        rawBytes.push(0, 0, 0, 0); // transparent outside circle
      }
    }
  }

  const compressedData = zlib.deflateSync(Buffer.from(rawBytes));
  const idatChunk = createChunk('IDAT', compressedData);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const buffer = Buffer.alloc(8 + length + 4);
  buffer.writeUInt32BE(length, 0);
  buffer.write(type, 4, 4, 'ascii');
  data.copy(buffer, 8);

  const crc = crc32(buffer.subarray(4, 8 + length));
  buffer.writeUInt32BE(crc, 8 + length);
  return buffer;
}

// Standard CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

fs.writeFileSync(path.join(iconsDir, 'icon16.png'), createSolidPNG(16, 16));
fs.writeFileSync(path.join(iconsDir, 'icon48.png'), createSolidPNG(48, 48));
fs.writeFileSync(path.join(iconsDir, 'icon128.png'), createSolidPNG(128, 128));
console.log('Icons generated successfully!');
