"use client";
import { Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCallback, useMemo, useRef, useState } from "react";
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
import { jsPDF } from "jspdf";
import { downloadFile } from "@telegram-apps/sdk";
import html2canvas from "html2canvas";

const round = (num: number, digits: number = 2) => {
  const factor = 10 ** digits;
  return Math.round(num * factor) / factor;
};

export const BookPlanner = () => {
  const { toast } = useToast();
  const pdfRef = useRef<HTMLDivElement | null>(null);
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
  const [isGenerating, setIsGenerating] = useState(false);

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
  }, [resultPlan, toast]);

  const planLines = useMemo(() => {
    return resultPlan ? resultPlan.split("\n").filter(Boolean) : [];
  }, [resultPlan]);

  const handleDownloadPdf = useCallback(async () => {
    if (!pdfRef.current || planLines.length === 0) {
      return;
    }
    try {
      setIsGenerating(true);

      // A4 portrait in CSS pixels (assuming 96 DPI)
      const MM_TO_PX = 96 / 25.4;
      const A4_WIDTH_MM = 210;
      const A4_HEIGHT_MM = 297;
      const PAGE_WIDTH_PX = Math.floor(A4_WIDTH_MM * MM_TO_PX);
      const PAGE_HEIGHT_PX = Math.floor(A4_HEIGHT_MM * MM_TO_PX);
      const MARGIN_MM = 10;
      const MARGIN_PX = Math.floor(MARGIN_MM * MM_TO_PX);

      const node = pdfRef.current;
      // Ensure base dimensions
      node.style.width = `${PAGE_WIDTH_PX}px`;
      node.style.height = `${PAGE_HEIGHT_PX}px`;
      node.style.padding = `${MARGIN_PX}px`;

      const originalFontSize = node.style.fontSize || "";
      let fontSize = 18; // start big
      const minFontSize = 9; // don't go below this

      // Iteratively shrink font until content fits within one page height
      for (let i = 0; i < 20; i++) {
        node.style.fontSize = `${fontSize}px`;
        // Wait for layout
        await new Promise((r) => requestAnimationFrame(r));
        const fits = node.scrollHeight <= node.clientHeight;
        if (fits) {
          break;
        }
        fontSize = fontSize - 1;
        if (fontSize <= minFontSize) {
          break;
        }
      }

      // Render at 2x scale for sharper PDF
      const canvas = await html2canvas(node, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
      });
      const pageWidthMm = A4_WIDTH_MM;
      const pageHeightMm = A4_HEIGHT_MM;
      pdf.addImage(
        imgData,
        "PNG",
        0,
        0,
        pageWidthMm,
        pageHeightMm,
        undefined,
        "FAST"
      );
      const fileName = `План чтения ${
        startDate ? format(startDate, "PPP", { locale: ru }) : "-"
      }.pdf`;

      // If inside Telegram Mini App, send the PDF to bot chat via server API
      let sentViaTelegram = false;
      try {
        const tg: any =
          (typeof window !== "undefined" &&
            (window as any).Telegram?.WebApp) ||
          undefined;
        const isTMA =
          !!tg?.platform ||
          /tgWebAppPlatform|tgWebAppData/.test(
            `${window.location.hash} ${window.location.search}`
          );
        if (isTMA) {
          const initData =
            tg?.initData ||
            (() => {
              const hash = window.location.hash?.startsWith("#")
                ? window.location.hash.slice(1)
                : window.location.hash || "";
              const hashParams = new URLSearchParams(hash);
              const searchParams = new URLSearchParams(
                window.location.search
              );
              const encoded =
                hashParams.get("tgWebAppData") ||
                searchParams.get("tgWebAppData");
              return encoded ? decodeURIComponent(encoded) : undefined;
            })();

          if (initData) {
            const dataUrl = pdf.output("datauristring");
            const resp = await fetch("/api/tg-send-plan", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                initData,
                fileName,
                fileDataUrl: dataUrl,
              }),
            });
            const json = await resp.json().catch(() => ({}));
            if (resp.ok && json?.ok) {
              sentViaTelegram = true;
            }
          }
        }
      } catch {
        // ignore TMA sending errors, we will fallback to browser download
      }

      if (!sentViaTelegram) {
        // Fallback to standard browser download with correct filename
        pdf.save(fileName);
      }

      // Restore font-size to avoid affecting UI elsewhere
      node.style.fontSize = originalFontSize;

      toast({ title: "PDF сохранён" });
    } catch {
      toast({ title: "Ошибка при создании PDF" });
    } finally {
      setIsGenerating(false);
    }
  }, [planLines, toast, startDate]);

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
          rows={2}
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
                  value={round(pagesReadCountDays, 0)}
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
            <Button
              type="button"
              size="sm"
              className="px-3 mb-4 ml-2"
              onClick={handleDownloadPdf}
              disabled={isGenerating}
            >
              <span>
                {isGenerating ? "Готовим PDF..." : "Скачать PDF"}
              </span>
            </Button>
            <Textarea
              id="readPlan"
              readOnly
              value={resultPlan}
              rows={20}
            />
            {/* Hidden/offscreen A4 layout for PDF rendering */}
            {planLines.length > 0 && (
              <div
                ref={pdfRef}
                aria-hidden
                style={{
                  position: "fixed",
                  left: -99999,
                  top: -99999,
                  backgroundColor: "#ffffff",
                  color: "#000000",
                  fontFamily:
                    'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, "Helvetica Neue", "Apple Color Emoji", "Segoe UI Emoji"',
                  lineHeight: 1.3,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  <div
                    style={{
                      textAlign: "center",
                      fontWeight: 700,
                      marginBottom: 8,
                    }}
                  >
                    План чтения
                  </div>
                  <div
                    style={{
                      fontSize: "0.9em",
                      textAlign: "center",
                      marginBottom: 12,
                      opacity: 0.8,
                    }}
                  >
                    Начало:{" "}
                    {startDate
                      ? format(startDate, "PPP", { locale: ru })
                      : "-"}{" "}
                    • Дней: {round(pagesReadCountDays!, 0)}
                  </div>
                  <div
                    style={{
                      columnCount: 2,
                      columnGap: 24,
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  >
                    {planLines.map((line, idx) => (
                      <div
                        key={idx}
                        style={{ breakInside: "avoid", marginBottom: 6 }}
                      >
                        {line}
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      marginTop: "auto",
                      textAlign: "right",
                      fontSize: "0.75em",
                      opacity: 0.6,
                    }}
                  >
                    Создано в{" "}
                    <a href="https://t.me/calcsalarybot">@calcsalarybot</a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
    </div>
  );
};
