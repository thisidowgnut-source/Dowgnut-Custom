"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Gamification store — streak counter + collection badges.
 * Persisted to localStorage so progress survives sessions.
 */

interface GamificationState {
  // Streak
  lastOrderDate: string | null;
  streak: number;
  recordStreak: number;

  // Collection — which donut types the user has ordered
  orderedTypes: string[];
  orderedDonutNames: string[];

  // Actions
  recordOrder: (donutNames: string[], types: string[]) => void;
  getBadges: () => Badge[];
  resetStreak: () => void;
}

export interface Badge {
  id: string;
  label: string;
  emoji: string;
  earned: boolean;
  desc: string;
}

export const useGamification = create<GamificationState>()(
  persist(
    (set, get) => ({
      lastOrderDate: null,
      streak: 0,
      recordStreak: 0,
      orderedTypes: [],
      orderedDonutNames: [],

      recordOrder: (donutNames, types) => {
        const today = new Date().toDateString();
        const { lastOrderDate, streak, recordStreak, orderedTypes, orderedDonutNames } = get();

        // Streak logic: if yesterday → +1, if today → no change, if older → reset to 1
        let newStreak = streak;
        if (lastOrderDate !== today) {
          const yesterday = new Date(Date.now() - 86400000).toDateString();
          if (lastOrderDate === yesterday) {
            newStreak = streak + 1;
          } else {
            newStreak = 1;
          }
        }

        const newTypes = [...new Set([...orderedTypes, ...types])];
        const newDonutNames = [...new Set([...orderedDonutNames, ...donutNames])];

        set({
          lastOrderDate: today,
          streak: newStreak,
          recordStreak: Math.max(recordStreak, newStreak),
          orderedTypes: newTypes,
          orderedDonutNames: newDonutNames,
        });
      },

      getBadges: () => {
        const { streak, orderedTypes, orderedDonutNames } = get();
        return [
          {
            id: "first-order",
            label: "First Bite",
            emoji: "🍩",
            earned: orderedDonutNames.length > 0,
            desc: "Place your first order",
          },
          {
            id: "streak-3",
            label: "On a Roll",
            emoji: "🔥",
            earned: streak >= 3,
            desc: "Order 3 days in a row",
          },
          {
            id: "streak-7",
            label: "Weekly Dowg",
            emoji: "⚡",
            earned: streak >= 7,
            desc: "Order 7 days in a row",
          },
          {
            id: "try-all-types",
            label: "Explorer",
            emoji: "🗺️",
            earned: orderedTypes.length >= 4,
            desc: "Try all 4 donut types",
          },
          {
            id: "try-10",
            label: "Taste Tester",
            emoji: "👅",
            earned: orderedDonutNames.length >= 10,
            desc: "Try 10 different donuts",
          },
          {
            id: "try-all",
            label: "Donut Master",
            emoji: "👑",
            earned: orderedDonutNames.length >= 21,
            desc: "Try all 21 donuts",
          },
        ];
      },

      resetStreak: () => set({ streak: 0, lastOrderDate: null }),
    }),
    { name: "dowgnut-gamification" }
  )
);
