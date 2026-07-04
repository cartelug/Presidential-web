import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

const chapters = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/chapters' }),
  schema: z.object({
    order: z.number(),
    slug: z.string(),
    scene: z.string(),
    eyebrow: z.string(),
    title: z.string(),
    subtitle: z.string().optional(),
    standfirst: z.string().optional(),
    cta: z.string().optional(),
    dataPoints: z.array(z.string()).optional(),
  }),
});

const voices = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/voices' }),
  schema: z.object({
    order: z.number(),
    name: z.string(),
    role: z.string(),
    place: z.string(),
    category: z.string(),
  }),
});

const figures = defineCollection({
  loader: file('./src/content/figures.json'),
  schema: z.object({
    id: z.string(),
    label: z.string(),
    value1986: z.string(),
    value2026: z.string(),
    value2026Numeric: z.number().nullable(),
    unit: z.string().optional(),
    sourceId: z.string().nullable(),
  }),
});

const sources = defineCollection({
  loader: file('./src/content/sources.json'),
  schema: z.object({
    id: z.string(),
    number: z.number(),
    claim: z.string(),
    source: z.string(),
    note: z.string().optional(),
  }),
});

const assetLedger = defineCollection({
  loader: file('./src/content/asset-ledger.json'),
  schema: z.object({
    id: z.string(),
    asset: z.string(),
    chapter: z.string(),
    source: z.string(),
    licence: z.string(),
    credit: z.string(),
    cleared: z.boolean(),
  }),
});

const achievements = defineCollection({
  loader: file('./src/content/achievements.json'),
  schema: z.object({
    id: z.string(),
    order: z.number(),
    pillar: z.string(),
    claim: z.string(),
    facts: z.array(z.string()),
    image: z.string(),
    align: z.enum(['left', 'right']),
  }),
});

const journeyEras = defineCollection({
  loader: file('./src/content/journey-eras.json'),
  schema: z.object({
    id: z.string(),
    order: z.number(),
    year: z.string(),
    label: z.string(),
    note: z.string(),
    image: z.string().optional(),
  }),
});

const regions = defineCollection({
  loader: file('./src/content/regions.json'),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    x: z.number(),
    y: z.number(),
    story: z.string(),
    themes: z.array(z.string()),
  }),
});

const filmFrames = defineCollection({
  loader: file('./src/content/film-frames.json'),
  schema: z.object({
    id: z.string(),
    order: z.number(),
    frame: z.string(),
    place: z.string(),
    year: z.string(),
    caption: z.string(),
    image: z.string(),
  }),
});

const nextThemes = defineCollection({
  loader: file('./src/content/next-themes.json'),
  schema: z.object({
    id: z.string(),
    order: z.number(),
    theme: z.string(),
    note: z.string(),
  }),
});

export const collections = {
  chapters,
  voices,
  figures,
  sources,
  assetLedger,
  achievements,
  journeyEras,
  regions,
  filmFrames,
  nextThemes,
};
