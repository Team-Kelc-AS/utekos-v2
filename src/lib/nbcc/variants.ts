export type NbccVariant = {
  id: string;
  availableForSale: boolean;
  selectedOptions: { name: string; value: string }[];
  price: { amount: string; currencyCode: string };
};

const normalize = (value: string) => value.trim().toLocaleLowerCase("nb-NO");

// Match both option names and values: never substitute another colour or size.
export function resolveNbccVariants(variants: readonly NbccVariant[], sizes: readonly string[], color: string) {
  return sizes.flatMap((label) => {
    const variant = variants.find((candidate) =>
      candidate.selectedOptions.some(({ name, value }) => ["størrelse", "size"].includes(normalize(name)) && normalize(value) === normalize(label)) &&
      candidate.selectedOptions.some(({ name, value }) => ["farge", "color", "colour"].includes(normalize(name)) && normalize(value) === normalize(color))
    );
    return variant ? [{ ...variant, label }] : [];
  });
}

export function formatNbccPrice(price: NbccVariant["price"]) {
  return new Intl.NumberFormat("nb-NO", { style: "currency", currency: price.currencyCode, maximumFractionDigits: 2 }).format(Number(price.amount));
}
