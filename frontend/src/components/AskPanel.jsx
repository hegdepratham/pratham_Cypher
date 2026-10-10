
import { useState } from 'react'
import { api } from '../api/client'
import { Button } from './ui'

const SUGGESTIONS = [
  'Why was the Gokak filter flagged?',
  'Which location is most at risk this week?',
  'How much cash is tied up in slow stock?',
]

export default function AskPanel() {
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState({
    status: 'idle',
    answer: '',
    error: '',
  })

  async function ask(text) {
    const q = text.trim()
    if (!q) return

    setQuestion(q)
    setResult({ status: 'loading', answer: '', error: '' })

    try {
      const res = await api.ask(q)
      setResult({
        status: 'done',
        answer: res.answer,
        error: '',
      })
    } catch (err) {
      setResult({
        status: 'error',
        answer: '',
        error:
          err.status === 501
            ? 'Questions are not switched on yet.'
            : err.message,
      })
    }
  }

  return (
    <section aria-labelledby="ask-heading" className="mt-12">
      <h2
        id="ask-heading"
        className="font-display text-2xl font-semibold"
      >
        Ask the agent
      </h2>

      <p className="mt-1 text-steel">
        Answers come from today's stock, sales, supplier and order data.
      </p>

      <form
        className="mt-3 flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault()
          ask(question)
        }}
      >
        <label htmlFor="ask-input" className="sr-only">
          Your question
        </label>

        <input
          id="ask-input"
          value={question}
          maxLength={300}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="For example: why is Gokak low on filters?"
          className="min-h-11 flex-1 rounded-md border border-steel bg-white px-3"
        />

        <Button
          type="submit"
          busy={result.status === 'loading'}
        >
          {result.status === 'loading' ? 'Thinking…' : 'Ask'}
        </Button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => ask(s)}
            className="min-h-11 rounded-full border border-rule bg-white px-4 text-sm hover:bg-sheet"
          >
            {s}
          </button>
        ))}
      </div>

      <div aria-live="polite" className="mt-4">
        {result.status === 'done' && (
          <p className="max-w-prose rounded-md bg-white p-4 leading-relaxed">
            {result.answer}
          </p>
        )}

        {result.status === 'error' && (
          <p
            role="alert"
            className="rounded-md bg-high-tint p-4 font-medium text-high"
          >
            {result.error}
          </p>
        )}
      </div>
    </section>
  )
}