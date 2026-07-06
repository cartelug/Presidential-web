/**
 * The verified record. Every figure carries a source number that resolves to
 * the register in Act V — nothing on the page is unsourced.
 */

export interface EvidenceNode {
  /** Position in the Uganda outline's 480×460 viewBox space. */
  x: number;
  y: number;
  category: 'energy' | 'roads' | 'education' | 'health' | 'agriculture' | 'refuge';
  region: 'Central' | 'Eastern' | 'Northern' | 'Western';
  year: number;
  label: string;
  proof: string;
  source: number;
}

/** SVG path of the national outline (480×460 viewBox), shared by canvas + hit-layer. */
export const UGANDA_PATH =
  'M116,60 L360,72 Q420,74 422,124 L420,184 L418,256 Q414,300 360,302 L418,302 Q424,330 408,360 Q374,406 312,400 Q286,372 286,338 L210,330 L208,316 L168,372 Q120,388 92,362 L60,268 Q62,210 84,176 Q70,110 78,96 Q70,62 116,60 Z';

export const LAKE_PATH =
  'M286,338 L322,300 L360,302 L418,302 Q424,330 408,360 Q374,406 312,400 Q286,372 286,338 Z';

export const VIEWBOX = { w: 480, h: 460 };

export const NODES: EvidenceNode[] = [
  { x: 300, y: 224, category: 'education', region: 'Central', year: 1997, label: 'Universal Primary Education', proof: 'UPE (1997) opened primary school to every child; adult literacy rose from 43% to over 70%.', source: 4 },
  { x: 225, y: 112, category: 'health', region: 'Northern', year: 2008, label: 'Post-conflict recovery, Gulu', proof: 'Rebuilding and regional referral capacity across the north after two decades of conflict.', source: 4 },
  { x: 120, y: 314, category: 'agriculture', region: 'Western', year: 2010, label: 'Dairy & highland agriculture', proof: 'A thriving dairy and tea economy across the western highlands.', source: 4 },
  { x: 372, y: 216, category: 'agriculture', region: 'Eastern', year: 2012, label: 'Grain & cooperative mills', proof: 'Value-addition mills serving farmer cooperatives across the east.', source: 4 },
  { x: 150, y: 236, category: 'roads', region: 'Western', year: 2015, label: 'National tarmac backbone', proof: '6,850 km paved of a 21,000 km national network reconnects every region.', source: 1 },
  { x: 95, y: 112, category: 'refuge', region: 'Northern', year: 2016, label: 'West Nile settlements', proof: 'Home to Bidi Bidi — among the largest refugee settlements in the world — under the open-door policy.', source: 5 },
  { x: 258, y: 296, category: 'roads', region: 'Central', year: 2018, label: 'Kampala–Entebbe Expressway', proof: 'The 51 km tolled expressway (2018) cut the airport run from over ninety minutes to about forty.', source: 3 },
  { x: 360, y: 266, category: 'energy', region: 'Eastern', year: 2018, label: 'The Nile crossings at Jinja', proof: 'The 525 m Source of the Nile Bridge (2018), with Isimba and Bujagali stations on the Victoria Nile.', source: 7 },
  { x: 92, y: 252, category: 'energy', region: 'Western', year: 2022, label: 'Lake Albert oilfields', proof: 'Commercial reserves confirmed; production set to begin via a regional pipeline.', source: 4 },
  { x: 240, y: 150, category: 'energy', region: 'Northern', year: 2024, label: 'Karuma Hydropower', proof: 'The 600 MW station lifted national generation capacity past 2,000 MW when commissioned in 2024.', source: 6 },
];

export const SOURCES: { n: number; body: string }[] = [
  { n: 1, body: 'Uganda National Roads Authority / Ministry of Works & Transport — national paved road network statistics.' },
  { n: 2, body: 'Electoral Commission of Uganda — official count of districts and cities.' },
  { n: 3, body: 'Kampala–Entebbe Expressway (KEE) — route length, opening date and journey-time figures.' },
  { n: 4, body: 'Uganda Bureau of Statistics (UBOS) / World Bank — GDP per capita, literacy and national poverty headcount.' },
  { n: 5, body: 'Office of the Prime Minister / UNHCR Uganda — refugee hosting figures under the Refugee Act, 2006.' },
  { n: 6, body: 'Electricity Regulatory Authority / UETCL — installed generation capacity.' },
  { n: 7, body: 'Public reporting on the Source of the Nile Bridge, Jinja — span length and commissioning date.' },
];

export const CATEGORY_LABEL: Record<EvidenceNode['category'], string> = {
  energy: 'Energy',
  roads: 'Roads',
  education: 'Education',
  health: 'Health',
  agriculture: 'Agriculture',
  refuge: 'Refuge',
};
