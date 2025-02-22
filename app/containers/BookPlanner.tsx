"use client";
import { Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import copy from "copy-to-clipboard";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
// import {
//   Form,
//   FormControl,
//   FormDescription,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const round = (num: number) =>
  Math.round((num + Number.EPSILON) * 100) / 100;

export const BookPlanner = () => {
  const { toast } = useToast();
  const [startPage, setStartPage] = useState<number | undefined>();
  const [endPage, setEndPage] = useState<number | undefined>();
  const [pagesPerDayCount, setPagesPerDayCount] = useState<
    number | undefined
  >();
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [pageContent, setPageContent] = useState<string | undefined>();
  const [readingSpeed, setReadingSpeed] = useState<number | undefined>(
    120
  );

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
    if (startPage && endPage && pagesPerDayCount && startDate) {
      const days = [];
      let currentDayIndex = 1;
      const currentDate = new Date(startDate);
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
  }, [startPage, endPage, pagesPerDayCount, startDate]);

  const readTimeMinutes = useMemo(() => {
    if (pageContent && readingSpeed) {
      const pageWords = pageContent.split(" ");
      const pageReadTimeMinutes = pageWords.length / readingSpeed;
      return pageReadTimeMinutes;
    }
  }, [pageContent, readingSpeed]);

  const handleCopyPlan = useCallback(() => {
    const success = copy(resultPlan!);
    if (success) {
      toast({
        title: "План чтения скопирован",
      });
    }
  }, [resultPlan]);

  return (
    <div className="grid gap-8">
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="startPage">
          Введи с какой страницы будешь начинать читать
        </Label>
        <Input
          id="startPage"
          type="number"
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
          type="number"
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
          type="number"
          placeholder="4"
          onChange={(e) => setPagesPerDayCount(+e.target.value)}
        />
      </div>
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label>Время начала</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[240px] pl-3 text-left font-normal",
                !startDate && "text-muted-foreground"
              )}
            >
              {startDate ? (
                format(startDate, "PPP", { locale: ru })
              ) : (
                <span>Выбери дату</span>
              )}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={(newDate) => setStartDate(newDate)}
              // disabled={(date) =>
              //   date > new Date() || date < new Date("1900-01-01")
              // }
              locale={ru}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="pageContent">
          Введи текст одной из страниц книги
        </Label>
        <Textarea
          id="pageContent"
          rows={5}
          placeholder="Равным образом, сложившаяся структура организации способствует повышению качества системы обучения кадров, соответствующей насущным потребностям. Принимая во внимание показатели успешности, курс на социально-ориентированный национальный проект не оставляет шанса для глубокомысленных рассуждений. Высокий уровень вовлечения представителей целевой аудитории является четким доказательством простого факта: высокотехнологичная концепция общественного уклада создаёт необходимость включения в производственный план целого ряда внеочередных мероприятий с учётом комплекса благоприятных перспектив."
          onChange={(e) => setPageContent(e.target.value)}
        />
      </div>
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="readingSpeed">
          Введи скорость чтения в словах за минуту (средняя - 120 сл/мин,
          размеренная - 100 сл/мин)
        </Label>
        <Input
          id="readingSpeed"
          type="number"
          placeholder="120"
          defaultValue={120}
          onChange={(e) => setReadingSpeed(+e.target.value)}
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
                <Label htmlFor="readCountDays">Дней</Label>
                <Input
                  id="readCountDays"
                  readOnly
                  value={round(pagesReadCountDays)}
                />
              </div>
              <div>
                <Label htmlFor="readCountWeeks">Недель</Label>
                <Input
                  id="readCountWeeks"
                  readOnly
                  value={round(pagesReadCountWeeks)}
                />
              </div>
              <div>
                <Label htmlFor="readCountMonths">Месяцев</Label>
                <Input
                  id="readCountMonths"
                  readOnly
                  value={round(pagesReadCountMonths)}
                />
              </div>
            </div>
            {readTimeMinutes && (
              <div className="w-full mb-4">
                <Label htmlFor="pageCount">
                  Ориентировочное время чтения (мин / день)
                </Label>
                <Input
                  readOnly
                  value={Math.floor(pagesPerDayCount * readTimeMinutes)}
                />
              </div>
            )}
            <Button
              type="button"
              size="sm"
              className="px-3 mb-4"
              onClick={handleCopyPlan}
            >
              <span>Скопировать план</span>
              <Copy />
            </Button>
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
