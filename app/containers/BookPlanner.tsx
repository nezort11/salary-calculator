"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMemo, useState } from "react";

const round = (num: number) =>
  Math.round((num + Number.EPSILON) * 100) / 100;

export const BookPlanner = () => {
  const [startPage, setStartPage] = useState<number | undefined>();
  const [endPage, setEndPage] = useState<number | undefined>();
  const [pagesPerDayCount, setPagesPerDayCount] = useState<
    number | undefined
  >();

  const pagesReadCount =
    startPage && endPage && endPage > startPage && endPage - startPage + 1;
  const pagesReadCountDays =
    pagesReadCount &&
    pagesPerDayCount &&
    pagesReadCount / pagesPerDayCount;
  const pagesReadCountWeeks = pagesReadCountDays && pagesReadCountDays / 7;
  const pagesReadCountMonths =
    pagesReadCountDays && pagesReadCountDays / 30;

  const resultPlan = useMemo(() => {
    if (startPage && endPage && pagesPerDayCount) {
      const days = [];
      let currentDayIndex = 1;
      const currentDate = new Date();
      for (
        let currentStartPage = startPage;
        currentStartPage < endPage;
        currentStartPage += pagesPerDayCount
      ) {
        const currentEndPage = currentStartPage + pagesPerDayCount - 1;
        const currentDateDay = currentDate.getDate();
        const currentMonthNameLocalized = currentDate.toLocaleDateString(
          "ru-RU",
          {
            month: "short",
          }
        );
        days.push(
          `${currentDateDay} ${currentMonthNameLocalized} (день ${currentDayIndex}) — стр. ${currentStartPage}-${currentEndPage}`
        );

        currentDayIndex += 1;
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return days.join("\n");
    }
  }, [startPage, endPage, pagesPerDayCount]);

  return (
    <div className="grid gap-8">
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="startPage">
          Введи с какой страницы будешь начинать читать
        </Label>
        <Input
          id="startPage"
          type="text"
          placeholder="1"
          // value={formatNumber(usdPerYear)}
          // onChange={createAmountOnChangeHandler("USD", "year")}
          onChange={(e) => setStartPage(+e.target.value)}
        />
      </div>
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="endPage">
          Введи до какой страницы будешь читать
        </Label>
        <Input
          id="endPage"
          prefix="$"
          type="text"
          placeholder="224"
          onChange={(e) => setEndPage(+e.target.value)}
        />
      </div>
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="pageCount">
          Введи по сколько страниц в день будешь читать
        </Label>
        <Input
          id="pageCount"
          type="text"
          placeholder="4"
          onChange={(e) => setPagesPerDayCount(+e.target.value)}
        />
      </div>

      {pagesReadCountDays &&
        pagesReadCountWeeks &&
        pagesReadCountMonths && (
          <div>
            <h1 className="text-center text-1xl font-semibold tracking-tight mb-2">
              План чтения
            </h1>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <Label htmlFor="pageCount">Дней</Label>
                <Input readOnly value={round(pagesReadCountDays)} />
              </div>
              <div>
                <Label htmlFor="pageCount">Недель</Label>
                <Input readOnly value={round(pagesReadCountWeeks)} />
              </div>
              <div>
                <Label htmlFor="pageCount">Месяцев</Label>
                <Input readOnly value={round(pagesReadCountMonths)} />
              </div>
            </div>
            <Textarea
              id="readPlan"
              readOnly
              value={resultPlan}
              rows={20}
            />
          </div>
        )}
    </div>
  );
};
