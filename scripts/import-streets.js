const fs = require('fs');
const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'walk_every_street',
  password: 'postgres',
  port: 5432,
});

async function main() {
  const raw = fs.readFileSync(process.argv[2], 'utf8');
  const data = JSON.parse(raw);

  await client.connect();
  console.log('Forbundet til database');

  let imported = 0;
  let skipped = 0;

  for (const element of data.elements) {
    if (element.type !== 'way') continue;
    if (!element.geometry || element.geometry.length < 2) {
      skipped++;
      continue;
    }

    // Byg WKT LineString: "LINESTRING(lon lat, lon lat, ...)"
    const coords = element.geometry
      .map(p => `${p.lon} ${p.lat}`)
      .join(', ');
    const wkt = `LINESTRING(${coords})`;

    await client.query(
      `INSERT INTO streets (osm_id, name, highway_type, geom)
       VALUES ($1, $2, $3, ST_GeomFromText($4, 4326))
       ON CONFLICT DO NOTHING`,
      [
        element.id,
        element.tags?.name ?? null,
        element.tags?.highway ?? null,
        wkt,
      ]
    );

    imported++;
    if (imported % 500 === 0) console.log(`Importeret ${imported} veje...`);
  }

  console.log(`Færdig: ${imported} importeret, ${skipped} sprunget over`);
  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
