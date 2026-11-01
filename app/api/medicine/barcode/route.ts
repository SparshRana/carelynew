import { NextResponse } from 'next/server';
import { cachedBarcode, saveBarcode } from '@/lib/catalog-db';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let body: { gtin?: string; batch?: string | null; expiry?: string | null; raw?: string };
  try { body = await request.json() as typeof body; } catch { return NextResponse.json({ error: 'invalid_request' }, { status: 400 }); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  if ((body.batch != null && (typeof body.batch !== 'string' || body.batch.length > 150)) || (body.expiry != null && (typeof body.expiry !== 'string' || body.expiry.length > 32))) return NextResponse.json({ error: 'invalid_pack_fields' }, { status: 400 });
  const gtin = String(body.gtin || '');
  if (!/^\d{14}$/.test(gtin)) return NextResponse.json({ found: false, reason: 'no_product_identifier', gtin: null });

  try {
    const record = await cachedBarcode(gtin);
    if (record) return NextResponse.json({ found: true, gtin, batch: body.batch || null, expiry: body.expiry || null, product: record, cached: true }, { headers: { 'cache-control': 'no-store' } });
  } catch { /* Continue to live provider lookup if the database is unavailable. */ }

  const apiKey = process.env.OPENMRP_API_KEY;
  if (!apiKey) return NextResponse.json({ found: false, reason: 'barcode_catalogue_key_missing', gtin, batch: body.batch || null, expiry: body.expiry || null, message: 'Barcode read successfully. Add an OpenMRP API key on the server to look up products by GTIN, or search by medicine name below.' });

  try {
    const codes = [...new Set([gtin, gtin.replace(/^0+/, '')].filter(Boolean))];
    let response: Response | null = null;
    for (const code of codes) {
      response = await fetch(`https://api.openmrp.in/v1/product/${encodeURIComponent(code)}`, {
        headers: { accept: 'application/json', 'X-Api-Key': apiKey },
        signal: AbortSignal.timeout(8000),
      });
      if (response.status !== 404) break;
    }
    if (!response || response.status === 404) return NextResponse.json({ found: false, reason: 'product_not_listed', gtin, batch: body.batch || null, expiry: body.expiry || null });
    if (!response.ok) return NextResponse.json({ found: false, reason: response.status === 401 || response.status === 403 ? 'barcode_catalogue_key_rejected' : 'barcode_catalogue_unavailable', gtin, batch: body.batch || null, expiry: body.expiry || null }, { status: response.status === 401 || response.status === 403 ? 503 : 502 });
    const payload = await response.json() as Record<string, unknown>;
    const item = (payload.product || payload.data || payload) as Record<string, unknown>;
    const name = String(item.name || item.product_name || item.productName || item.title || '');
    if (!name) return NextResponse.json({ found: false, reason: 'unrecognized_catalogue_response', gtin, batch: body.batch || null, expiry: body.expiry || null });
    const product = {
      name,
      brand: String(item.brand || item.brand_name || ''),
      manufacturer: String(item.manufacturer || item.manufacturer_name || ''),
      pack: String(item.pack_size || item.pack || item.size || ''),
      mrp: String(item.mrp || ''),
      provider: 'OpenMRP community product catalogue',
      sourceUrl: `https://openmrp.in/product/${encodeURIComponent(gtin)}`,
    };
    try { await saveBarcode(gtin, product); } catch { /* Do not fail a successful live lookup if caching is unavailable. */ }
    return NextResponse.json({
      found: true,
      gtin,
      batch: body.batch || null,
      expiry: body.expiry || null,
      product,
    }, { headers: { 'cache-control': 'no-store' } });
  } catch {
    return NextResponse.json({ found: false, reason: 'barcode_catalogue_unavailable', gtin, batch: body.batch || null, expiry: body.expiry || null }, { status: 502 });
  }
}
