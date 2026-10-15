import { getCartSuggestionProducts } from '@/lib/cart/suggestion-products';
import { privateHeaders } from '@/lib/cart/request';
export async function GET() {
  try {
    return Response.json({ products: await getCartSuggestionProducts() }, { headers: privateHeaders });
  } catch {
    return Response.json({ error: 'Produktforslag kunne ikke lastes.' }, { status: 502, headers: privateHeaders });
  }
}
