import { connection } from 'next/server';
import { getProductCards } from '@/lib/shopify/getProductCards';
import { selectEmptyCartRecommendations } from '@/lib/cart/popular-cart-variants';
import { privateHeaders } from '@/lib/cart/request';

export async function GET() {
  await connection();
  try {
    return Response.json({ products: selectEmptyCartRecommendations(await getProductCards()) }, { headers: privateHeaders });
  } catch {
    console.error('empty_cart_recommendations_unavailable');
    return Response.json({ error: 'Produktforslag kunne ikke lastes.' }, { status: 502, headers: privateHeaders });
  }
}
