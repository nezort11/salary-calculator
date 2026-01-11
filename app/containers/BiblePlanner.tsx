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
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import {
  generateReadingPlan,
  generateFixedReadingPlan,
  formatReadingDay,
  formatReadingPlanContinuous,
  Testament,
  ReadingDay,
  PRESET_PLANS,
  FIXED_PLANS,
} from "@/lib/bible-data";
import { ru as ruLocale } from "date-fns/locale";

// Helper function to check if a year is a leap year
const isLeapYear = (year: number): boolean => {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};

// Get default days count based on current year
const getDefaultDaysCount = (): number => {
  const currentYear = new Date().getFullYear();
  return isLeapYear(currentYear) ? 366 : 365;
};

export const BiblePlanner = () => {
  const { toast } = useToast();
  const pdfRef = useRef<HTMLDivElement | null>(null);
  const [mode, setMode] = useState<"flexible" | "preset">("preset");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(
    PRESET_PLANS[0]?.id || FIXED_PLANS[0]?.id || null
  );
  const [testament, setTestament] = useState<Testament>("new");
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [isGenerating, setIsGenerating] = useState(false);
  const [daysCount, setDaysCount] = useState<number>(
    getDefaultDaysCount()
  );

  // Combined plans array
  const allPlans = useMemo(() => [...PRESET_PLANS, ...FIXED_PLANS], []);

  // Get the selected plan (can be either PresetPlan or FixedPlan)
  const selectedPlan = useMemo(() => {
    if (mode !== "preset" || !selectedPlanId) return null;
    return allPlans.find((p) => p.id === selectedPlanId) || null;
  }, [mode, selectedPlanId, allPlans]);

  // Determine parameters based on mode
  const effectiveTestament =
    mode === "preset" && selectedPlan ? selectedPlan.testament : testament;

  const effectiveDaysCount =
    mode === "preset" && selectedPlan && "days" in selectedPlan
      ? selectedPlan.days
      : daysCount;

  // Generate reading plan
  const readingPlan = useMemo<ReadingDay[] | null>(() => {
    if (!startDate) return null;

    if (mode === "preset" && selectedPlan) {
      // Check if it's a fixed plan
      if ("readings" in selectedPlan) {
        return generateFixedReadingPlan(selectedPlan, startDate);
      } else {
        // It's a preset plan
        return generateReadingPlan(
          effectiveTestament,
          startDate,
          effectiveDaysCount
        );
      }
    } else {
      return generateReadingPlan(
        effectiveTestament,
        startDate,
        effectiveDaysCount
      );
    }
  }, [
    mode,
    selectedPlan,
    effectiveTestament,
    startDate,
    effectiveDaysCount,
  ]);

  // Format plan as text
  const resultPlan = useMemo(() => {
    if (!readingPlan) return "";
    return readingPlan
      .map((day, index) => formatReadingDay(day, index + 1, ruLocale))
      .join("\n");
  }, [readingPlan]);

  const planLines = useMemo(() => {
    return resultPlan ? resultPlan.split("\n").filter(Boolean) : [];
  }, [resultPlan]);

  const actualDaysCount = readingPlan?.length || 0;

  const handleCopyPlan = useCallback(() => {
    const success = copy(resultPlan!);
    if (success) {
      toast({
        title: "План чтения скопирован",
      });
    }
  }, [resultPlan, toast]);

  const testamentName =
    effectiveTestament === "new" ? "Новый Завет" : "Ветхий Завет";
  const planTitle =
    mode === "preset" && selectedPlan
      ? selectedPlan.name
      : `${testamentName}`;

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

      const createPdfPage = async (
        pdf: jsPDF,
        templateNode: HTMLElement,
        pageText: string,
        planTitle: string,
        startDate: Date | undefined,
        actualDaysCount: number,
        pageNumber: number,
        totalPages: number
      ) => {
        // Temporarily update the template node with page-specific content
        const originalContent = templateNode.innerHTML;

        // Adjust spacing for single-page layout (New Testament year plan)
        const isSinglePage = totalPages === 1;
        const titleMarginBottom = isSinglePage ? "2px" : "8px";
        const infoMarginBottom = isSinglePage ? "6px" : "12px";
        const containerPadding = isSinglePage ? "15px" : `${MARGIN_PX}px`;

        templateNode.innerHTML = `
          <div style="
            display: flex;
            flex-direction: column;
            height: 100%;
            width: 100%;
            box-sizing: border-box;
            padding: ${containerPadding};
          ">
            <div style="
              text-align: center;
              font-weight: 700;
              margin-bottom: ${titleMarginBottom};
            ">
              План чтения: ${planTitle}
            </div>
            <div style="
              font-size: 0.9em;
              text-align: center;
              margin-bottom: ${infoMarginBottom};
              opacity: 0.8;
            ">
              Начало: ${
                startDate ? format(startDate, "PPP", { locale: ru }) : "-"
              } • Дней: ${actualDaysCount}${
          totalPages > 1 ? ` • Страница ${pageNumber}/${totalPages}` : ""
        }
            </div>
            <div style="
              width: 100%;
              box-sizing: border-box;
              text-align: justify;
              hyphens: auto;
              word-break: break-word;
              ${isSinglePage ? "margin-bottom: 8px;" : "flex: 1;"}
            ">
              ${pageText}
            </div>
            ${
              isSinglePage
                ? `
            <div style="
              text-align: right;
              font-size: 0.75em;
              opacity: 0.6;
              margin-top: auto;
            ">
              Создано в <a href="https://t.me/calcsalarybot">@calcsalarybot</a>
            </div>
            `
                : `
            <div style="
              margin-top: auto;
              text-align: right;
              font-size: 0.75em;
              opacity: 0.6;
            ">
              Создано в <a href="https://t.me/calcsalarybot">@calcsalarybot</a>
            </div>
            `
            }
          </div>
        `;

        // Render at 2x scale for sharper PDF
        const canvas = await html2canvas(templateNode, {
          scale: 2,
          backgroundColor: "#ffffff",
          useCORS: true,
        });
        const imgData = canvas.toDataURL("image/png");

        pdf.addImage(
          imgData,
          "PNG",
          0,
          0,
          A4_WIDTH_MM,
          A4_HEIGHT_MM,
          undefined,
          "FAST"
        );

        // Restore original content
        templateNode.innerHTML = originalContent;
      };

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

      // Generate continuous plan text
      const continuousPlanText = readingPlan
        ? formatReadingPlanContinuous(readingPlan, ru)
        : "";

      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
      });

      // Check if this is the "Новый Завет за год (фиксированный план)" - it should be displayed on a single page
      const isNewTestamentYearPlan =
        selectedPlanId === "new-testament-fixed-year";

      if (isNewTestamentYearPlan) {
        // Single page for the full year plan
        await createPdfPage(
          pdf,
          node,
          continuousPlanText,
          planTitle,
          startDate,
          actualDaysCount,
          1,
          1
        );
      } else {
        // Split text into two pages (approximately equal parts) for other plans
        const totalLength = continuousPlanText.length;
        const midPoint = Math.floor(totalLength / 2);

        // Find a good breaking point (after a complete reading entry)
        let splitIndex = midPoint;
        while (
          splitIndex < totalLength &&
          continuousPlanText[splitIndex] !== ";"
        ) {
          splitIndex++;
        }
        if (splitIndex < totalLength) {
          splitIndex++; // Include the semicolon
        }

        const firstPageText = continuousPlanText
          .substring(0, splitIndex)
          .trim();
        const secondPageText = continuousPlanText
          .substring(splitIndex)
          .trim();

        // Create first page
        await createPdfPage(
          pdf,
          node,
          firstPageText,
          planTitle,
          startDate,
          actualDaysCount,
          1,
          2
        );

        // Add second page
        pdf.addPage();
        await createPdfPage(
          pdf,
          node,
          secondPageText,
          planTitle,
          startDate,
          actualDaysCount,
          2,
          2
        );
      }

      const fileName = `План чтения ${planTitle} ${
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
  }, [
    planLines,
    toast,
    startDate,
    planTitle,
    readingPlan,
    actualDaysCount,
    selectedPlanId,
  ]);

  return (
    <div className="grid gap-8">
      {/* Mode Toggle */}
      <div className="grid w-full items-center gap-1.5">
        <Label>Режим планирования</Label>
        <div className="flex gap-2">
          <Button
            variant={mode === "preset" ? "default" : "outline"}
            onClick={() => setMode("preset")}
            className="flex-1"
          >
            Готовые планы
          </Button>
          <Button
            variant={mode === "flexible" ? "default" : "outline"}
            onClick={() => setMode("flexible")}
            className="flex-1"
          >
            Гибкий план
          </Button>
        </div>
      </div>

      {/* Preset Plans Mode */}
      {mode === "preset" && (
        <div className="grid gap-4">
          <Label>Выбери план чтения</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allPlans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={cn(
                  "p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md",
                  selectedPlanId === plan.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="font-semibold text-base mb-1">
                  {plan.name}
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  {plan.description}
                </div>
                <div className="text-xs font-medium text-primary">
                  {"readings" in plan
                    ? `${plan.readings.length} ${
                        plan.readings.length === 1
                          ? "день"
                          : plan.readings.length < 5
                          ? "дня"
                          : "дней"
                      }`
                    : `${plan.days} ${
                        plan.days === 1
                          ? "день"
                          : plan.days < 5
                          ? "дня"
                          : "дней"
                      }`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Flexible Mode Controls */}
      {mode === "flexible" && (
        <>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label>Выбери завет для чтения</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="testament"
                  value="new"
                  checked={testament === "new"}
                  onChange={(e) =>
                    setTestament(e.target.value as Testament)
                  }
                  className="w-4 h-4"
                />
                <span>Новый Завет</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="testament"
                  value="old"
                  checked={testament === "old"}
                  onChange={(e) =>
                    setTestament(e.target.value as Testament)
                  }
                  className="w-4 h-4"
                />
                <span>Ветхий Завет</span>
              </label>
            </div>
          </div>

          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="daysCount">Количество дней для чтения</Label>
            <Input
              id="daysCount"
              type="number"
              min="1"
              max="999"
              value={daysCount}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value) && value > 0) {
                  setDaysCount(value);
                }
              }}
            />
          </div>
        </>
      )}

      {/* Start Date Picker (shown for both modes) */}
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label>Дата начала чтения</Label>
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
              locale={ru}
            />
          </PopoverContent>
        </Popover>
      </div>

      {readingPlan && readingPlan.length > 0 && (
        <div>
          <h1 className="text-center text-1xl font-semibold tracking-tight mb-2">
            План чтения: {planTitle}
          </h1>
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
            <span>{isGenerating ? "Готовим PDF..." : "Скачать PDF"}</span>
          </Button>
          <Textarea id="readPlan" readOnly value={resultPlan} rows={20} />
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
                  План чтения: {planTitle}
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
                  • Дней: {actualDaysCount}
                </div>
                <div
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    textAlign: "justify",
                    hyphens: "auto",
                    wordBreak: "break-word",
                  }}
                >
                  {readingPlan &&
                    formatReadingPlanContinuous(readingPlan, ru)}
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
