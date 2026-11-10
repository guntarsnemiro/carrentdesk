"use client";

import { DateTimeRangeFields } from "@/components/booking/datetime-range-fields";
import { bookedDurationFromFields } from "@/lib/booking/dates";

type Props = {
  pickup: string;
  returnDate: string;
  pickupTime: string;
  returnTime: string;
  onPickupChange: (value: string) => void;
  onReturnChange: (value: string) => void;
  onPickupTimeChange: (value: string) => void;
  onReturnTimeChange: (value: string) => void;
  onSubmit: () => void;
  submitting?: boolean;
  submitLabel?: string;
};

export function DateRangeBar({
  pickup,
  returnDate,
  pickupTime,
  returnTime,
  onPickupChange,
  onReturnChange,
  onPickupTimeChange,
  onReturnTimeChange,
  onSubmit,
  submitting = false,
  submitLabel = "Show cars",
}: Props) {
  const duration = bookedDurationFromFields(pickup, pickupTime, returnDate, returnTime);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex w-full flex-col gap-2 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-border sm:flex-row sm:flex-wrap sm:items-center sm:gap-0 sm:p-1.5"
    >
      <DateTimeRangeFields
        pickup={pickup}
        returnDate={returnDate}
        pickupTime={pickupTime}
        returnTime={returnTime}
        onPickupChange={onPickupChange}
        onReturnChange={onReturnChange}
        onPickupTimeChange={onPickupTimeChange}
        onReturnTimeChange={onReturnTimeChange}
      />
      {duration.billedDays > 0 && (
        <p className="hidden shrink-0 items-center px-3 text-xs font-medium text-brand-800 lg:flex">
          {duration.label}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="flex h-12 shrink-0 items-center justify-center rounded-xl bg-brand-900 px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-800 disabled:opacity-60 sm:h-auto sm:px-8"
      >
        {submitLabel}
      </button>
    </form>
  );
}
