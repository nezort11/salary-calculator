/**
 * Bible structure and reading plan generation
 * Uses verse counts for smart distribution across days
 */

import { format } from "date-fns";
import type { Locale } from "date-fns";

export interface BibleBook {
  name: string;
  abbreviation: string;
  /** Number of verses in each chapter */
  versesByChapter: number[];
}

export interface ReadingDay {
  date: Date;
  readings: string[];
}

export interface ReadingSegment {
  book: BibleBook;
  chapter: number;
  verseStart?: number; // If undefined, means whole chapter
  verseEnd?: number; // If undefined, means whole chapter
}

export type Testament = "new" | "old";

export interface PresetPlan {
  id: string;
  name: string;
  description: string;
  testament: Testament;
  days: number;
}

export interface FixedPlan {
  id: string;
  name: string;
  description: string;
  testament: Testament;
  readings: string[];
}

// Preset reading plans for quick selection
export const PRESET_PLANS: PresetPlan[] = [];

// Fixed reading plans with predetermined schedules
export const FIXED_PLANS: FixedPlan[] = [
  {
    id: "new-testament-fixed-year",
    name: "Новый Завет за год (фиксированный план)",
    description:
      "Фиксированный план чтения Нового Завета за год с ежедневными чтениями.",
    testament: "new",
    readings: [
      "Мф.1",
      "Мф.2",
      "Мф.3",
      "Мф.4",
      "Мф.5:1–26",
      "Мф.5:27–48",
      "Мф.6",
      "Мф.7",
      "Мф.8",
      "Мф.9:1–17",
      "Мф.9:18–38",
      "Мф.10:1–23",
      "Мф.10:24–42",
      "Мф.11",
      "Мф.12:1–21",
      "Мф.12:22–50",
      "Мф.13:1–32",
      "Мф.13:33–58",
      "Мф.14:1–21",
      "Мф.14:22–36",
      "Мф.15:1–20",
      "Мф.15:21–39",
      "Мф.16",
      "Мф.17",
      "Мф.18:1–20",
      "Мф.18:21–35",
      "Мф.19:1–15",
      "Мф.19:16–30",
      "Мф.20:1–16",
      "Мф.20:17–34",
      "Мф.21:1–22",
      "Мф.21:23‑46",
      "Мф.22:1‑22",
      "Мф.22:23‑46",
      "Мф.23:1‑22",
      "Мф.23:23‑39",
      "Мф.24:1‑22",
      "Мф.24:23‑51",
      "Мф.25:1‑30",
      "Мф.25:31‑46",
      "Мф.26:1‑19",
      "Мф.26:20‑54",
      "Мф.26:55‑75",
      "Мф.27:1‑31",
      "Мф.27:32‑66",
      "Мф.28",
      "Мк.1:1‑22",
      "Мк.1:23‑45",
      "Мк.2",
      "Мк.3:1‑21",
      "Мк.3:22‑35",
      "Мк.4:1‑20",
      "Мк.4:21‑41",
      "Мк.5:1‑20",
      "Мк.5:21‑43",
      "Мк.6:1‑32",
      "Мк.6:33‑56",
      "Мк.7:1‑13",
      "Мк.7:14‑37",
      "Мк.8:1‑21",
      "Мк.8:22‑38",
      "Мк.9:1‑29",
      "Мк.9:30‑50",
      "Мк.10:1‑31",
      "Мк.10:32‑52",
      "Мк.11:1‑19",
      "Мк.11:20‑33",
      "Мк.12:1‑27",
      "Мк.12:28‑44",
      "Мк.13:1‑13",
      "Мк.13:14‑37",
      "Мк.14:1‑25",
      "Мк.14:26‑50",
      "Мк.14:51‑72",
      "Мк.15:1‑26",
      "Мк.15:27‑47",
      "Мк.16",
      "Лк.1:1‑23",
      "Лк.1:24‑56",
      "Лк.1:57‑80",
      "Лк.2:1‑24",
      "Лк.2:25‑52",
      "Лк.3",
      "Лк.4:1‑32",
      "Лк.4:33‑44",
      "Лк.5:1‑16",
      "Лк.5:17‑39",
      "Лк.6:1‑26",
      "Лк.6:27‑49",
      "Лк.7:1‑30",
      "Лк.7:31‑50",
      "Лк.8:1‑21",
      "Лк.8:22‑56",
      "Лк.9:1‑36",
      "Лк.9:37‑62",
      "Лк.10:1‑24",
      "Лк.10:25‑42",
      "Лк.11:1‑28",
      "Лк.11:29‑54",
      "Лк.12:1‑34",
      "Лк.12:35‑59",
      "Лк.13:1‑21",
      "Лк.13:22‑35",
      "Лк.14:1‑24",
      "Лк.14:25‑35",
      "Лк.15:1‑10",
      "Лк.15:11‑32",
      "Лк.16:1‑18",
      "Лк.16:19‑31",
      "Лк.17:1‑19",
      "Лк.17:20‑37",
      "Лк.18:1‑17",
      "Лк.18:18‑43",
      "Лк.19:1‑28",
      "Лк.19:29‑48",
      "Лк.20:1‑26",
      "Лк.20:27‑47",
      "Лк.21:1‑19",
      "Лк.21:20‑38",
      "Лк.22:1‑30",
      "Лк.22:31‑53",
      "Лк.22:54‑71",
      "Лк.23:1‑26",
      "Лк.23:27‑38",
      "Лк.23:39–56",
      "Лк.24:1–35",
      "Лк.24:36–53",
      "Ин.1:1–28",
      "Ин.1:29–51",
      "Ин.2",
      "Ин.3:1–21",
      "Ин.3:22–36",
      "Ин.4:1–30",
      "Ин.4:31–54",
      "Ин.5:1–24",
      "Ин.5:25–47",
      "Ин.6:1–21",
      "Ин.6:22–44",
      "Ин.6:45–71",
      "Ин.7:1–31",
      "Ин.7:32–53",
      "Ин.8:1–20",
      "Ин.8:21–36",
      "Ин.8:37–59",
      "Ин.9:1–23",
      "Ин.9:24–41",
      "Ин.10:1–21",
      "Ин.10:22–42",
      "Ин.11:1–17",
      "Ин.11:18–46",
      "Ин.11:47–57",
      "Ин.12:1–19",
      "Ин.12:20–50",
      "Ин.13:1–17",
      "Ин.13:18–38",
      "Ин.14",
      "Ин.15",
      "Ин.16:1–15",
      "Ин.16:16–33",
      "Ин.17",
      "Ин.18:1–23",
      "Ин.18:24–40",
      "Ин.19:1–22",
      "Ин.19:23–42",
      "Ин.20",
      "Ин.21",
      "Деян.1",
      "Деян.2:1–13",
      "Деян.2:14–47",
      "Деян.3",
      "Деян.4:1–22",
      "Деян.4:23–37",
      "Деян.5:1–16",
      "Деян.5:17–42",
      "Деян.6",
      "Деян.7:1–19",
      "Деян.7:20–43",
      "Деян.7:44–60",
      "Деян.8:1–25",
      "Деян.8:26–40",
      "Деян.9:1–22",
      "Деян.9:23–43",
      "Деян.10:1–23",
      "Деян.10:24–48",
      "Деян.11",
      "Деян.12",
      "Деян.13:1–23",
      "Деян.13:24–52",
      "Деян.14",
      "Деян.15:1–21",
      "Деян.15:22–41",
      "Деян.16:1–15",
      "Деян.16:16–40",
      "Деян.17:1–15",
      "Деян.17:16–34",
      "Деян.18",
      "Деян.19:1–20",
      "Деян.19:21–41",
      "Деян.20:1–16",
      "Деян.20:17–38",
      "Деян.21:1–14",
      "Деян.21:15–40",
      "Деян.22",
      "Деян.23:1–11",
      "Деян.23:12–35",
      "Деян.24",
      "Деян.25",
      "Деян.26",
      "Деян.27:1–25",
      "Деян.27:26–44",
      "Деян.28:1–15",
      "Деян.28:16–31",
      "Рим.1",
      "Рим.2",
      "Рим.3",
      "Рим.4",
      "Рим.5",
      "Рим.6",
      "Рим.7",
      "Рим.8:1–18",
      "Рим.8:19–39",
      "Рим.9",
      "Рим.10",
      "Рим.11:1–21",
      "Рим.11:22–36",
      "Рим.12",
      "Рим.13",
      "Рим.14",
      "Рим.15:1–21",
      "Рим.15:22–33",
      "Рим.16",
      "1Кор.1",
      "1Кор.2",
      "1Кор.3",
      "1Кор.4",
      "1Кор.5",
      "1Кор.6",
      "1Кор.7:1–24",
      "1Кор.7:25–40",
      "1Кор.8",
      "1Кор.9",
      "1Кор.10:1–13",
      "1Кор.10:14–33",
      "1Кор.11:1–15",
      "1Кор.11:16–34",
      "1Кор.12",
      "1Кор.13",
      "1Кор.14:1–20",
      "1Кор.14:21–40",
      "1Кор.15:1–32",
      "1Кор.15:33–58",
      "1Кор.16",
      "2Кор.1",
      "2Кор.2",
      "2Кор.3",
      "2Кор.4",
      "2Кор.5",
      "2Кор.6",
      "2Кор.7",
      "2Кор.8",
      "2Кор.9",
      "2Кор.10",
      "2Кор.11:1–15",
      "2Кор.11:16–33",
      "2Кор.12",
      "2Кор.13",
      "Гал.1",
      "Гал.2",
      "Гал.3",
      "Гал.4",
      "Гал.5",
      "Гал.6",
      "Еф.1",
      "Еф.2",
      "Еф.3",
      "Еф.4",
      "Еф.5",
      "Еф.6",
      "Флп.1",
      "Флп.2",
      "Флп.3",
      "Флп.4",
      "Кол.1",
      "Кол.2",
      "Кол.3",
      "Кол.4",
      "1Фес.1",
      "1Фес.2",
      "1Фес.3",
      "1Фес.4",
      "1Фес.5",
      "2Фес.1",
      "2Фес.2",
      "2Фес.3",
      "1Тим.1",
      "1Тим.2",
      "1Тим.3",
      "1Тим.4",
      "1Тим.5",
      "1Тим.6",
      "2Тим.1",
      "2Тим.2",
      "2Тим.3",
      "2Тим.4",
      "Тит.1",
      "Тит.2",
      "Тит.3",
      "Флм.",
      "Евр.1",
      "Евр.2",
      "Евр.3",
      "Евр.4",
      "Евр.5",
      "Евр.6",
      "Евр.7",
      "Евр.8",
      "Евр.9",
      "Евр.10:1–23",
      "Евр.10:24–39",
      "Евр.11:1–19",
      "Евр.11:20–40",
      "Евр.12",
      "Евр.13",
      "Иак.1",
      "Иак.2",
      "Иак.3",
      "Иак.4",
      "Иак.5",
      "1Пет.1",
      "1Пет.2",
      "1Пет.3",
      "1Пет.4",
      "1Пет.5",
      "2Пет.1",
      "2Пет.2",
      "2Пет.3",
      "1Ин.1",
      "1Ин.2",
      "1Ин.3",
      "1Ин.4",
      "1Ин.5",
      "2Ин.",
      "3Ин.",
      "Иуд.",
      "Откр.1",
      "Откр.2",
      "Откр.3",
      "Откр.4",
      "Откр.5",
      "Откр.6",
      "Откр.7",
      "Откр.8",
      "Откр.9",
      "Откр.10",
      "Откр.11",
      "Откр.12",
      "Откр.13",
      "Откр.14",
      "Откр.15",
      "Откр.16",
      "Откр.17",
      "Откр.18",
      "Откр.19",
      "Откр.20",
      "Откр.21",
      "Откр.22",
    ],
  },
];

