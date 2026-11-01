import { Pool } from 'pg';

let pool: Pool | undefined;
let schemaReady: Promise<void> | undefined;

export function catalogPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  pool ??= new Pool({ connectionString, max: 4, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 5_000 });
  return pool;
}

export async function ensureCatalogSchema() {
  const db = catalogPool();
  if (!db) return null;
  schemaReady ??= db.query(`
    CREATE TABLE IF NOT EXISTS carely_catalog_products (
      gtin TEXT PRIMARY KEY,
      record JSONB NOT NULL,
      provider TEXT NOT NULL,
      source_url TEXT NOT NULL,
      fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS carely_catalog_records (
      record_id TEXT PRIMARY KEY,
      search_text TEXT NOT NULL,
      record JSONB NOT NULL,
      source_url TEXT NOT NULL,
      provider TEXT NOT NULL,
      fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `).then(() => undefined).catch((error) => { schemaReady = undefined; throw error; });
  await schemaReady;
  return db;
}

export async function cachedSearch(query: string) {
  const db = await ensureCatalogSchema();
  if (!db) return null;
  const result = await db.query(`SELECT record FROM carely_catalog_records WHERE search_text ILIKE $1 AND fetched_at > NOW() - INTERVAL '30 days' ORDER BY fetched_at DESC LIMIT 8`, [`%${query}%`]);
  return result.rows.map((row) => row.record);
}

export async function saveSearch(records: Array<Record<string, unknown>>) {
  const db = await ensureCatalogSchema();
  if (!db) return;
  for (const record of records) {
    const id = String(record.id || record.name || '');
    if (!id) continue;
    const searchText = [record.name, record.brand, record.generic, record.manufacturer].map((value) => String(value || '')).join(' ');
    await db.query(`INSERT INTO carely_catalog_records(record_id,search_text,record,source_url,provider,fetched_at) VALUES($1,$2,$3::jsonb,$4,$5,NOW()) ON CONFLICT(record_id) DO UPDATE SET search_text=EXCLUDED.search_text, record=EXCLUDED.record, source_url=EXCLUDED.source_url, provider=EXCLUDED.provider, fetched_at=NOW()`, [id, searchText, JSON.stringify(record), String(record.sourceUrl || 'https://drugdb.in/'), String(record.source || 'Drug Information Service')]);
  }
}

export async function cachedBarcode(gtin: string) {
  const db = await ensureCatalogSchema();
  if (!db) return null;
  const result = await db.query(`SELECT record FROM carely_catalog_products WHERE gtin=$1 AND fetched_at > NOW() - INTERVAL '30 days'`, [gtin]);
  return result.rows[0]?.record ?? null;
}

export async function saveBarcode(gtin: string, record: unknown) {
  const db = await ensureCatalogSchema();
  if (!db) return;
  await db.query(`INSERT INTO carely_catalog_products(gtin,record,provider,source_url,fetched_at) VALUES($1,$2::jsonb,'OpenMRP community product catalogue',$3,NOW()) ON CONFLICT(gtin) DO UPDATE SET record=EXCLUDED.record, provider=EXCLUDED.provider, source_url=EXCLUDED.source_url, fetched_at=NOW()`, [gtin, JSON.stringify(record), `https://openmrp.in/product/${encodeURIComponent(gtin)}`]);
}
