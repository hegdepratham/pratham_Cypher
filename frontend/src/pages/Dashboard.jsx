import AskPanel from '../components/AskPanel'
import ActionCard from '../components/ActionCard'
import DecidedList from '../components/DecidedList'
import { useActions } from '../hooks/useActions'
import {
  Button,
  CardSkeleton,
  EmptyState,
  ErrorState,
  Notice,
} from '../components/ui'

function greeting() {
  const hour = new Date().getHours()
  return hour < 12
    ? 'Good morning'
    : hour < 17
      ? 'Good afternoon'
      : 'Good evening'
}

export default function Dashboard() {
  const {
    state,
    analyzing,
    notice,
    setNotice,
    reload,
    runAnalysis,
    pending,
    top3,
    rest,
    decided,
    highCount,
    decide,
  } = useActions()

  const summary =
    state.status === 'loading'
      ? "Loading today's briefing…"
      : state.status === 'error'
        ? 'The briefing could not be loaded.'
        : pending.length === 0
          ? 'Nothing is waiting for you.'
          : `${pending.length} ${
              pending.length === 1 ? 'issue needs' : 'issues need'
            } a decision, ${highCount} high priority.`

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold leading-none sm:text-5xl">
            {greeting()}, Ramesh
          </h1>
          <p className="mt-2 text-steel">{summary}</p>
        </div>

        <Button
          onClick={runAnalysis}
          busy={analyzing}
          className="w-full sm:w-auto"
        >
          {analyzing ? 'Analysing…' : 'Run analysis'}
        </Button>
      </header>

      {analyzing && (
        <p role="status" className="mt-4 text-steel">
          Reading stock, sales, suppliers and open purchase orders…
        </p>
      )}

      {state.status === 'loading' && (
        <div className="mt-6 space-y-4" role="status" aria-label="Loading">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      {state.status === 'error' && (
        <ErrorState
          title="Couldn't load today's briefing"
          error={state.error}
          onRetry={reload}
        />
      )}

      {state.status === 'ready' && pending.length === 0 && (
        <EmptyState
          title={decided.length ? 'You are all caught up' : 'No briefing yet'}
          body={
            decided.length
              ? 'Every suggestion has a decision. Run the analysis again to check for new problems.'
              : 'Run the analysis and the agent will read stock, sales, suppliers and purchase orders for you.'
          }
          action={
            <Button onClick={runAnalysis} busy={analyzing}>
              Run analysis
            </Button>
          }
        />
      )}

      
{state.status === 'ready' && pending.length > 0 && (
  <>
    <section aria-labelledby="top-heading" className="mt-8">
      <h2
        id="top-heading"
        className="font-display text-2xl font-semibold"
      >
        {top3.length === 3
          ? 'Three things that matter today'
          : 'What matters today'}
      </h2>

      <ol className="mt-4 space-y-4">
        {top3.map((a, i) => (
          <li key={a.id}>
            <ActionCard
              action={a}
              position={i + 1}
              defaultOpen
              onDecide={decide}
            />
          </li>
        ))}
      </ol>
    </section>

    {rest.length > 0 && (
      <section aria-labelledby="rest-heading" className="mt-10">
        <h2
          id="rest-heading"
          className="font-display text-2xl font-semibold"
        >
          Also on the radar
        </h2>

        <ul className="mt-4 space-y-4">
          {rest.map((a) => (
            <li key={a.id}>
              <ActionCard action={a} onDecide={decide} />
            </li>
          ))}
        </ul>
      </section>
    )}
  </>
)}

{state.status === 'ready' && <DecidedList items={decided} />}
     {state.status === 'ready' && <AskPanel />} <Notice notice={notice} onDismiss={() => setNotice(null)} />
    </main>
  )
}