import Link from "next/link";

export default function ProductNotFound() {
  return (
    <section className="px-6 py-10">
      <h1 className="text-2xl font-extrabold">Denne produktsiden finnes ikke</h1>
      <p className="mt-4">Produktet eller siden i produktoversikten er ikke tilgjengelig.</p>
      <Link href="/produkter" prefetch={false} className="mt-4 inline-flex min-h-11 items-center underline">Se alle produkter</Link>
    </section>
  );
}
