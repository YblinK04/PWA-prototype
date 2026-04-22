'use client';

import { useState } from 'react';

interface ReportFormProps {
  stepId: number;
  onSuccess: (feedback: string) => void;
}

export function ReportForm({ stepId, onSuccess }: ReportFormProps) {
  const [report, setReport] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'processing' | 'done'>('idle');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pollTaskStatus = async (taskId: string) => {
    const maxAttempts = 30; 
    let attempts = 0;

    const poll = async () => {
      const res = await fetch(`/api/task-status?taskId=${taskId}`);
      const data = await res.json();

      if (data.status === 'completed') {
        setStatus('done');
        setFeedback(data.ai_feedback);
        onSuccess(data.ai_feedback);
        return;
      }

      if (data.status === 'failed') {
        setStatus('idle');
        setError(data.error || 'Произошла ошибка при анализе');
        return;
      }

      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(poll, 2000);
      } else {
        setStatus('idle');
        setError('Превышено время ожидания ответа');
      }
    };

    poll();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report.trim()) return;

    setStatus('submitting');
    setError(null);

    try {
      //  отправляем отчёт
      const submitRes = await fetch('/api/submit-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId, report }),
      });

      const submitData = await submitRes.json();

      if (!submitRes.ok) {
        throw new Error(submitData.error || 'Ошибка отправки');
      }

      //  n8n вернул task_id — начинаем опрос
      setStatus('processing');
      pollTaskStatus(submitData.task_id);
    } catch (err: unknown) {
      if (err instanceof Error) {
      setStatus('idle');
      setError(err.message);
      }
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      {status === 'done' && feedback ? (
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <h3 className="font-medium text-green-800 mb-2">Обратная связь от AI</h3>
          <p className="text-green-700 whitespace-pre-wrap">{feedback}</p>
          <button
            onClick={() => {
              setStatus('idle');
              setReport('');
              setFeedback(null);
            }}
            className="mt-4 text-blue-600"
          >
            Отправить ещё один отчёт
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <textarea
            value={report}
            onChange={(e) => setReport(e.target.value)}
            placeholder="Опишите, как прошло выполнение задания..."
            className="w-full p-3 border rounded-lg min-h-32"
            disabled={status !== 'idle'}
          />
          {error && <p className="text-red-600 mt-2">{error}</p>}
          <button
            type="submit"
            disabled={status !== 'idle' || !report.trim()}
            className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg disabled:opacity-50"
          >
            {status === 'idle' && 'Отправить отчёт'}
            {status === 'submitting' && 'Отправка...'}
            {status === 'processing' && (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" /* ... */ />
                AI анализирует отчёт...
              </span>
            )}
          </button>
        </form>
      )}
    </div>
  );
}