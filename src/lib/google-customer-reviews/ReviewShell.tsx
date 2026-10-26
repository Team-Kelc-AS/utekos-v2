import { Link2OffIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Spinner } from '@/components/ui/spinner';

export type ReviewView = 'loading' | 'ready' | 'unavailable' | 'error';

// Rendered at build time with the project's real shadcn components. The private
// confirmation route needs no storefront layout, analytics or React hydration.
export function ReviewShell({ view }: { view: ReviewView }) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle><h1>Google Kundeanmeldelser</h1></CardTitle>
        {view === 'ready' && <CardDescription>Du velger selv om du vil delta.</CardDescription>}
      </CardHeader>
      <CardContent aria-live="polite">
        {view === 'loading' && (
          <div className="flex items-center gap-3" role="status">
            <Spinner aria-label="Laster" />
            <span>Åpner Googles valg …</span>
          </div>
        )}
        {view === 'unavailable' && (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon"><Link2OffIcon aria-hidden="true" /></EmptyMedia>
              <EmptyTitle>Lenken er utløpt</EmptyTitle>
              <EmptyDescription>Åpne valget på nytt fra takkesiden.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
        {view === 'error' && (
          <div className="flex flex-col gap-4">
            <p role="status">Google er ikke tilgjengelig akkurat nå.</p>
            <Button id="retry" type="button" className="w-full">Prøv igjen</Button>
          </div>
        )}
        {view === 'ready' && <Button id="retry" type="button" className="w-full">Åpne Googles valg</Button>}
      </CardContent>
      <CardFooter className="justify-between gap-4">
        <Button variant="outline" size="sm" nativeButton={false} render={<a href="https://utekos.no/" />}>Tilbake til butikken</Button>
        <a href="/personvern">Personvern</a>
      </CardFooter>
    </Card>
  );
}
