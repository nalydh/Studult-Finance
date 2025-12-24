/*
StrategyPresets Module:
  Defines preset budgeting strategies and a constant for custom split identification.
*/

export const CUSTOM_SPLIT_ID = 1;

export const SPLIT_OPTIONS = [
  {
    id: 2,
    label: "Passive Saver",
    value: { needs: 50, wants: 40, savings: 10 },
    description: "More flexibility for lifestyle and casual income.",
  },
  {
    id: 3,
    label: "Moderate Saver",
    value: { needs: 50, wants: 30, savings: 20 },
    description: "Balanced strategy for most users.",
  },
  {
    id: 4,
    label: "Aggressive Saver",
    value: { needs: 50, wants: 25, savings: 25 },
    description: "Prioritize saving for big goals or early retirement.",
  },
];