// Новый Завет (27 книг, 260 глав, 7,957 стихов)
export const NEW_TESTAMENT: BibleBook[] = [
  {
    name: "Евангелие от Матфея",
    abbreviation: "Мф.",
    versesByChapter: [
      25, 23, 17, 25, 48, 34, 29, 34, 38, 42, 30, 50, 58, 36, 39, 28, 27,
      35, 30, 34, 46, 46, 39, 51, 46, 75, 66, 20,
    ],
  },
  {
    name: "Евангелие от Марка",
    abbreviation: "Мк.",
    versesByChapter: [
      45, 28, 35, 41, 43, 56, 37, 38, 50, 52, 33, 44, 37, 72, 47, 20,
    ],
  },
  {
    name: "Евангелие от Луки",
    abbreviation: "Лк.",
    versesByChapter: [
      80, 52, 38, 44, 39, 49, 50, 56, 62, 42, 54, 59, 35, 35, 32, 31, 37,
      43, 48, 47, 38, 71, 56, 53,
    ],
  },
  {
    name: "Евангелие от Иоанна",
    abbreviation: "Ин.",
    versesByChapter: [
      51, 25, 36, 54, 47, 71, 53, 59, 41, 42, 57, 50, 38, 31, 27, 33, 26,
      40, 42, 31, 25,
    ],
  },
  {
    name: "Деяния",
    abbreviation: "Деян.",
    versesByChapter: [
      26, 47, 26, 37, 42, 15, 60, 40, 43, 48, 30, 25, 52, 28, 41, 40, 34,
      28, 41, 38, 40, 30, 35, 27, 27, 32, 44, 31,
    ],
  },
  {
    name: "Послание Иакова",
    abbreviation: "Иак.",
    versesByChapter: [27, 26, 18, 17, 20],
  },
  {
    name: "1-е Петра",
    abbreviation: "1Пет.",
    versesByChapter: [25, 25, 22, 19, 14],
  },
  {
    name: "2-е Петра",
    abbreviation: "2Пет.",
    versesByChapter: [21, 22, 18],
  },
  {
    name: "1-е Иоанна",
    abbreviation: "1Ин.",
    versesByChapter: [10, 29, 24, 21, 21],
  },
  {
    name: "2-е Иоанна",
    abbreviation: "2Ин.",
    versesByChapter: [13],
  },
  {
    name: "3-е Иоанна",
    abbreviation: "3Ин.",
    versesByChapter: [14],
  },
  {
    name: "Послание Иуды",
    abbreviation: "Иуд.",
    versesByChapter: [25],
  },
  {
    name: "Послание к Римлянам",
    abbreviation: "Рим.",
    versesByChapter: [
      32, 29, 31, 25, 21, 23, 25, 39, 33, 21, 36, 21, 14, 23, 33, 27,
    ],
  },
  {
    name: "1-е Коринфянам",
    abbreviation: "1Кор.",
    versesByChapter: [
      31, 16, 23, 21, 13, 20, 40, 13, 27, 33, 34, 31, 13, 40, 58, 24,
    ],
  },
  {
    name: "2-е Коринфянам",
    abbreviation: "2Кор.",
    versesByChapter: [24, 17, 18, 18, 21, 18, 16, 24, 15, 18, 33, 21, 14],
  },
  {
    name: "Галатам",
    abbreviation: "Гал.",
    versesByChapter: [24, 21, 29, 31, 26, 18],
  },
  {
    name: "Ефесянам",
    abbreviation: "Еф.",
    versesByChapter: [23, 22, 21, 32, 33, 24],
  },
  {
    name: "Филиппийцам",
    abbreviation: "Флп.",
    versesByChapter: [30, 30, 21, 23],
  },
  {
    name: "Колоссянам",
    abbreviation: "Кол.",
    versesByChapter: [29, 23, 25, 18],
  },
  {
    name: "1-е Фессалоникийцам",
    abbreviation: "1Фес.",
    versesByChapter: [10, 20, 13, 18, 28],
  },
  {
    name: "2-е Фессалоникийцам",
    abbreviation: "2Фес.",
    versesByChapter: [12, 17, 18],
  },
  {
    name: "1-е Тимофею",
    abbreviation: "1Тим.",
    versesByChapter: [20, 15, 16, 16, 25, 21],
  },
  {
    name: "2-е Тимофею",
    abbreviation: "2Тим.",
    versesByChapter: [18, 26, 17, 22],
  },
  {
    name: "Титу",
    abbreviation: "Тит.",
    versesByChapter: [16, 15, 15],
  },
  {
    name: "Филимону",
    abbreviation: "Флм.",
    versesByChapter: [25],
  },
  {
    name: "Евреям",
    abbreviation: "Евр.",
    versesByChapter: [14, 18, 19, 16, 14, 20, 28, 13, 28, 39, 40, 29, 25],
  },
  {
    name: "Откровение",
    abbreviation: "Откр.",
    versesByChapter: [
      20, 29, 22, 11, 14, 17, 17, 13, 21, 11, 19, 17, 18, 20, 8, 21, 18,
      24, 21, 15, 27, 21,
    ],
  },
];

