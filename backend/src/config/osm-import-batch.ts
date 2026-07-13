import "dotenv/config";
import dataSource from "./typeorm.config";
import { Organization } from "../community/entities/community.entity";
import { importOsmFields } from "../community/osm-import.util";

// Runs the OSM field/shop import across a grid of regions in one command
// instead of hand-picking bboxes one at a time. Defaults to a grid over the
// continental US; pass --grid=south,west,north,east,rows,cols to cover a
// different area (e.g. Canada, or a finer grid over a dense region).
function buildGrid(
  south: number,
  west: number,
  north: number,
  east: number,
  rows: number,
  cols: number,
): string[] {
  const boxes: string[] = [];
  const latStep = (north - south) / rows;
  const lonStep = (east - west) / cols;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const s = south + r * latStep;
      const n = s + latStep;
      const w = west + c * lonStep;
      const e = w + lonStep;
      boxes.push(`${s.toFixed(2)},${w.toFixed(2)},${n.toFixed(2)},${e.toFixed(2)}`);
    }
  }
  return boxes;
}

async function main() {
  const gridArg = process.argv.find((a) => a.startsWith("--grid="));
  let boxes: string[];
  if (gridArg) {
    const [south, west, north, east, rows, cols] = gridArg
      .replace("--grid=", "")
      .split(",")
      .map(Number);
    boxes = buildGrid(south, west, north, east, rows || 1, cols || 1);
  } else {
    // Continental US, 5 rows x 6 cols = 30 cells — small enough per cell
    // that Overpass won't time out on a single query.
    boxes = buildGrid(24, -125, 49, -66, 5, 6);
  }

  await dataSource.initialize();
  const orgs = dataSource.getRepository(Organization);

  const totals = { candidates: 0, created: 0, updated: 0, skipped: 0 };
  for (const [i, bbox] of boxes.entries()) {
    console.log(`[${i + 1}/${boxes.length}] ${bbox}`);
    try {
      const result = await importOsmFields(orgs, bbox);
      totals.candidates += result.candidates;
      totals.created += result.created;
      totals.updated += result.updated;
      totals.skipped += result.skipped;
      console.log(
        `  candidates=${result.candidates} created=${result.created} updated=${result.updated} skipped=${result.skipped}`,
      );
    } catch (error) {
      console.error("  failed:", error);
    }
    // Overpass's fair-use guidance: keep the request rate modest rather
    // than firing the whole grid back-to-back.
    await new Promise((r) => setTimeout(r, 3000));
  }

  console.log(
    `\nDone. Totals: candidates=${totals.candidates} created=${totals.created} updated=${totals.updated} skipped=${totals.skipped}`,
  );
  await dataSource.destroy();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
