"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChangeEventHandler, useCallback, useMemo, useState } from "react";

type Amount = {
  value: number;
  formattedValue: string | undefined;
  currency: "USD" | "RUB";
  time: "year" | "month" | "hour";
};

const USD_RUB_RATE = 100;

const getCurrencyRate = (
  from: Amount["currency"],
  to: Amount["currency"]
): number => {
  if (from === to) {
    return 1;
  }
  // USD => RUB
  if (from === "USD") {
    return 1 * USD_RUB_RATE;
  }
  // RUB => USD
  return 1 / getCurrencyRate(to, from);
};

const getTimeRate = (from: Amount["time"], to: Amount["time"]): number => {
  if (from === to) {
    return 1;
  }
  if (from === "hour" && to === "month") {
    return 1 * 8 * 21;
  }
  if (from === "month" && to === "year") {
    return 1 * 12;
  }
  if (from === "hour" && to === "year") {
    return getTimeRate("hour", "month") * getTimeRate("month", "year");
  }
  return 1 / getTimeRate(to, from);
};

const convertAmount = (
  fromAmount: Amount,
  toAmount: Pick<Amount, "currency" | "time">
) => {
  return (
    fromAmount.value *
    getCurrencyRate(fromAmount.currency, toAmount.currency) *
    getTimeRate(fromAmount.time, toAmount.time)
  );
};

const formatNumber = (num: number) => {
  if (!num) {
    return undefined;
  }
  return new Intl.NumberFormat("en-US").format(Math.floor(num));
};

const parseFormattedNumber = (formattedNumber: string) => {
  const sanitizedNumber = formattedNumber.replace(/[^0-9.-]+/g, "");
  return parseFloat(sanitizedNumber);
};

export default function Home() {
  const [amount, setAmount] = useState<Amount>({
    value: 120000,
    formattedValue: formatNumber(120000),
    currency: "USD",
    time: "year",
  });

  const createAmountOnChangeHandler = useCallback(
    (
      currency: Amount["currency"],
      time: Amount["time"]
    ): ChangeEventHandler<HTMLInputElement> => {
      return (event) => {
        const value = parseFormattedNumber(event.target.value);
        console.log("value", value);
        setAmount({
          value,
          formattedValue: formatNumber(value),
          currency,
          time,
        });
      };
    },
    [setAmount]
  );

  const usdPerYear = useMemo(
    () => convertAmount(amount, { currency: "USD", time: "year" }),
    [amount]
  );

  const rubPerYear = useMemo(
    () => convertAmount(amount, { currency: "RUB", time: "year" }),
    [amount]
  );

  const usdPerMonth = useMemo(
    () => convertAmount(amount, { currency: "USD", time: "month" }),
    [amount]
  );

  const rubPerMonth = useMemo(
    () => convertAmount(amount, { currency: "RUB", time: "month" }),
    [amount]
  );

  const usdPerHour = useMemo(
    () => convertAmount(amount, { currency: "USD", time: "hour" }),
    [amount]
  );

  const rubPerHour = useMemo(
    () => convertAmount(amount, { currency: "RUB", time: "hour" }),
    [amount]
  );

  console.log("rub to locale", rubPerYear.toLocaleString("ru-RU"));

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="grid grid-cols-2 grid-rows-3 gap-8 row-start-2 items-center sm:items-start">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="email">USD/y</Label>
          <Input
            type="text"
            id="email"
            placeholder="$120k"
            value={formatNumber(usdPerYear)}
            onChange={createAmountOnChangeHandler("USD", "year")}
          />
        </div>
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="email">RUB/y</Label>
          <Input
            prefix="$"
            type="text"
            id="email"
            placeholder="12m"
            value={formatNumber(rubPerYear)}
            onChange={createAmountOnChangeHandler("RUB", "year")}
          />
        </div>
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="email">USD/m</Label>
          <Input
            type="text"
            id="email2"
            placeholder="$10k"
            value={formatNumber(usdPerMonth)}
            onChange={createAmountOnChangeHandler("USD", "month")}
          />
        </div>
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="email">RUB/m</Label>
          <Input
            type="text"
            id="email2"
            placeholder="1m"
            value={formatNumber(rubPerMonth)}
            onChange={createAmountOnChangeHandler("RUB", "month")}
          />
        </div>
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="email">USD/h</Label>
          <Input
            type="text"
            id="email2"
            placeholder="$60"
            value={formatNumber(usdPerHour)}
            onChange={createAmountOnChangeHandler("USD", "hour")}
          />
        </div>
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="email">RUB/h</Label>
          <Input
            type="text"
            id="email2"
            placeholder="6k"
            value={formatNumber(rubPerHour)}
            onChange={createAmountOnChangeHandler("RUB", "hour")}
          />
        </div>
      </main>
    </div>
  );
}