// Ветхий Завет (39 книг, 929 глав, 23,145 стихов)
export const OLD_TESTAMENT: BibleBook[] = [
  {
    name: "Бытие",
    abbreviation: "Быт.",
    versesByChapter: [
      31, 25, 24, 26, 32, 22, 24, 22, 29, 32, 32, 20, 18, 24, 21, 16, 27,
      33, 38, 18, 34, 24, 20, 67, 34, 35, 46, 22, 35, 43, 55, 32, 20, 31,
      29, 43, 36, 30, 23, 23, 57, 38, 34, 34, 28, 34, 31, 22, 33, 26,
    ],
  },
  {
    name: "Исход",
    abbreviation: "Исх.",
    versesByChapter: [
      22, 25, 22, 31, 23, 30, 25, 32, 35, 29, 10, 51, 22, 31, 27, 36, 16,
      27, 25, 26, 36, 31, 33, 18, 40, 37, 21, 43, 46, 38, 18, 35, 23, 35,
      35, 38, 29, 31, 43, 38,
    ],
  },
  {
    name: "Левит",
    abbreviation: "Лев.",
    versesByChapter: [
      17, 16, 17, 35, 19, 30, 38, 36, 24, 20, 47, 8, 59, 57, 33, 34, 16,
      30, 37, 27, 24, 33, 44, 23, 55, 46, 34,
    ],
  },
  {
    name: "Числа",
    abbreviation: "Чис.",
    versesByChapter: [
      54, 34, 51, 49, 31, 27, 89, 26, 23, 36, 35, 16, 33, 45, 41, 50, 13,
      32, 22, 29, 35, 41, 30, 25, 18, 65, 23, 31, 40, 16, 54, 42, 56, 29,
      34, 13,
    ],
  },
  {
    name: "Второзаконие",
    abbreviation: "Втор.",
    versesByChapter: [
      46, 37, 29, 49, 33, 25, 26, 20, 29, 22, 32, 32, 18, 29, 23, 22, 20,
      22, 21, 20, 23, 30, 25, 22, 19, 19, 26, 68, 29, 20, 30, 52, 29, 12,
    ],
  },
  {
    name: "Иисус Навин",
    abbreviation: "Нав.",
    versesByChapter: [
      18, 24, 17, 24, 15, 27, 26, 35, 27, 43, 23, 24, 33, 15, 63, 10, 18,
      28, 51, 9, 45, 34, 16, 33,
    ],
  },
  {
    name: "Судьи",
    abbreviation: "Суд.",
    versesByChapter: [
      36, 23, 31, 24, 31, 40, 25, 35, 57, 18, 40, 15, 25, 20, 20, 31, 13,
      31, 30, 48, 25,
    ],
  },
  {
    name: "Руфь",
    abbreviation: "Руфь",
    versesByChapter: [22, 23, 18, 22],
  },
  {
    name: "1-я Царств",
    abbreviation: "1Цар.",
    versesByChapter: [
      28, 36, 21, 22, 12, 21, 17, 22, 27, 27, 15, 25, 23, 52, 35, 23, 58,
      30, 24, 42, 15, 23, 29, 22, 44, 25, 12, 25, 11, 31, 13,
    ],
  },
  {
    name: "2-я Царств",
    abbreviation: "2Цар.",
    versesByChapter: [
      27, 32, 39, 12, 25, 23, 29, 18, 13, 19, 27, 31, 39, 33, 37, 23, 29,
      33, 43, 26, 22, 51, 39, 25,
    ],
  },
  {
    name: "3-я Царств",
    abbreviation: "3Цар.",
    versesByChapter: [
      53, 46, 28, 34, 18, 38, 51, 66, 28, 29, 43, 33, 34, 31, 34, 34, 24,
      46, 21, 43, 29, 53,
    ],
  },
  {
    name: "4-я Царств",
    abbreviation: "4Цар.",
    versesByChapter: [
      18, 25, 27, 44, 27, 33, 20, 29, 37, 36, 21, 21, 25, 29, 38, 20, 41,
      37, 37, 21, 26, 20, 37, 20, 30,
    ],
  },
  {
    name: "1-я Паралипоменон",
    abbreviation: "1Пар.",
    versesByChapter: [
      54, 55, 24, 43, 26, 81, 40, 40, 44, 14, 47, 40, 14, 17, 29, 43, 27,
      17, 19, 8, 30, 19, 32, 31, 31, 32, 34, 21, 30,
    ],
  },
  {
    name: "2-я Паралипоменон",
    abbreviation: "2Пар.",
    versesByChapter: [
      17, 18, 17, 22, 14, 42, 22, 18, 31, 19, 23, 16, 22, 15, 19, 14, 19,
      34, 11, 37, 20, 12, 21, 27, 28, 23, 9, 27, 36, 27, 21, 33, 25, 33,
      27, 23,
    ],
  },
  {
    name: "Ездра",
    abbreviation: "Езд.",
    versesByChapter: [11, 70, 13, 24, 17, 22, 28, 36, 15, 44],
  },
  {
    name: "Неемия",
    abbreviation: "Неем.",
    versesByChapter: [11, 20, 32, 23, 19, 19, 73, 18, 38, 39, 36, 47, 31],
  },
  {
    name: "Есфирь",
    abbreviation: "Есф.",
    versesByChapter: [22, 23, 15, 17, 14, 14, 10, 17, 32, 3],
  },
  {
    name: "Иов",
    abbreviation: "Иов",
    versesByChapter: [
      22, 13, 26, 21, 27, 30, 21, 22, 35, 22, 20, 25, 28, 22, 35, 22, 16,
      21, 29, 29, 34, 30, 17, 25, 6, 14, 23, 28, 25, 31, 40, 22, 33, 37,
      16, 33, 24, 41, 30, 24, 34, 17,
    ],
  },
  {
    name: "Псалтирь",
    abbreviation: "Пс.",
    versesByChapter: [
      6, 12, 8, 8, 12, 10, 17, 9, 20, 18, 7, 8, 6, 7, 5, 11, 15, 50, 14, 9,
      13, 31, 6, 10, 22, 12, 14, 9, 11, 12, 24, 11, 22, 22, 28, 12, 40, 22,
      13, 17, 13, 11, 5, 26, 17, 11, 9, 14, 20, 23, 19, 9, 6, 7, 23, 13,
      11, 11, 17, 12, 8, 12, 11, 10, 13, 20, 7, 35, 36, 5, 24, 20, 28, 23,
      10, 12, 20, 72, 13, 19, 16, 8, 18, 12, 13, 17, 7, 18, 52, 17, 16, 15,
      5, 23, 11, 13, 12, 9, 9, 5, 8, 28, 22, 35, 45, 48, 43, 13, 31, 7, 10,
      10, 9, 8, 18, 19, 2, 29, 176, 7, 8, 9, 4, 8, 5, 6, 5, 6, 8, 8, 3, 18,
      3, 3, 21, 26, 9, 8, 24, 13, 10, 7, 12, 15, 21, 10, 20, 14, 9, 6,
    ],
  },
  {
    name: "Притчи",
    abbreviation: "Притч.",
    versesByChapter: [
      33, 22, 35, 27, 23, 35, 27, 36, 18, 32, 31, 28, 25, 35, 33, 33, 28,
      24, 29, 30, 31, 29, 35, 34, 28, 28, 27, 28, 27, 33, 31,
    ],
  },
  {
    name: "Екклесиаст",
    abbreviation: "Еккл.",
    versesByChapter: [18, 26, 22, 16, 20, 12, 29, 17, 18, 20, 10, 14],
  },
  {
    name: "Песнь Песней",
    abbreviation: "Песн.",
    versesByChapter: [17, 17, 11, 16, 16, 13, 13, 14],
  },
  {
    name: "Исаия",
    abbreviation: "Ис.",
    versesByChapter: [
      31, 22, 26, 6, 30, 13, 25, 22, 21, 34, 16, 6, 22, 32, 9, 14, 14, 7,
      25, 6, 17, 25, 18, 23, 12, 21, 13, 29, 24, 33, 9, 20, 24, 17, 10, 22,
      38, 22, 8, 31, 29, 25, 28, 28, 25, 13, 15, 22, 26, 11, 23, 15, 12,
      17, 13, 12, 21, 14, 21, 22, 11, 12, 19, 12, 25, 24,
    ],
  },
  {
    name: "Иеремия",
    abbreviation: "Иер.",
    versesByChapter: [
      19, 37, 25, 31, 31, 30, 34, 22, 26, 25, 23, 17, 27, 22, 21, 21, 27,
      23, 15, 18, 14, 30, 40, 10, 38, 24, 22, 17, 32, 24, 40, 44, 26, 22,
      19, 32, 21, 28, 18, 16, 18, 22, 13, 30, 5, 28, 7, 47, 39, 46, 64, 34,
    ],
  },
  {
    name: "Плач Иеремии",
    abbreviation: "Плач",
    versesByChapter: [22, 22, 66, 22, 22],
  },
  {
    name: "Иезекииль",
    abbreviation: "Иез.",
    versesByChapter: [
      28, 10, 27, 17, 17, 14, 27, 18, 11, 22, 25, 28, 23, 23, 8, 63, 24,
      32, 14, 49, 32, 31, 49, 27, 17, 21, 36, 26, 21, 26, 18, 32, 33, 31,
      15, 38, 28, 23, 29, 49, 26, 20, 27, 31, 25, 24, 23, 35,
    ],
  },
  {
    name: "Даниил",
    abbreviation: "Дан.",
    versesByChapter: [21, 49, 30, 37, 31, 28, 28, 27, 27, 21, 45, 13],
  },
  {
    name: "Осия",
    abbreviation: "Ос.",
    versesByChapter: [
      11, 23, 5, 19, 15, 11, 16, 14, 17, 15, 12, 14, 16, 9,
    ],
  },
  {
    name: "Иоиль",
    abbreviation: "Иоиль",
    versesByChapter: [20, 32, 21],
  },
  {
    name: "Амос",
    abbreviation: "Ам.",
    versesByChapter: [15, 16, 15, 13, 27, 14, 17, 14, 15],
  },
  {
    name: "Авдий",
    abbreviation: "Авд.",
    versesByChapter: [21],
  },
  {
    name: "Иона",
    abbreviation: "Иона",
    versesByChapter: [17, 10, 10, 11],
  },
  {
    name: "Михей",
    abbreviation: "Мих.",
    versesByChapter: [16, 13, 12, 13, 15, 16, 20],
  },
  {
    name: "Наум",
    abbreviation: "Наум",
    versesByChapter: [15, 13, 19],
  },
  {
    name: "Аввакум",
    abbreviation: "Авв.",
    versesByChapter: [17, 20, 19],
  },
  {
    name: "Софония",
    abbreviation: "Соф.",
    versesByChapter: [18, 15, 20],
  },
  {
    name: "Аггей",
    abbreviation: "Агг.",
    versesByChapter: [15, 23],
  },
  {
    name: "Захария",
    abbreviation: "Зах.",
    versesByChapter: [
      21, 13, 10, 14, 11, 15, 14, 23, 17, 12, 17, 14, 9, 21,
    ],
  },
  {
    name: "Малахия",
    abbreviation: "Мал.",
    versesByChapter: [14, 17, 18, 6],
  },
];

