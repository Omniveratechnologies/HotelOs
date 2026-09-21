export function formatRatesMatrix(
  dates,
  rawUpdates,
  localRoomTypes = [],
  localRatePlans = [],
) {
  const roomTypeMap = new Map();

  // Populate from local DB as base metadata
  for (const rt of localRoomTypes) {
    roomTypeMap.set(rt.roomCode, {
      roomCode: rt.roomCode,
      name: rt.name,
      ratePlans: new Map(),
    });
  }

  for (const rp of localRatePlans) {
    if (!roomTypeMap.has(rp.roomCode)) {
      roomTypeMap.set(rp.roomCode, {
        roomCode: rp.roomCode,
        name: rp.roomType || rp.roomCode.toUpperCase(),
        ratePlans: new Map(),
      });
    }
    const typeObj = roomTypeMap.get(rp.roomCode);
    typeObj.ratePlans.set(rp.ratePlanCode, {
      ratePlanCode: rp.ratePlanCode,
      name: rp.name,
      rates: {},
    });
  }

  // Overlay live rates returned by Aiosell
  for (const update of rawUpdates || []) {
    const updateDate = update.startDate;
    for (const r of update.rates || []) {
      const roomCode = String(r.roomCode || "")
        .trim()
        .toLowerCase();
      const planCode = String(r.rateplanCode || r.ratePlanCode || "")
        .trim()
        .toLowerCase();
      const rateVal = Number(r.rate);

      if (!roomTypeMap.has(roomCode)) {
        roomTypeMap.set(roomCode, {
          roomCode,
          name: roomCode.toUpperCase(),
          ratePlans: new Map(),
        });
      }
      const typeObj = roomTypeMap.get(roomCode);
      if (!typeObj.ratePlans.has(planCode)) {
        typeObj.ratePlans.set(planCode, {
          ratePlanCode: planCode,
          name: planCode.toUpperCase(),
          rates: {},
        });
      }
      const planObj = typeObj.ratePlans.get(planCode);
      planObj.rates[updateDate] = rateVal;
    }
  }

  const resultRoomTypes = [];
  const rows = [];
  const plans = [];

  for (const typeObj of roomTypeMap.values()) {
    const plansArray = Array.from(typeObj.ratePlans.values());
    resultRoomTypes.push({
      roomCode: typeObj.roomCode,
      code: typeObj.roomCode,
      name: typeObj.name,
      ratePlans: plansArray,
    });

    for (const p of plansArray) {
      const datesMap = {};
      for (const d of dates) {
        datesMap[d] = {
          rate: p.rates?.[d] != null ? p.rates[d] : null,
          stopSell: false,
        };
      }

      rows.push({
        roomCode: typeObj.roomCode,
        roomName: typeObj.name,
        planCode: p.ratePlanCode,
        planName: p.name || p.ratePlanCode,
        dates: datesMap,
      });

      plans.push({
        roomCode: typeObj.roomCode,
        roomName: typeObj.name,
        planCode: p.ratePlanCode,
        planName: p.name || p.ratePlanCode,
      });
    }
  }

  return {
    dates,
    roomTypes: resultRoomTypes,
    plans,
    rows,
  };
}

export function formatInventoryMatrix(
  dates,
  rawUpdates,
  totalCapacity = 0,
  localRoomTypes = [],
) {
  const roomTypeMap = new Map();

  for (const rt of localRoomTypes) {
    roomTypeMap.set(rt.roomCode, {
      roomCode: rt.roomCode,
      name: rt.name,
      count: rt.count || 0,
      available: {},
    });
  }

  for (const update of rawUpdates || []) {
    const updateDate = update.startDate;
    for (const r of update.rooms || []) {
      const roomCode = String(r.roomCode || "")
        .trim()
        .toLowerCase();
      const avail = Number(r.available);

      if (!roomTypeMap.has(roomCode)) {
        roomTypeMap.set(roomCode, {
          roomCode,
          name: roomCode.toUpperCase(),
          count: 0,
          available: {},
        });
      }
      const typeObj = roomTypeMap.get(roomCode);
      typeObj.available[updateDate] = avail;
    }
  }

  const resultRoomTypes = Array.from(roomTypeMap.values());

  // Compute daily totals & occupancy percentage
  const totalAvailable = {};
  const occupancyPercentage = {};

  for (const d of dates) {
    let dayAvail = 0;
    for (const rt of resultRoomTypes) {
      dayAvail += rt.available[d] ?? 0;
    }
    totalAvailable[d] = dayAvail;
    if (totalCapacity > 0) {
      const booked = Math.max(0, totalCapacity - dayAvail);
      occupancyPercentage[d] = Math.round((booked / totalCapacity) * 100);
    } else {
      occupancyPercentage[d] = 0;
    }
  }

  return {
    dates,
    roomTypes: resultRoomTypes,
    summary: {
      totalCapacity,
      totalAvailable,
      occupancyPercentage,
    },
  };
}
