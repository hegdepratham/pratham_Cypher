
import { useState } from 'react'
import { Button } from './ui'

const APPROVE_LABEL = {
  transfer: 'Approve transfer',
  purchase_order: 'Approve purchase order',
  alert: 'Approve follow-up',
}

const NOUN = {
  transfer: 'transfer request',
  purchase_order: 'purchase order',
  alert: 'follow-up',
}

export default function DecisionBar({ id, type, onDecide }) {
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)

  async function submit(verdict) {
    setBusy(true)

    try {
      await onDecide(id, verdict)
    } finally {
      setBusy(false)
      setConfirm(null)
    }
  }

  if (!confirm) {
    return (
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Button onClick={() => setConfirm('approve')}>
          {APPROVE_LABEL[type] || 'Approve'}
        </Button>

        <Button
          variant="secondary"
          onClick={() => setConfirm('reject')}
        >
          Reject
        </Button>
      </div>
    )
  }

  const approving = confirm === 'approve'

  return (
    <div
      role="group"
      aria-label="Confirm your decision"
      className="mt-4 rounded-md bg-sheet p-4"
    >
      <p className="font-medium">
        {approving
          ? `Approve this ${NOUN[type] || 'suggestion'}? Nothing is sent to anyone. The decision is recorded.`
          : 'Reject this suggestion?'}
      </p>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <Button
          busy={busy}
          variant={approving ? 'primary' : 'danger'}
          onClick={() => submit(confirm)}
        >
          {approving ? 'Yes, approve' : 'Yes, reject'}
        </Button>

        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => setConfirm(null)}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}