import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';

const byRank = (a, b) => (a.evidence?.rank ?? 999) - (b.evidence?.rank ?? 999);

export function useActions() {
  const [state, setState] = useState({ status: 'loading', actions: [], error: null });
  const [analyzing, setAnalyzing] = useState(false);
  const [notice, setNotice] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const actions = await api.getActions();
      setState({ status: 'ready', actions, error: null });
    } catch (error) {
      setState({ status: 'error', actions: [], error });
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const reload = useCallback(() => {
    setState({ status: 'loading', actions: [], error: null });
    fetchAll();
  }, [fetchAll]);

  const runAnalysis = useCallback(async () => {
    setAnalyzing(true);
    setNotice(null);
    try {
      const fresh = await api.analyze();
      const next = await api.getActions();
      setState({ status: 'ready', actions: next, error: null });
      setNotice({ tone: 'success', text: `Analysis finished: ${fresh.length} ${fresh.length === 1 ? 'item needs' : 'items need'} a decision.` });
    } catch (err) {
      setNotice({ tone: 'error', text: err.message });
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const decide = useCallback(async (id, verdict) => {
    try {
      const updated = verdict === 'approve' ? await api.approve(id) : await api.reject(id);
      setState((s) => ({ ...s, actions: s.actions.map((a) => (a.id === id ? updated : a)) }));
      setNotice({
        tone: 'success',
        text: verdict === 'approve' ? 'Approved and recorded. Nothing was sent to anyone.' : 'Rejected. The agent will not suggest it again for 24 hours.',
      });
    } catch (err) {
      if (err.status === 404 || err.status === 409) {
        setNotice({
          tone: 'error',
          text: err.status === 409 ? 'This one was already decided. The list is refreshed.' : 'That suggestion no longer exists. The list is refreshed.',
        });
        fetchAll();
      } else {
        setNotice({ tone: 'error', text: err.message });
      }
    }
  }, [fetchAll]);

  const derived = useMemo(() => {
    const pending = state.actions.filter((a) => a.status === 'pending').sort(byRank);
    return {
      pending,
      top3: pending.slice(0, 3),
      rest: pending.slice(3),
      decided: state.actions.filter((a) => a.status !== 'pending'),
      highCount: pending.filter((a) => a.evidence?.severity === 'high').length,
    };
  }, [state.actions]);

  return { state, analyzing, notice, setNotice, reload, runAnalysis, decide, ...derived };
}
