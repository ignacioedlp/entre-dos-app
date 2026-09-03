/* global Buffer */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const sampleRate = 44100;

function writeWav(path, duration, sampleAt) {
  const sampleCount = Math.floor(sampleRate * duration);
  const dataSize = sampleCount * 2;
  const wav = Buffer.alloc(44 + dataSize);
  wav.write('RIFF', 0);
  wav.writeUInt32LE(36 + dataSize, 4);
  wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(dataSize, 40);

  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate;
    const value = Math.max(-1, Math.min(1, sampleAt(time, index)));
    wav.writeInt16LE(Math.round(value * 32767), 44 + index * 2);
  }

  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, wav);
}

let seed = 0x2f6e2b1;
let previousNoise = 0;
function deterministicNoise() {
  seed = (1664525 * seed + 1013904223) >>> 0;
  return (seed / 0xffffffff) * 2 - 1;
}

const output = resolve('assets/audio');

writeWav(resolve(output, 'pack-tear.wav'), 0.46, (time) => {
  const noise = deterministicNoise();
  const highPass = noise - previousNoise * 0.82;
  previousNoise = noise;
  const crinkle = 0.42 + 0.58 * Math.abs(Math.sin(time * 73));
  const envelope = Math.sin(Math.PI * Math.min(time / 0.46, 1)) ** 0.65;
  return highPass * crinkle * envelope * 0.34;
});

writeWav(resolve(output, 'card-reveal.wav'), 0.34, (time) => {
  const progress = time / 0.34;
  const frequency = 260 + progress * progress * 760;
  const envelope = Math.sin(Math.PI * progress) ** 1.5;
  return Math.sin(2 * Math.PI * frequency * time) * envelope * 0.2;
});

let previousCardNoise = 0;
writeWav(resolve(output, 'card-slide.wav'), 0.18, (time) => {
  const progress = time / 0.18;
  const noise = deterministicNoise();
  const paperFriction = noise - previousCardNoise * 0.7;
  previousCardNoise = noise;
  const envelope = Math.sin(Math.PI * progress) ** 0.55;
  const edgeContact = Math.exp(-Math.abs(time - 0.035) * 115);
  return paperFriction * envelope * 0.12 + edgeContact * 0.045;
});

writeWav(resolve(output, 'confirm.wav'), 0.42, (time) => {
  const first = Math.sin(2 * Math.PI * 523.25 * time) * Math.exp(-time * 9);
  const secondTime = Math.max(0, time - 0.11);
  const second =
    time >= 0.11 ? Math.sin(2 * Math.PI * 659.25 * secondTime) * Math.exp(-secondTime * 8) : 0;
  return (first + second) * 0.23;
});
