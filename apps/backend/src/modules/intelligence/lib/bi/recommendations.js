const round = (n) => Math.round(n);

export function generateRecommendations(signals) {
  const recs = [];
  const {
    conversionRate,
    totalInHouseGuests,
    avgSpendPerDiningGuest,
    weekendOccupancy,
    weekendAdrPremiumPct,
    weekdayAdr,
    weekendRoomNights,
    eligibleForReturnCount,
    avgRepeatGuestValue,
    repeatGuestValueRatio,
    lunchOrderShare,
    dinnerOrderShare,
    avgOrderValue,
    days,
    otaBookingShare,
    otaBookings,
    avgRoomRate,
  } = signals;

  // 1. F&B upsell for in-house guests
  if (conversionRate < 65) {
    const gap = Math.max(0, 60 - conversionRate) / 100;
    recs.push({
      key: "fb_upsell_inhouse",
      title: "Increase F&B Upsell for In-House Guests",
      category: "Revenue",
      description: `Guests staying in your rooms convert to restaurant diners at ${conversionRate.toFixed(1)}%. Curated dining packages and room-service promotions can close part of this gap.`,
      priority: conversionRate < 45 ? "High" : "Medium",
      effort: "Medium",
      estMonthlyImpact: round(
        gap *
          totalInHouseGuests *
          avgSpendPerDiningGuest *
          (30 / Math.max(days, 1)),
      ),
    });
  }

  // 2. Weekend room pricing
  if (weekendOccupancy > 82 && weekendAdrPremiumPct < 15) {
    const targetPremium = 0.18;
    const extraPerNight =
      weekdayAdr * (targetPremium - weekendAdrPremiumPct / 100);
    recs.push({
      key: "weekend_pricing",
      title: "Optimize Room Pricing for Weekends",
      category: "Revenue",
      description: `Weekend occupancy is running at ${weekendOccupancy.toFixed(0)}% with only a ${weekendAdrPremiumPct.toFixed(0)}% rate premium over weekdays. Demand supports a higher weekend rate.`,
      priority: "High",
      effort: "Low",
      estMonthlyImpact: round(
        Math.max(extraPerNight, 0) *
          weekendRoomNights *
          (30 / Math.max(days, 1)),
      ),
    });
  }

  // 3. Loyalty targeting for lapsed repeat-value guests
  if (eligibleForReturnCount > 0 && repeatGuestValueRatio > 1.3) {
    recs.push({
      key: "loyalty_repeat",
      title: "Target Repeat Guests with Loyalty Offers",
      category: "Marketing",
      description: `Repeat guests are worth ${repeatGuestValueRatio.toFixed(1)}x a one-time guest. ${eligibleForReturnCount} past guests haven't returned within 6 months — a personalized offer can bring some back.`,
      priority: "Medium",
      effort: "Medium",
      estMonthlyImpact: round(
        eligibleForReturnCount *
          0.08 *
          avgRepeatGuestValue *
          (30 / Math.max(days, 1)),
      ),
    });
  }

  // 4. Lunch-hour table utilization
  if (dinnerOrderShare > 0 && lunchOrderShare < dinnerOrderShare * 0.65) {
    const gapOrders = (dinnerOrderShare - lunchOrderShare) * 0.3;
    recs.push({
      key: "lunch_utilization",
      title: "Improve Table Utilization at Lunch",
      category: "Operations",
      description: `Lunch-hour orders are well below dinner volume (${(lunchOrderShare * 100).toFixed(0)}% vs ${(dinnerOrderShare * 100).toFixed(0)}% of daily orders). Time-based lunch offers or combo meals can lift turnover.`,
      priority: "Medium",
      effort: "Medium",
      estMonthlyImpact: round(gapOrders * avgOrderValue * 30),
    });
  }

  // 5. Direct bookings vs OTA commission
  if (otaBookingShare > 38) {
    recs.push({
      key: "direct_bookings",
      title: "Boost Direct Bookings",
      category: "Revenue",
      description: `${otaBookingShare.toFixed(0)}% of bookings come through OTAs. Promoting direct booking offers reduces commission costs on a meaningful share of revenue.`,
      priority: "Low",
      effort: "Low",
      estMonthlyImpact: round(
        otaBookings * 0.15 * avgRoomRate * (30 / Math.max(days, 1)),
      ),
    });
  }

  return recs;
}

/** 0-10 composite of conversion rate, repeat rate signal and (inverse of) cancellation-style friction — a simple, transparent blend, not a black box. */
export function guestExperienceScore(signals) {
  const conv = Math.min(signals.conversionRate / 70, 1) * 4; // up to 4 pts
  const repeat = Math.min(signals.repeatGuestValueRatio / 2, 1) * 3; // up to 3 pts
  const dining = Math.min(signals.avgSpendPerDiningGuest / 2000, 1) * 3; // up to 3 pts
  return Math.max(0, Math.min(10, conv + repeat + dining));
}

export function operationalEfficiency(signals) {
  // Simple, explainable proxy: improvement in POS order throughput per staff-hour-equivalent vs previous period.
  if (!signals.previousOrdersPerDay) return 0;
  return (
    ((signals.ordersPerDay - signals.previousOrdersPerDay) /
      signals.previousOrdersPerDay) *
    100
  );
}
