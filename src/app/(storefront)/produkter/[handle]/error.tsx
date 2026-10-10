'use client';

export default function ProductError({ retry }: { retry: () => void }) {
  return (
    <main>
      <h1>Kunne ikke laste produktet</h1>
      <p>Prøv igjen om et øyeblikk.</p>
      <button
        type="button"
        onClick={retry}
        className="mt-4 rounded bg-[#b44701] px-4 py-2 text-[#f0eee9]"
      >
        Prøv igjen
      </button>
    </main>
  );
}
