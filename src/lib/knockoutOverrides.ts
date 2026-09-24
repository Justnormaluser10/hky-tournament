import fs from 'fs';
import path from 'path';

export interface KnockoutOverrideData {
  teamAId?: string | null; // team id or null / 'NO_TEAM'
  teamBId?: string | null; // team id or null / 'NO_TEAM'
  seedLabelA?: string | null;
  seedLabelB?: string | null;
  teamAScore?: number;
  teamBScore?: number;
  status?: string;
  winnerId?: string | null;
  isManualSeedA?: boolean;
  isManualSeedB?: boolean;
}

export type KnockoutOverridesMap = Record<string, KnockoutOverrideData>;

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const OVERRIDES_FILE = path.join(DATA_DIR, 'knockout_preview_overrides.json');

function ensureDataFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(OVERRIDES_FILE)) {
      fs.writeFileSync(OVERRIDES_FILE, JSON.stringify({}, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Error ensuring knockout overrides file:', err);
  }
}

export function getKnockoutOverrides(): KnockoutOverridesMap {
  try {
    ensureDataFile();
    if (fs.existsSync(OVERRIDES_FILE)) {
      const content = fs.readFileSync(OVERRIDES_FILE, 'utf-8');
      return JSON.parse(content) as KnockoutOverridesMap;
    }
  } catch (err) {
    console.error('Error reading knockout overrides:', err);
  }
  return {};
}

export function saveKnockoutOverride(
  stage: string,
  data: Partial<KnockoutOverrideData>
): KnockoutOverridesMap {
  try {
    ensureDataFile();
    const current = getKnockoutOverrides();
    const existing = current[stage] || {};

    current[stage] = {
      ...existing,
      ...data,
    };

    fs.writeFileSync(OVERRIDES_FILE, JSON.stringify(current, null, 2), 'utf-8');
    return current;
  } catch (err) {
    console.error('Error saving knockout override:', err);
    return getKnockoutOverrides();
  }
}

export function clearKnockoutOverrides(): void {
  try {
    ensureDataFile();
    fs.writeFileSync(OVERRIDES_FILE, JSON.stringify({}, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error clearing knockout overrides:', err);
  }
}