/**
 * Adaptive reading plan generator that respects chapter boundaries
 *
 * Strategy:
 * 1. Try to fit whole chapters into targetDays
 * 2. If not enough chapters, split the largest ones progressively
 * 3. Start with splitting largest in half (2), then thirds (3), etc.
 * 4. Distribute segments evenly across days
 */
export function generateReadingPlan(
  testament: Testament,
  startDate: Date,
  targetDays: number = 365
): ReadingDay[] {
  const books = testament === "new" ? NEW_TESTAMENT : OLD_TESTAMENT;

  // Collect all chapters with their verse counts
  interface ChapterInfo {
    book: BibleBook;
    chapterNum: number;
    verseCount: number;
  }

  const chapters: ChapterInfo[] = [];
  for (const book of books) {
    for (let ch = 0; ch < book.versesByChapter.length; ch++) {
      chapters.push({
        book,
        chapterNum: ch + 1,
        verseCount: book.versesByChapter[ch],
      });
    }
  }

  // Find optimal split configuration to match targetDays
  let segments: ReadingSegment[] = [];

  // If we have fewer chapters than target days, we need to split
  if (chapters.length < targetDays) {
    segments = createSegmentsWithSplitting(chapters, targetDays);
  } else {
    // If we have more chapters than days, group them
    segments = createSegments(chapters, 1);
  }

  // Distribute segments across days
  return distributeSegmentsByDays(segments, startDate, targetDays);
}

