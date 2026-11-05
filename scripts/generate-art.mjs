// Generate local Ironvibes artwork with Vertex AI Gemini image generation.
// Usage: node scripts/generate-art.mjs [output-file] [prompt...]
// Authentication: Application Default Credentials; never run in browser code.
import { GoogleGenAI } from '@google/genai';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(root, process.argv[2] ?? 'static/art/scenes/first-vow.webp');
const prompt = process.argv.slice(3).join(' ') || [
	'Wide atmospheric fantasy illustration for an original tabletop roleplaying campaign companion.',
	'Hand-painted storybook art with fine ink contours and translucent watercolor and gouache washes.',
	'Warm parchment cream, muted ochre, moss, verdigris teal, and subtle aged brass accents.',
	'A lone traveler in a weathered cloak stands at the edge of a windswept northern wilderness, facing a distant standing-stone gate beneath dramatic overcast skies.',
	'Quiet, grounded, mysterious mood; readable composition with open area on the left for overlaid interface text.',
	'No text, symbols, logos, watermark, border, or recognizable copyrighted characters.'
].join(' ');

const project = process.env.GCP_PROJECT;
if (!project) throw new Error('Set GCP_PROJECT in the environment (see .env.example).');

const ai = new GoogleGenAI({
	vertexai: true,
	project,
	location: process.env.GOOGLE_CLOUD_LOCATION || 'global'
});

const response = await ai.models.generateContent({
	model: process.env.ART_MODEL || 'gemini-nano-banana-2.1',
	contents: prompt,
	config: {
		responseModalities: ['IMAGE'],
		imageConfig: { aspectRatio: '16:9' }
	}
});

const image = response.candidates?.[0]?.content?.parts?.find((part) => part.inlineData)?.inlineData;
if (!image?.data) throw new Error('Vertex AI returned no image.');

await fs.mkdir(path.dirname(output), { recursive: true });
const bytes = Buffer.from(image.data, 'base64');
if (output.toLowerCase().endsWith('.png')) await fs.writeFile(output, bytes);
else await sharp(bytes).resize(1440, 810, { fit: 'cover' }).webp({ quality: 84 }).toFile(output);
console.log(`Saved generated art: ${path.relative(root, output)}`);
