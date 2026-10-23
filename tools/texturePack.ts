import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { basename, join } from "node:path";
import { PNG } from "pngjs";
import { TEXTURE_DIR } from "./atlas.js";

const ROOT = join(import.meta.dirname, "..");
export const SOURCE_FILE = join(TEXTURE_DIR, "source.json");
export const CHECKOUT_DIR = join(
  ROOT,
  "node_modules/.cache/pixel-perfection-ce",
);

/** Where the vendored textures come from; see source.json. */
export interface PackSource {
  name: string;
  repository: string;
  commit: string;
  blockDir: string;
  issueList: string;
  license: string;
}

export function readSource(): PackSource {
  return JSON.parse(readFileSync(SOURCE_FILE, "utf-8")) as PackSource;
}

/**
 * Make `dir` a checkout of exactly `source.commit`, fetching only that
 * commit. Reuses an existing checkout when it's already at that commit.
 */
export function ensureCheckout(source: PackSource, dir = CHECKOUT_DIR): string {
  const git = (...args: string[]) =>
    execFileSync("git", ["-C", dir, ...args], { encoding: "utf-8" }).trim();
  if (existsSync(join(dir, ".git"))) {
    try {
      if (git("rev-parse", "HEAD") === source.commit) {
        return dir;
      }
    } catch {
      // broken checkout; start over
    }
  }
  rmSync(dir, { recursive: true, force: true });
  execFileSync("git", ["init", "--quiet", dir]);
  git("remote", "add", "origin", source.repository);
  console.log(`fetching ${source.name} @ ${source.commit.slice(0, 8)}...`);
  git("fetch", "--quiet", "--depth", "1", "origin", source.commit);
  git("checkout", "--quiet", "FETCH_HEAD");
  return dir;
}

/**
 * Texture paths the pack itself flags as infringing, relative to its
 * textures folder (e.g. "block/foo.png"). These must never be vendored.
 */
