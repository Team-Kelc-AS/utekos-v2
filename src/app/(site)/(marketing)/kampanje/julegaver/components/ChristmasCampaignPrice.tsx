import { formatMoney } from "@/lib/products/money";
import {
  christmasCampaignPrices,
  type ChristmasCampaignProductHandle,
} from "../prices";

export function ChristmasCampaignPrice({
  productHandle,
}: {
  productHandle: ChristmasCampaignProductHandle;
}) {
  const { price, originalPrice } = christmasCampaignPrices[productHandle];

  return (
    <>
      <span className="font-google-sans text-xl font-extrabold text-card-foreground">
        {formatMoney({ amount: price, currencyCode: "NOK" })}
      </span>
      {originalPrice && (
        <span className="text-sm text-muted-foreground line-through">
          {formatMoney({ amount: originalPrice, currencyCode: "NOK" })}
        </span>
      )}
    </>
  );
}