/**
 * Create segments by progressively splitting the largest chapters
 * until we have enough segments to match targetDays
 */
function createSegmentsWithSplitting(
  chapters: Array<{
    book: BibleBook;
    chapterNum: number;
    verseCount: number;
  }>,
  targetDays: number
): ReadingSegment[] {
  // Start with all chapters as whole segments
  interface SplittableSegment {
    book: BibleBook;
    chapterNum: number;
    verseStart: number;
    verseEnd: number;
    verseCount: number;
  }

  const segments: SplittableSegment[] = chapters.map((ch) => ({
    book: ch.book,
    chapterNum: ch.chapterNum,
    verseStart: 1,
    verseEnd: ch.verseCount,
    verseCount: ch.verseCount,
  }));

  // Keep splitting the largest segment until we have enough
  while (segments.length < targetDays) {
    // Find the largest segment
    let largestIdx = 0;
    let largestVerseCount = segments[0].verseCount;

    for (let i = 1; i < segments.length; i++) {
      if (segments[i].verseCount > largestVerseCount) {
        largestVerseCount = segments[i].verseCount;
        largestIdx = i;
      }
    }

    const largest = segments[largestIdx];

    // If the largest segment is only 1 verse, we can't split further
    if (largest.verseCount <= 1) {
      break;
    }

    // Split the largest segment in half
    const midPoint = Math.floor(largest.verseCount / 2);
    const firstHalf: SplittableSegment = {
      book: largest.book,
      chapterNum: largest.chapterNum,
      verseStart: largest.verseStart,
      verseEnd: largest.verseStart + midPoint - 1,
      verseCount: midPoint,
    };
    const secondHalf: SplittableSegment = {
      book: largest.book,
      chapterNum: largest.chapterNum,
      verseStart: largest.verseStart + midPoint,
      verseEnd: largest.verseEnd,
      verseCount: largest.verseCount - midPoint,
    };

    // Replace the largest with its two halves
    segments.splice(largestIdx, 1, firstHalf, secondHalf);
  }

  // Convert to ReadingSegment format
  return segments.map((seg) => ({
    book: seg.book,
    chapter: seg.chapterNum,
    verseStart: seg.verseStart,
    verseEnd: seg.verseEnd,
  }));
}