export function parseIssueList(markdown: string): Set<string> {
  const paths = new Set<string>();
  for (const line of markdown.split("\n")) {
    const match = /^\|\s*`([^`]+)`/.exec(line.trim());
    if (match !== null) {
      paths.add(match[1]);
    }
  }
  return paths;
}

export interface TextureReport {
  /** Reasons it cannot be used at all. */
  problems: string[];
  /** Things to know when wiring it up. */
  notes: string[];
}

/** What the engine can and can't do with a texture; see docs/textures.md. */
export function analyzeTexture(
  image: PNG,
  options: { tileSize: number; animated: boolean },
): TextureReport {
  const problems: string[] = [];
  const notes: string[] = [];
  const { width, height } = image;

  if (width !== options.tileSize || height % options.tileSize !== 0) {
    problems.push(
      `is ${width}x${height}; the atlas needs ${options.tileSize}px wide frames`,
    );
    return { problems, notes };
  }
  if (options.animated || height > width) {
    notes.push(
      `animated (${height / width} frames); only the first frame is shown`,
    );
  }

  let translucent = false;
  let clear = false;
  let saturation = 0;
  let hue = 0;
  let opaque = 0;
  const data = image.data;
  for (let y = 0; y < width; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const alpha = data[i + 3];
      if (alpha === 0) {
        clear = true;
        continue;
      }
      if (alpha < 255) {
        translucent = true;
      }
      const [h, s] = hueSaturation(data[i], data[i + 1], data[i + 2]);
      hue += h;
      saturation += s;
      opaque++;
    }
  }
  if (translucent) {
    notes.push(
      "has partly transparent pixels; they render fully solid or fully clear (no translucency pass yet)",
    );
  } else if (clear) {
    notes.push("has transparent pixels; mark the block opaque: false");
  }
  if (opaque > 0 && looksUncoloured(hue / opaque, saturation / opaque)) {
    notes.push(
      "looks like the pack's uncoloured base (like grass_block_top); it probably needs a tint",
    );
  }
  return { problems, notes };
}

/**
 * The pack ships textures meant to be tinted in-engine (grass, leaves,
 * vines...) in one shared beige palette: hue ~37°, saturation ~0.2.
 */
function looksUncoloured(hue: number, saturation: number): boolean {
  return hue >= 30 && hue <= 45 && saturation >= 0.16 && saturation <= 0.24;
}

function hueSaturation(r: number, g: number, b: number): [number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const saturation = max === 0 ? 0 : delta / max;
  if (delta === 0) {
    return [0, saturation];
  }
  let hue: number;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  return [(hue * 60 + 360) % 360, saturation];
}

/**
 * Name fragments of textures that belong to non-cube models in Minecraft.
 * The pack doesn't ship the models themselves, so this is only a hint.
 */
const NON_CUBE =
  /(^|_)(door|trapdoor|torch|lantern|rail|sapling|tulip|orchid|allium|bluet|daisy|poppy|dandelion|cornflower|lilac|peony|rose|bush|fern|grass|seagrass|kelp|vine|ladder|pane|bars|fence|slab|stairs|sign|button|lever|plate|carpet|bed|stem|stage\d|cactus|cake|chain|campfire|candle|pot|coral|pickle|cobweb|bamboo|dripleaf|roots|sprouts|fungus|lily|mushroom|wire|repeater|comparator|tripwire|rod)($|_|\d)/;

export function looksNonCube(name: string): boolean {
  // anything named *_block (grass_block, red_mushroom_block...) is a cube
  return NON_CUBE.test(name) && !/_block(_|$)/.test(name);
}

/** Analyze a texture in the pack, or null if it isn't there. */
export function inspectPackTexture(
  blockDir: string,
  name: string,
  tileSize: number,
): TextureReport | null {
  const path = join(blockDir, `${name}.png`);
  if (!existsSync(path)) {
    return null;
  }
  const report = analyzeTexture(PNG.sync.read(readFileSync(path)), {
    tileSize,
    animated: existsSync(`${path}.mcmeta`),
  });
  if (looksNonCube(name)) {
    report.notes.push(
      "probably belongs to a non-cube shape; the mesher only draws full cubes",
    );
  }
  return report;
}

/** Block texture names in the pack containing `query`. */
export function searchPack(blockDir: string, query: string): string[] {
  const needle = query.toLowerCase();
  return readdirSync(blockDir)
    .filter((file) => file.endsWith(".png"))
    .map((file) => basename(file, ".png"))
    .filter((name) => name.toLowerCase().includes(needle))
    .sort();
}

export function vendoredNames(dir = TEXTURE_DIR): Set<string> {
  return new Set(
    readdirSync(dir)
      .filter((file) => file.endsWith(".png"))
      .map((file) => basename(file, ".png")),
  );
}

export interface PlannedTexture {
  name: string;
  from: string;
  report: TextureReport;
}

export interface AddPlan {
  add: PlannedTexture[];
  alreadyVendored: string[];
  errors: string[];
}

/**
 * Decide what `add` would do without touching anything, so a bad name
 * in a batch stops the whole batch.
 */
export function planAdd(
  names: readonly string[],
  options: {
    checkoutDir: string;
    source: PackSource;
    vendored: Set<string>;
    tileSize: number;
  },
): AddPlan {
  const { checkoutDir, source } = options;
  const blockDir = join(checkoutDir, source.blockDir);
  const issuesPath = join(checkoutDir, source.issueList);
  const issues = existsSync(issuesPath)
    ? parseIssueList(readFileSync(issuesPath, "utf-8"))
    : new Set<string>();
  const plan: AddPlan = { add: [], alreadyVendored: [], errors: [] };

  for (const raw of new Set(names.map((n) => basename(n, ".png")))) {
    const from = join(blockDir, `${raw}.png`);
    if (options.vendored.has(raw)) {
      plan.alreadyVendored.push(raw);
    } else if (issues.has(`block/${raw}.png`)) {
      plan.errors.push(`${raw}: flagged in ${source.issueList} as infringing`);
    } else {
      const report = inspectPackTexture(blockDir, raw, options.tileSize);
      if (report === null) {
        const similar = searchPack(blockDir, raw.split("_")[0]).slice(0, 8);
        plan.errors.push(
          `${raw}: not in the pack` +
            (similar.length > 0 ? ` (similar: ${similar.join(", ")})` : ""),
        );
      } else if (report.problems.length > 0) {
        plan.errors.push(...report.problems.map((p) => `${raw}: ${p}`));
      } else {
        plan.add.push({ name: raw, from, report });
      }
    }
  }
  return plan;
}
