import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProfileResponseSchema } from '@/app/api/profile/route';
import {z} from 'zod'

type ProfileResponse = z.infer<typeof ProfileResponseSchema>;

interface AuthState {
  telegramId: number | null;
  track: 'single' | 'relationship' | null;
  quizSegment: {
    recommendedTrack?: 'single' | 'relationship';
    tags?: string[];
  } | null;
  socialLevel: number | null;
  setProfile: (profile: any) => void;
  setTrack: (track: 'single' | 'relationship') => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      telegramId: null,
      track: null,
      quizSegment: null,
      socialLevel: null,
      setProfile: (profile) =>
        set({
          telegramId: profile.telegram_id,
          socialLevel: profile.social_level,
          quizSegment: profile.quiz_segment,
          track: profile.student_data?.social_profile as 'single' | 'relationship' | null,
        }),
      setTrack: (track) => set({ track }),
      clear: () => set({ telegramId: null, track: null, quizSegment: null, socialLevel: null }),
    }),
    { name: 'auth-storage' } // сохраняем в localStorage
  )
);