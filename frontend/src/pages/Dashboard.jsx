import { useActions } from '../hooks/useActions';
import { Button, CardSkeleton, EmptyState, ErrorState, Notice } from '../components/ui';
import ActionCard from '../components/ActionCard';

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
}

export default function Dashboard() {
  const { state, analyzing, notice, setNotice, reload, runAnalysis, pending, top3, rest, decided, highCount, decide } = useActions();

  const summary =
    state.status === 'loading' ? 'Loading today\'s briefing…'
    : state.status === 'error' ? 'The briefing could not be loaded.'
    : pending.length === 0 ? 'Nothing is waiting for you.'
    : `${pending.length} ${pending.length === 1 ? 'issue needs' : 'issues need'} a decision, ${highCount} high priority.`;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold leading-none sm:text-5xl">{greeting()}, Ramesh</h1>
          <p className="mt-2 text-steel">{summary}</p>
        </div>
        <Button onClick={runAnalysis} busy={analyzing} className="w-full sm:w-auto">
          {analyzing ? 'Analysing…' : 'Run analysis'}
        </Button>
      </header>

      {analyzing && (
        <p role="status" className="mt-4 text-steel">Reading stock, sales, suppliers and open purchase orders…</p>
      )}

      {state.status === 'loading' && (
        <div className="mt-6 space-y-4" role="status" aria-label="Loading">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      {state.status === 'error' && <ErrorState title="Couldn't load today's briefing" error={state.error} onRetry={reload} />}

      {state.status === 'ready' && pending.length === 0 && (
        <EmptyState
          title={decided.length ? 'You are all caught up' : 'No briefing yet'}
          body={decided.length ? 'Every suggestion has a decision. Run the analysis again to check for new problems.' : 'Run the analysis and the agent will read stock, sales, suppliers and purchase orders for you.'}
          action={<Button onClick={runAnalysis} busy={analyzing}>Run analysis</Button>}
        />
      )}

      {state.status === 'ready' && pending.length > 0 && (
        <div className="mt-6 space-y-6">
          <section className="space-y-4">
            {top3.map((action) => (
              <ActionCard key={action.id} action={action} onDecide={decide} />
            ))}
          </section>

          {rest.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-display text-2xl font-semibold">Also on the radar</h2>
              {rest.map((action) => (
                <ActionCard key={action.id} action={action} onDecide={decide} compact />
              ))}
            </section>
          )}

          {decided.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-display text-2xl font-semibold">Already decided</h2>
              <div className="rounded-md border border-rule bg-white p-4">
                <ul className="space-y-2 text-sm text-steel">
                  {decided.slice(0, 6).map((action) => (
                    <li key={action.id} className="border-b border-rule pb-2 last:border-b-0">
                      {action.sku} — {action.status}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </div>
      )}

      <Notice notice={notice} onDismiss={() => setNotice(null)} />
    </main>
  );
}
