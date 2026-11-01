import { NextResponse } from 'next/server';
import { cachedSearch, saveSearch } from '@/lib/catalog-db';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = (url.searchParams.get('q') || '').trim().slice(0, 100);
  if (query.length < 2) return NextResponse.json({ records: [], message: 'Enter at least two letters.' });
  try {
    const cached = await cachedSearch(query.toLowerCase().replace(/\s+/g, ' '));
    if (cached?.length) return NextResponse.json({ records: cached, source: 'Cached catalogue records', cached: true }, { headers: { 'cache-control': 'no-store' } });
  } catch { /* Keep live search available during temporary database issues. */ }

  try {
    const upstream = new URL('https://drugdb.in/search');
    upstream.searchParams.set('q', query);
    upstream.searchParams.set('type', 'medicine');
    upstream.searchParams.set('detail', 'full');
    upstream.searchParams.set('limit', '8');
    const response = await fetch(upstream, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`Medicine catalogue responded ${response.status}.`);
    const data = await response.json() as { results?: Array<Record<string, unknown>>; total?: number };
    const records = (Array.isArray(data.results) ? data.results : []).slice(0, 8).map((r) => {
      const detail = (r.genericDetail && typeof r.genericDetail === 'object' ? r.genericDetail : {}) as Record<string, unknown>;
      const brand = (r['brand.brandName'] || r.brandName || '') as string;
      const manufacturer = (r['manufacturer.manufacturerName'] || r.manufacturerName || '') as string;
      const generic = (r['generic.genericName'] || detail.name || '') as string;
      const composition = Array.isArray(detail.composition) ? detail.composition as Array<Record<string, unknown>> : [];
      return {
        id: String(r.medicineSctid || r.id || ''),
        name: String(r.medicineName || brand || generic || ''),
        brand: String(brand),
        generic: String(generic),
        manufacturer: String(manufacturer),
        form: String(detail.doseForm || ''),
        route: String(detail.routeOfAdministration || ''),
        ingredients: composition.map((item) => ({
          name: String(item.substanceName || ''),
          strength: String(item.strength || ''),
          unit: String(item.unit || ''),
        })).filter((item) => item.name),
        licenseStatus: String(r.licenseStatus || 'Not provided'),
        updatedAt: String(detail.lastUpdatedOn || r.lastUpdatedon || ''),
        source: 'Common Drug Codes for India via Drug Information Service',
        sourceUrl: 'https://drugdb.in/',
      };
    }).filter((r) => r.name);
    try { await saveSearch(records); } catch { /* Catalogue lookup can work without the optional cache. */ }
    return NextResponse.json({ records, total: Number(data.total || records.length), source: 'Drug Information Service · Common Drug Codes for India' }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ records: [], error: 'catalogue_unavailable', message: error instanceof Error ? error.message : 'The medicine catalogue could not be reached.' }, { status: 502 });
  }
}