/**
 * Create reading segments from chapters with given maximum split level
 * Splits largest chapters first when needed
 */
function createSegments(
  chapters: Array<{
    book: BibleBook;
    chapterNum: number;
    verseCount: number;
  }>,
  maxSplits: number
): ReadingSegment[] {
  const segments: ReadingSegment[] = [];

  // Calculate average verses per chapter to determine split threshold
  const avgVerses =
    chapters.reduce((sum, ch) => sum + ch.verseCount, 0) / chapters.length;
  const splitThreshold = avgVerses * 1.3; // Split chapters that are 1.3x average or more

  for (const chapter of chapters) {
    // Decide how many parts to split this chapter into
    let splits = 1;

    if (maxSplits > 1 && chapter.verseCount >= splitThreshold) {
      // Larger chapters get split more
      splits = Math.min(
        maxSplits,
        Math.ceil(chapter.verseCount / avgVerses)
      );
    }

    if (splits === 1) {
      // Whole chapter
      segments.push({
        book: chapter.book,
        chapter: chapter.chapterNum,
        verseStart: undefined,
        verseEnd: undefined,
      });
    } else {
      // Split chapter into parts
      const versesPerPart = Math.ceil(chapter.verseCount / splits);

      for (let part = 0; part < splits; part++) {
        const start = part * versesPerPart + 1;
        const end = Math.min(
          (part + 1) * versesPerPart,
          chapter.verseCount
        );

        // Only add if this part has verses
        if (start <= chapter.verseCount) {
          segments.push({
            book: chapter.book,
            chapter: chapter.chapterNum,
            verseStart: start,
            verseEnd: end,
          });
        }
      }
    }
  }

  return segments;
}

