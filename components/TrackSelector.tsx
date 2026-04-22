'use client';

import { useAuthStore } from '@/stores/useAuthStore';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function TrackSelector() {
  const { quizSegment, setTrack } = useAuthStore();
  const router = useRouter();
  const [selected, setSelected] = useState<'single' | 'relationship' | null>(
    quizSegment?.recommendedTrack || null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selected) return;
    setIsSubmitting(true);

    // Отправляем выбор на бэкенд (через n8n)
    await fetch('/api/select-track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ track: selected }),
    });

    setTrack(selected);
    router.push('/ladder');
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Выберите ваш трек</h1>
      {quizSegment?.recommendedTrack && (
        <p className="text-sm text-gray-600 mb-4">
          По результатам квиза мы рекомендуем трек:{' '}
          <strong>{quizSegment.recommendedTrack === 'single' ? 'Для одиноких' : 'Для тех, кто в отношениях'}</strong>
        </p>
      )}
      <div className="space-y-3">
        <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
          <input
            type="radio"
            name="track"
            value="single"
            checked={selected === 'single'}
            onChange={() => setSelected('single')}
            className="mr-3"
          />
          <div>
            <div className="font-medium">Трек для одиноких</div>
            <div className="text-sm text-gray-500">От знакомства до построения отношений</div>
          </div>
        </label>
        <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
          <input
            type="radio"
            name="track"
            value="relationship"
            checked={selected === 'relationship'}
            onChange={() => setSelected('relationship')}
            className="mr-3"
          />
          <div>
            <div className="font-medium">Трек для тех, кто в отношениях</div>
            <div className="text-sm text-gray-500">Углубление связи и работа над качеством</div>
          </div>
        </label>
      </div>
      <button
        onClick={handleSubmit}
        disabled={!selected || isSubmitting}
        className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg disabled:opacity-50"
      >
        {isSubmitting ? 'Сохраняем...' : 'Продолжить'}
      </button>
    </div>
  );
}