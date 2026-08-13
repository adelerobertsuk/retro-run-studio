/** Upcoming features — surfaced in Settings and used for future personalization hooks. */

export type RoadmapFeature = {
  id: string;
  title: string;
  status: "coming-soon" | "in-progress";
  summary: string;
  detail: string;
  /** Personalization tokens the feature will use when live */
  personalizes?: string[];
};

export const ROADMAP_FEATURES: RoadmapFeature[] = [
  {
    id: "radio-80s",
    title: "80s Radio Station",
    status: "coming-soon",
    summary: "Cheesy classic DJs, synth bangers, and shout-outs with your name.",
    detail:
      "A fun in-app retro radio stream hosted by over-the-top 80s-style DJs. They'll dynamically call out your display name, celebrate streaks, and hype your next run — a personalized workout soundtrack without leaving the app.",
    personalizes: ["profile.name", "run streak", "active city"],
  },
];

export function radioDjShoutoutPreview(displayName: string): string {
  const first = (displayName.trim().split(" ")[0] || "RUNNER").toUpperCase();
  const lines = [
    `THAT'S A WRAP, ${first}! YOU CRUSHED IT!`,
    `COMING UP NEXT — ${first}'S VICTORY LAP MIX!`,
    `STAY TUNED, ${first}. THE NIGHT IS STILL YOUNG!`,
  ];
  const day = new Date().getDate();
  return lines[day % lines.length]!;
}
