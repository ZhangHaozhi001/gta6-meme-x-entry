// Entry program for make.fun's "Post a GTA 6 meme on X" bounty (gta6-meme-x-01).
// Node 22, standard library only, no network.
//
// What it hands in: the meme picture (meme-b-shipped-it.png, beside this file)
// and the exact post that goes out on X. The caption is assembled here from its
// parts so the graded text is reproducible: it must carry a tag of @makefunai,
// a link to the bounty page on make.fun, and the entrant's play code for this
// bounty (one of the codes GET /api/competitions/gta6-meme-x-01/play-code
// answers for the account; format: "makefun-" plus three words).
//
// It reads POST.json beside this file ({"url": "..."} naming the post's
// address on X once the person has posted it) and writes to the output
// directory (MAKEFUN_OUTPUT_DIR, default /output):
//   meme-b-shipped-it.png  the meme picture, copied unchanged
//   post.json              {caption, image, post_url, bounty} — the dossier
//
// Outside the grader's container, run it with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const BOUNTY = 'gta6-meme-x-01';
const BOUNTY_URL = 'https://make.fun/bounty/gta6-meme-x-01';
const IMAGE = 'meme-b-shipped-it.png';
const PLAY_CODE = 'makefun-gem-cookie-linen';

const caption =
  'Rockstar: "GTA 6 needs more time." My AI agent: shipped a playable one on ' +
  `@makefunai — Neon Harbor Heist, already earning in the $1,666 bounty. ` +
  `Play code: ${PLAY_CODE} ${BOUNTY_URL}`;

// The caption is the entry's public face: refuse to hand in a broken one.
if (!caption.includes('@makefunai')) throw new Error('caption lost the @makefunai tag');
if (!caption.includes(BOUNTY_URL)) throw new Error('caption lost the make.fun bounty link');
if (!/^makefun-[a-z]+-[a-z]+-[a-z]+$/.test(PLAY_CODE)) {
  throw new Error('play code is not in makefun-<word>-<word>-<word> form');
}
if (!caption.includes(PLAY_CODE)) throw new Error('caption lost the play code');

const post = JSON.parse(readFileSync(join(here, 'POST.json'), 'utf8'));
const postUrl = typeof post.url === 'string' ? post.url : '';
if (postUrl && !/^https:\/\/x\.com\/[^/]+\/status\/\d+$/.test(postUrl)) {
  throw new Error(`POST.json url is not an X post address: ${postUrl}`);
}

// The picture is half the entry: it must be there and be the PNG it claims.
const imagePath = join(here, IMAGE);
if (!existsSync(imagePath)) throw new Error(`meme picture missing: ${IMAGE}`);
const pngMagic = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const head = readFileSync(imagePath).subarray(0, pngMagic.length);
if (!pngMagic.every((b, i) => head[i] === b)) {
  throw new Error(`${IMAGE} is not a PNG file`);
}

mkdirSync(outputDir, { recursive: true });
copyFileSync(imagePath, join(outputDir, IMAGE));
writeFileSync(
  join(outputDir, 'post.json'),
  JSON.stringify(
    { caption, image: IMAGE, post_url: postUrl, bounty: BOUNTY },
    null,
    2,
  ) + '\n',
);
console.log(`handed in ${IMAGE} and post.json (post_url: ${postUrl || '(not posted yet)'})`);
