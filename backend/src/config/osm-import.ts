import "dotenv/config";
import dataSource from "./typeorm.config";
import { Organization } from "../community/entities/community.entity";
import { importOsmFields } from "../community/osm-import.util";

// Populates the field directory from OpenStreetMap for a given bounding box.
// Overpass rejects/times out on huge global queries, so this is run
// per-region, repeatedly, over time — not "the whole world" in one call.
//   npm run import:osm -- "38.4,-91.0,39.1,-90.0"   # south,west,north,east
async function main(bbox: string) {
  await dataSource.initialize();
  const orgs = dataSource.getRepository(Organization);
  console.log(`Querying Overpass for bbox ${bbox}...`);
  const result = await importOsmFields(orgs, bbox);
  console.log(
    `Done. ${result.candidates} candidates — created ${result.created}, updated ${result.updated}, skipped ${result.skipped}.`,
  );
  await dataSource.destroy();
}

const bboxArg = process.argv[2];
if (!bboxArg) {
  console.error('Usage: npm run import:osm -- "south,west,north,east"');
  process.exit(1);
}
main(bboxArg).catch((error) => {
  console.error(error);
  process.exit(1);
});
