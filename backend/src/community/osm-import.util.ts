import { Repository } from "typeorm";
import { Organization, OrganizationType } from "./entities/community.entity";

// Populates the field directory from OpenStreetMap — free, openly licensed
// (ODbL), and queryable without an API key via the public Overpass API.
// Shared between the standalone CLI script (backend/src/config/osm-import.ts,
// for local/large runs) and the admin HTTP endpoint (for triggering a run
// against a deployed environment without needing its DB credentials locally).
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function overpassQuery(bbox: string) {
  const [south, west, north, east] = bbox.split(",").map((s) => s.trim());
  const b = `(${south},${west},${north},${east})`;
  // Fields: the well-established leisure/sport=paintball tags. Shops: OSM
  // has no dedicated shop=paintball tag in wide use, so the only reliable
  // signal for a paintball-specific retailer is a shop node that's also
  // been tagged sport=paintball — narrower than pulling in every sporting
  // goods store, at the cost of missing shops nobody's tagged that way yet.
  return `[out:json][timeout:90];(nwr["leisure"="paintball"]${b};nwr["sport"="paintball"]["shop"!~"."]${b};nwr["shop"]["sport"="paintball"]${b};nwr["shop"="paintball"]${b};);out center tags;`;
}

async function fetchOverpass(bbox: string, attempt = 1): Promise<OverpassElement[]> {
  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(overpassQuery(bbox))}`,
  });
  if (!res.ok) {
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 5000 * attempt));
      return fetchOverpass(bbox, attempt + 1);
    }
    throw new Error(`Overpass request failed: ${res.status} ${await res.text().catch(() => "")}`);
  }
  const body = (await res.json()) as { elements: OverpassElement[] };
  return body.elements || [];
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

const AMENITY_TAG_MAP: Record<string, string> = {
  wheelchair: "wheelchair",
};

function resolveType(tags: Record<string, string>): OrganizationType {
  return tags.shop ? OrganizationType.RETAILER : OrganizationType.FIELD;
}

function buildAddress(tags: Record<string, string>): string | undefined {
  if (tags["addr:full"]) return tags["addr:full"];
  const parts = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean);
  return parts.length ? parts.join(" ") : undefined;
}

async function uniqueSlug(orgs: Repository<Organization>, base: string) {
  const root = slugify(base);
  let slug = root,
    i = 1;
  while (await orgs.exist({ where: { slug } })) slug = `${root}-${++i}`;
  return slug;
}

export async function importOsmFields(orgs: Repository<Organization>, bbox: string) {
  const elements = await fetchOverpass(bbox);

  let created = 0,
    updated = 0,
    skipped = 0;

  for (const el of elements) {
    const tags = el.tags || {};
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (lat == null || lon == null) {
      skipped++;
      continue;
    }
    const osmId = `${el.type}/${el.id}`;
    const name = tags.name || (tags.shop ? "Unnamed Paintball Shop" : "Unnamed Paintball Field");
    const type = resolveType(tags);
    const address = buildAddress(tags);
    const hours = tags.opening_hours;

    const amenities = Object.entries(AMENITY_TAG_MAP)
      .filter(([osmKey]) => tags[osmKey] === "yes")
      .map(([, value]) => value);

    const existing = await orgs
      .createQueryBuilder("o")
      .where("o.details ->> 'osmId' = :osmId", { osmId })
      .getOne();

    if (existing) {
      // Once a field is claimed, the owner's own edits take precedence —
      // re-running the import refreshes only unclaimed, still-raw listings.
      if (!existing.claimedById) {
        await orgs.update(existing.id, {
          name,
          type,
          latitude: lat,
          longitude: lon,
          address: address || undefined,
          city: tags["addr:city"] || existing.city,
          region: tags["addr:state"] || existing.region,
          country: tags["addr:country"] || existing.country,
          websiteUrl: tags.website || tags["contact:website"] || existing.websiteUrl,
          contactEmail: tags.email || tags["contact:email"] || existing.contactEmail,
          phoneNumber: tags.phone || tags["contact:phone"] || existing.phoneNumber,
          details: {
            ...existing.details,
            source: "osm",
            osmId,
            amenities: amenities.length ? amenities : (existing.details as any)?.amenities,
            hours: hours || (existing.details as any)?.hours,
          },
        });
        updated++;
      } else {
        skipped++;
      }
      continue;
    }

    const slug = await uniqueSlug(orgs, name);
    await orgs.save(
      orgs.create({
        slug,
        name,
        type,
        city: tags["addr:city"],
        region: tags["addr:state"],
        country: tags["addr:country"],
        address,
        latitude: lat,
        longitude: lon,
        websiteUrl: tags.website || tags["contact:website"],
        contactEmail: tags.email || tags["contact:email"],
        phoneNumber: tags.phone || tags["contact:phone"],
        isVerified: false,
        claimedById: undefined,
        details: {
          source: "osm",
          osmId,
          importedAt: new Date().toISOString(),
          ...(amenities.length ? { amenities } : {}),
          ...(hours ? { hours } : {}),
        },
      }),
    );
    created++;
  }

  return { candidates: elements.length, created, updated, skipped };
}
