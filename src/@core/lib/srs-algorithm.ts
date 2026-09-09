import {
  addMinutes,
  addDays,
  formatDistanceStrict,
  formatDistanceToNowStrict,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import type { SrsRating } from "@core/types";

export interface SrsItem {
  interval: number;
  easeFactor: number;
  repetitions: number;
  nextReviewAt: string;
  updatedAt?: string;
  lastReviewAt?: string;
  solvedAt?: string;
}

export const MIN_EASE_FACTOR = 1.3;
export const DEFAULT_EASE_FACTOR = 2.5;

const iso = (d: Date) => d.toISOString();

type RatingMeta = {
  multiplier: number;
  deltaEase: number;
  resetRepetitions?: boolean;
  resetInterval?: boolean;
  firstInterval?: number;
};

const RATING_TABLE: Record<SrsRating, RatingMeta> = {
  again: {
    multiplier: 0,
    deltaEase: -0.2,
    resetRepetitions: true,
    resetInterval: true,
    firstInterval: 0,
  },
  hard: { multiplier: 1.2, deltaEase: -0.15, firstInterval: 1 },
  medium: { multiplier: 2.5, deltaEase: 0, firstInterval: 1 },
  easy: { multiplier: 3.0, deltaEase: +0.15, firstInterval: 4 },
};

export function scheduleSrs<T extends SrsItem>(
  item: T,
  rating: SrsRating,
  now: Date = new Date(),
): T {
  const meta = RATING_TABLE[rating];
  let repetitions = item.repetitions;
  let interval = item.interval;
  let easeFactor = item.easeFactor;

  easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor + meta.deltaEase);

  if (meta.resetRepetitions) repetitions = 0;
  else repetitions = repetitions + 1;

  if (meta.resetInterval) {
    interval = 0;
  } else if (repetitions <= 1) {
    interval = meta.firstInterval ?? 1;
  } else {
    interval = Math.max(1, Math.round(interval * meta.multiplier));
  }
  interval = Math.max(meta.firstInterval ?? 0, interval);

  let next: Date;
  if (rating === "again") {
    next = addMinutes(now, 10);
  } else {
    next = addDays(now, interval);
  }

  return {
    ...item,
    interval,
    easeFactor,
    repetitions,
    lastReviewAt: iso(now),
    nextReviewAt: iso(next),
    updatedAt: iso(now),
    solvedAt: (item as any).solvedAt ?? iso(now),
  } as T;
}

export function newCardDefaults(now: Date = new Date()): SrsItem {
  return {
    interval: 0,
    easeFactor: DEFAULT_EASE_FACTOR,
    repetitions: 0,
    nextReviewAt: iso(now),
  };
}

export function estimateNextDate(
  item: Pick<SrsItem, "interval" | "easeFactor" | "repetitions">,
  rating: SrsRating,
  now: Date = new Date(),
): Date {
  const meta = RATING_TABLE[rating];
  let repetitions = item.repetitions;
  let interval = item.interval;

  if (meta.resetRepetitions) repetitions = 0;
  else repetitions = repetitions + 1;

  if (meta.resetInterval) interval = 0;
  else if (repetitions <= 1) interval = meta.firstInterval ?? 1;
  else interval = Math.max(1, Math.round(interval * meta.multiplier));
  interval = Math.max(meta.firstInterval ?? 0, interval);

  return rating === "again" ? addMinutes(now, 10) : addDays(now, interval);
}

export function humanNextInterval(
  item: Pick<SrsItem, "interval" | "easeFactor" | "repetitions">,
  rating: SrsRating,
  now: Date = new Date(),
): string {
  const next = estimateNextDate(item, rating, now);
  if (rating === "again") {
    return `${formatDistanceStrict(next, now, { locale: ptBR, addSuffix: false })}`;
  }
  const days = Math.round((+next - +now) / (1000 * 60 * 60 * 24));
  if (days <= 0) return formatDistanceStrict(next, now, { locale: ptBR });
  if (days === 1) return "1 dia";
  return `${days} dias`;
}

export function humanDueLabel(
  nextReviewAt: string,
  _now: Date = new Date(),
): string {
  const due = new Date(nextReviewAt);
  return formatDistanceToNowStrict(due, { locale: ptBR, addSuffix: true });
}
