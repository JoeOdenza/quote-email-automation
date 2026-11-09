"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import { MAX_NIGHTS, formatStayDates, fromIsoDate, nightsBetween, toIsoDate } from "@/libs/stay";
import { inputClass } from "./form";

// App colours and a compact size for the calendar.
const CALENDAR_THEME = {
    "--rdp-accent-color": "#0045a5",
    "--rdp-accent-background-color": "#e8eef8",
    "--rdp-today-color": "#0045a5",
    "--rdp-day-height": "36px",
    "--rdp-day-width": "36px",
    "--rdp-day_button-height": "34px",
    "--rdp-day_button-width": "34px",
} as CSSProperties;

type Props = {
    // Field names become `${name}.nights`, `${name}.checkIn`, `${name}.checkOut`.
    name: string;
    defaultNights?: string;
    defaultCheckIn?: string;
    defaultCheckOut?: string;
    nightsPlaceholder?: string;
};

// Nights plus a single "Trip dates" field that opens a range calendar: click
// the check-in day, then the check-out day. Picking dates fills in the nights,
// which can still be changed by hand.
export function StayFields({ name, defaultNights, defaultCheckIn, defaultCheckOut, nightsPlaceholder }: Props) {
    const [range, setRange] = useState<DateRange | undefined>(() => {
        const from = fromIsoDate(defaultCheckIn);
        return from ? { from, to: fromIsoDate(defaultCheckOut) } : undefined;
    });
    const [nights, setNights] = useState(defaultNights ?? "");
    const [open, setOpen] = useState(false);
    const root = useRef<HTMLDivElement>(null);
    const ids = { nights: useId(), dates: useId(), calendar: useId() };

    // Close the calendar on a click outside it, or on Escape.
    useEffect(() => {
        if (!open) return;
        const onPointer = (event: PointerEvent) => {
            if (!root.current?.contains(event.target as Node)) setOpen(false);
        };
        const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
        document.addEventListener("pointerdown", onPointer);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("pointerdown", onPointer);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    const checkIn = range?.from && toIsoDate(range.from);
    const checkOut = range?.to && toIsoDate(range.to);
    const complete = checkIn && checkOut && checkOut > checkIn;
    const datesNights = complete ? nightsBetween(checkIn, checkOut) : null;

    function onSelect(next: DateRange | undefined) {
        setRange(next);
        if (next?.from && next.to && next.to > next.from) {
            setNights(String(nightsBetween(toIsoDate(next.from), toIsoDate(next.to))));
            setOpen(false);
        }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
        <div className="grid grid-cols-[5.5rem_1fr] gap-3">
            <div className="flex flex-col gap-1.5">
                <label htmlFor={ids.nights} className="text-sm font-medium text-zinc-700">
                    Nights
                </label>
                <input
                    id={ids.nights}
                    name={`${name}.nights`}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={MAX_NIGHTS}
                    step={1}
                    required
                    placeholder={nightsPlaceholder}
                    value={nights}
                    onChange={(e) => setNights(e.target.value)}
                    className={inputClass}
                />
            </div>

            <div ref={root} className="relative flex flex-col gap-1.5">
                <span id={ids.dates} className="text-sm font-medium text-zinc-700">
                    Trip dates
                </span>
                <button
                    type="button"
                    aria-labelledby={ids.dates}
                    aria-haspopup="dialog"
                    aria-expanded={open}
                    aria-controls={ids.calendar}
                    onClick={() => setOpen((o) => !o)}
                    className={`${inputClass} flex items-center justify-between gap-2 text-left`}
                >
                    <span className={complete ? "text-zinc-900" : "text-zinc-400"}>
                        {complete
                            ? formatStayDates(checkIn, checkOut)
                            : checkIn
                              ? "Now pick check-out"
                              : "Check-in → check-out"}
                    </span>
                    <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4 shrink-0 fill-zinc-400">
                        <path d="M6 2a1 1 0 0 1 1 1v1h6V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1Zm10 7H4v7h12V9Z" />
                    </svg>
                </button>
                <input type="hidden" name={`${name}.checkIn`} value={complete ? checkIn : ""} />
                <input type="hidden" name={`${name}.checkOut`} value={complete ? checkOut : ""} />

                {complete && datesNights !== Number(nights) && nights !== "" && (
                    <span className="text-xs text-amber-700">
                        These dates are {datesNights} {datesNights === 1 ? "night" : "nights"}.
                    </span>
                )}

                {open && (
                    <div
                        id={ids.calendar}
                        role="dialog"
                        aria-label="Choose trip dates"
                        className="absolute right-0 top-full z-20 mt-1 rounded-lg border border-zinc-200 bg-white p-2 shadow-lg"
                    >
                        <DayPicker
                            // The calendar's stylesheet sets these on its own root, so
                            // they're overridden there rather than on the wrapper.
                            style={CALENDAR_THEME}
                            mode="range"
                            selected={range}
                            onSelect={onSelect}
                            defaultMonth={range?.from ?? today}
                            disabled={{ before: today }}
                            excludeDisabled
                            autoFocus
                        />
                        <div className="flex items-center justify-between gap-3 border-t border-zinc-100 px-2 pt-2 text-xs">
                            <span className="text-zinc-500">
                                {checkIn && !complete ? "Pick the check-out day" : "Pick the check-in day, then check-out"}
                            </span>
                            {range && (
                                <button
                                    type="button"
                                    onClick={() => setRange(undefined)}
                                    className="font-medium text-[#0045a5] hover:underline"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
