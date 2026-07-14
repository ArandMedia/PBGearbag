import { Repository } from "typeorm";
import { ApplicationStatus, Organization, OrganizationType } from "./entities/community.entity";
import { DirectoryEntry } from "../config/directory-import-data";

// Adds a user-supplied list of fields/retailers not yet in OSM. Unlike
// osm-import.util.ts (which gets lat/lon for free from Overpass), these are
// street addresses only, so each one needs an actual geocoding call —
// Nominatim, OSM's own free geocoder, same usage-policy care (descriptive
// User-Agent, 1 req/sec) as the Overpass integration already uses.
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "PBGearbag/1.0 (+https://pbgearbag.com; field directory import)";

async function nominatimSearch(q: string): Promise<{ lat: number; lon: number } | null> {
  const res = await fetch(`${NOMINATIM_URL}?${new URLSearchParams({ q, format: "json", limit: "1" })}`, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { lat: string; lon: string }[];
  if (!body.length) return null;
  return { lat: Number(body[0].lat), lon: Number(body[0].lon) };
}

// A plain "city, state" (or "city, country" outside the US) tail extracted
// from the raw address — full-address geocoding fails for a real chunk of
// rural highway addresses that aren't precisely mapped in OSM's own data
// (confirmed live against this exact list during planning), but city-level
// almost always resolves. Falling back to it beats dropping the row.
function cityStateFallback(rawAddress: string): string | undefined {
  const parts = rawAddress.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return undefined;
  return parts.slice(-2).join(", ");
}

async function geocode(rawAddress: string): Promise<{ lat: number; lon: number } | null> {
  const direct = await nominatimSearch(rawAddress);
  if (direct) return direct;
  const fallback = cityStateFallback(rawAddress);
  if (!fallback) return null;
  await new Promise((r) => setTimeout(r, 1100));
  return nominatimSearch(fallback);
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "field"
  );
}

async function uniqueSlug(orgs: Repository<Organization>, base: string) {
  const root = slugify(base);
  let slug = root,
    i = 1;
  while (await orgs.exist({ where: { slug } })) slug = `${root}-${++i}`;
  return slug;
}

// US-shaped addresses end "..., City, State ZIP" or "..., City, State,
// International ZIP"; everything before the last comma-separated "City,
// State..." pair goes into `address`. If the split doesn't look confident
// (too few parts, no matching state-like token), the whole string is kept
// in `address` and city/region are left blank rather than guessed wrong.
function splitAddress(rawAddress: string): { address?: string; city?: string; region?: string } {
  const parts = rawAddress.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length < 3) return { address: rawAddress };
  const city = parts[parts.length - 2];
  const stateZip = parts[parts.length - 1];
  const region = stateZip.split(/\s+/)[0];
  if (!city || !region) return { address: rawAddress };
  return { address: parts.slice(0, parts.length - 2).join(", "), city, region };
}

export async function importDirectoryBatch(orgs: Repository<Organization>, entries: DirectoryEntry[]) {
  let created = 0,
    updated = 0,
    skipped = 0,
    noCoords = 0;

  for (const entry of entries) {
    const coords = await geocode(entry.rawAddress);
    await new Promise((r) => setTimeout(r, 1100));

    const type = entry.type === "retailer" ? OrganizationType.RETAILER : OrganizationType.FIELD;
    const { address, city, region } = splitAddress(entry.rawAddress);

    if (coords) {
      // Same real-world-venue dedup check as the OSM importer: a name match
      // within ~500m is treated as the same place rather than a new pin.
      const near = await orgs
        .createQueryBuilder("o")
        .where("LOWER(o.name) = LOWER(:name)", { name: entry.name })
        .andWhere("o.latitude BETWEEN :latMin AND :latMax", { latMin: coords.lat - 0.005, latMax: coords.lat + 0.005 })
        .andWhere("o.longitude BETWEEN :lonMin AND :lonMax", { lonMin: coords.lon - 0.005, lonMax: coords.lon + 0.005 })
        .getOne();
      if (near) {
        if (!near.claimedById) {
          await orgs.update(near.id, {
            phoneNumber: near.phoneNumber || entry.phone,
            contactEmail: near.contactEmail || entry.contactEmail,
          });
          updated++;
        } else {
          skipped++;
        }
        continue;
      }
    } else {
      noCoords++;
    }

    const slug = await uniqueSlug(orgs, entry.name);
    await orgs.save(
      orgs.create({
        slug,
        name: entry.name,
        type,
        address,
        city,
        region,
        latitude: coords?.lat,
        longitude: coords?.lon,
        phoneNumber: entry.phone,
        contactEmail: entry.contactEmail,
        isVerified: false,
        claimedById: undefined,
        moderationStatus: ApplicationStatus.APPROVED,
        details: { source: "manual-directory-import", importedAt: new Date().toISOString() },
      }),
    );
    created++;
  }

  return { created, updated, skipped, noCoords };
}
