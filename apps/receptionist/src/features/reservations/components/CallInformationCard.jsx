import React from "react";
import { Phone, PhoneCall } from "lucide-react";
import { SectionCard, Input } from "@hotelos/ui/components";

export default function CallInformationCard({
  callerName,
  callerPhone,
  callerPhonePrefix = "+91",
  callTime,
  callNotes,
  errors = {},
  onChange,
}) {
  return (
    <SectionCard
      title="Call Information"
      subtitle="Caller details, call timestamp and reservation notes"
      icon={Phone}
    >
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 sm:col-span-6">
          <Input
            label="Caller Name *"
            name="callerName"
            placeholder="e.g. Vikram Malhotra"
            value={callerName || ""}
            onChange={(e) => onChange("callerName", e.target.value)}
            error={errors.callerName}
          />
        </div>

        <div className="col-span-12 sm:col-span-6">
          <label
            htmlFor="caller-phone-input"
            className="text-brand-900 mb-1.5 block text-sm font-semibold"
          >
            Phone Number *
          </label>
          <div className="flex gap-2">
            <div className="flex flex-1">
              <select
                aria-label="Country Code"
                value={callerPhonePrefix}
                onChange={(e) => onChange("callerPhonePrefix", e.target.value)}
                className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 h-10 w-20 rounded-lg rounded-r-none border border-r-0 border-gray-200 bg-white px-3 text-sm transition outline-none focus:ring-2"
              >
                <option value="+91">+91</option>
                <option value="+1">+1</option>
                <option value="+44">+44</option>
                <option value="+61">+61</option>
                <option value="+971">+971</option>
              </select>
              <input
                id="caller-phone-input"
                type="tel"
                placeholder="98765 43210"
                value={callerPhone || ""}
                onChange={(e) => onChange("callerPhone", e.target.value)}
                className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 h-10 flex-1 rounded-lg rounded-l-none border border-gray-200 bg-white px-3 text-sm transition outline-none focus:ring-2"
              />
            </div>
            {callerPhone && (
              <a
                href={`tel:${callerPhonePrefix}${callerPhone}`}
                className="flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-emerald-700 transition hover:bg-emerald-100"
                title="Quick dial"
              >
                <PhoneCall className="h-4 w-4" />
              </a>
            )}
          </div>
          {errors.callerPhone && (
            <p className="mt-1.5 text-xs font-medium text-rose-500">
              {errors.callerPhone}
            </p>
          )}
        </div>

        <div className="col-span-12 sm:col-span-6">
          <Input
            label="Call Timestamp"
            type="datetime-local"
            name="callTime"
            value={callTime || ""}
            onChange={(e) => onChange("callTime", e.target.value)}
          />
        </div>

        <div className="col-span-12">
          <label
            htmlFor="call-notes-textarea"
            className="text-brand-900 mb-1.5 block text-sm font-semibold"
          >
            Call Notes / Caller Inquiries
          </label>
          <textarea
            id="call-notes-textarea"
            rows={3}
            placeholder="e.g. 2 rooms for family, prefers high floor, late arrival around 10 PM"
            value={callNotes || ""}
            onChange={(e) => onChange("callNotes", e.target.value)}
            className="text-brand-900 focus:border-primary-500 focus:ring-primary-500/15 w-full rounded-lg border border-gray-200 bg-white p-3 text-sm transition outline-none placeholder:text-gray-400 focus:ring-2"
          />
        </div>
      </div>
    </SectionCard>
  );
}
