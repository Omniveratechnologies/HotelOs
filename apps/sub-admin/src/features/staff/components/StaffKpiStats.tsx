import React from "react";
import { Users, UserCheck, UtensilsCrossed, CheckCircle2 } from "lucide-react";
import type { StaffStats } from "../types.ts";

export interface StaffKpiStatsProps {
  stats: StaffStats;
}

export const StaffKpiStats: React.FC<StaffKpiStatsProps> = ({ stats }) => {
  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="border-surface-200 flex items-center gap-4 rounded-2xl border bg-white p-5 shadow-2xs">
        <div className="bg-primary-100 text-primary-700 flex h-12 w-12 items-center justify-center rounded-xl">
          <Users size={24} />
        </div>
        <div>
          <span className="text-brand-500 block text-xs font-semibold tracking-wider uppercase">
            Total Staff
          </span>
          <span className="font-display text-brand-900 text-2xl font-bold">
            {stats.total}
          </span>
        </div>
      </div>

      <div className="border-surface-200 flex items-center gap-4 rounded-2xl border bg-white p-5 shadow-2xs">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
          <UserCheck size={24} />
        </div>
        <div>
          <span className="text-brand-500 block text-xs font-semibold tracking-wider uppercase">
            Receptionists
          </span>
          <span className="font-display text-brand-900 text-2xl font-bold">
            {stats.receptionists}
          </span>
        </div>
      </div>

      <div className="border-surface-200 flex items-center gap-4 rounded-2xl border bg-white p-5 shadow-2xs">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <UtensilsCrossed size={24} />
        </div>
        <div>
          <span className="text-brand-500 block text-xs font-semibold tracking-wider uppercase">
            Kitchen Staff
          </span>
          <span className="font-display text-brand-900 text-2xl font-bold">
            {stats.kitchen}
          </span>
        </div>
      </div>

      <div className="border-surface-200 flex items-center gap-4 rounded-2xl border bg-white p-5 shadow-2xs">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
          <CheckCircle2 size={24} />
        </div>
        <div>
          <span className="text-brand-500 block text-xs font-semibold tracking-wider uppercase">
            Active Accounts
          </span>
          <span className="font-display text-brand-900 text-2xl font-bold">
            {stats.active}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StaffKpiStats;