/**
 * Distribute segments evenly across target days
 */
function distributeSegmentsByDays(
  segments: ReadingSegment[],
  startDate: Date,
  targetDays: number
): ReadingDay[] {
  const plan: ReadingDay[] = [];
  const currentDate = new Date(startDate);

  // Calculate how many segments per day (can be fractional)
  const segmentsPerDay = segments.length / targetDays;
  let segmentIndex = 0;

  for (let day = 0; day < targetDays; day++) {
    // Calculate target segment index for end of this day
    const targetSegmentIndex = Math.min(
      Math.round((day + 1) * segmentsPerDay),
      segments.length
    );

    const dayReadings: string[] = [];

    while (segmentIndex < targetSegmentIndex) {
      const seg = segments[segmentIndex];

      if (seg.verseStart === undefined || seg.verseEnd === undefined) {
        // Whole chapter
        dayReadings.push(`${seg.book.abbreviation}${seg.chapter}`);
      } else {
        // Partial chapter
        dayReadings.push(
          `${seg.book.abbreviation}${seg.chapter}:${seg.verseStart}–${seg.verseEnd}`
        );
      }

      segmentIndex++;
    }

    if (dayReadings.length > 0) {
      plan.push({
        date: new Date(currentDate),
        readings: dayReadings,
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return plan;
}

/**
 * Generate reading plan from a fixed plan
 */
export function generateFixedReadingPlan(
  fixedPlan: FixedPlan,
  startDate: Date
): ReadingDay[] {
  const plan: ReadingDay[] = [];
  const currentDate = new Date(startDate);

  for (let i = 0; i < fixedPlan.readings.length; i++) {
    plan.push({
      date: new Date(currentDate),
      readings: [fixedPlan.readings[i]],
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return plan;
}

/**
 * Format a reading day for display
 */
export function formatReadingDay(
  day: ReadingDay,
  dayNumber: number,
  locale: Locale
): string {
  const dayOfWeek = format(day.date, "EEEEEE", { locale });
  const dayOfMonth = day.date.getDate();
  const month = format(day.date, "LLLL", { locale });
  const readings = day.readings.join("; ");

  return `${dayOfWeek}, ${dayOfMonth} ${month} — ${readings}`;
}

/**
 * Format reading plan as continuous line for PDF display
 */
export function formatReadingPlanContinuous(
  readingPlan: ReadingDay[],
  locale: Locale
): string {
  return readingPlan
    .map((day) => {
      const dayOfWeek = format(day.date, "EEEEEE", { locale });
      const dayOfMonth = day.date.getDate();
      const month = format(day.date, "LLLL", { locale });
      const readings = day.readings.join("; ");
      return `${dayOfWeek}, ${dayOfMonth} ${month} — ${readings}`;
    })
    .join("; ");
}
