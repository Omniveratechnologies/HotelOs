import { generateDownloadUrl } from "#/config/r2.js";

const documentDTO = async (doc) => {
  const key = String(doc.path || "");

  return {
    id: doc._id,
    docType: doc.docType,
    filename: doc.filename,
    url: key ? await generateDownloadUrl(key) : null,
    uploadedAt: doc.uploadedAt,
  };
};

// Lightweight DTO for list responses (no signed document URLs).
export const bookingListDTO = (booking) => {
  const guest = booking.guestId?._id ? booking.guestId : null;

  return {
    id: booking._id,
    reservationNo: booking.reservationNo || null,
    source: booking.source || "DIRECT",
    name: guest?.name || null,
    email: guest?.email || null,
    phone: guest?.phone || null,
    roomId: booking.roomId?._id ? booking.roomId._id : booking.roomId,
    room: booking.roomId?.roomNumber
      ? {
          id: booking.roomId._id,
          roomNumber: booking.roomId.roomNumber,
          type: booking.roomId.type,
          rate: booking.roomId.rate,
          floor: booking.roomId.floor,
          roomCode: booking.roomId.roomCode,
        }
      : null,
    roomTypeCode: booking.roomTypeCode || null,
    ratePlan: booking.ratePlanId?._id
      ? {
          id: booking.ratePlanId._id,
          name: booking.ratePlanId.name,
          mealPlan: booking.ratePlanId.mealPlan,
        }
      : null,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    status: booking.status,
    nights: booking.nights ?? null,
    rooms: booking.rooms != null ? booking.rooms : 1,
    adults: booking.adults != null ? booking.adults : 1,
    children: booking.children || 0,
    infants: booking.infants || 0,
    grandTotal:
      booking.pricing?.grandTotal ?? booking.totalAmountBeforeTax ?? 0,
    paymentStatus: booking.paymentStatus || "unpaid",
    checkInVerified: booking.checkInVerified || false,
    otaChannel: booking.otaInfo?.channel || null,
    otaBookingId:
      booking.otaInfo?.otaBookingId || booking.aiosellBookingId || null,
    specialRequests: booking.specialRequests,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
  };
};

export const bookingDTO = async (booking, extra = {}) => {
  const guest = booking.guestId?._id ? booking.guestId : null;

  return {
    id: booking._id,
    reservationNo: booking.reservationNo || null,
    source: booking.source || "DIRECT",
    guestId: booking.guestId?._id || booking.guestId,
    name: guest?.name,
    email: guest?.email,
    phone: guest?.phone,
    address: guest?.address,
    idType: guest?.idType,
    idNumber: guest?.idNumber,
    nationality: guest?.nationality || null,
    roomId: booking.roomId?._id ? booking.roomId._id : booking.roomId,
    room:
      booking.roomId?.roomNumber != null
        ? {
            id: booking.roomId._id,
            roomNumber: booking.roomId.roomNumber,
            type: booking.roomId.type,
            rate: booking.roomId.rate,
            floor: booking.roomId.floor,
            roomCode: booking.roomId.roomCode,
          }
        : booking.room
          ? {
              id: booking.room._id,
              roomNumber: booking.room.roomNumber,
              type: booking.room.type,
              rate: booking.room.rate,
              floor: booking.room.floor,
              roomCode: booking.room.roomCode,
            }
          : null,
    roomTypeCode: booking.roomTypeCode || null,
    ratePlan: booking.ratePlanId?._id
      ? {
          id: booking.ratePlanId._id,
          name: booking.ratePlanId.name,
          mealPlan: booking.ratePlanId.mealPlan,
          occupancy: booking.ratePlanId.occupancy,
          rate: booking.ratePlanId.rate,
        }
      : null,
    mealPlan: booking.mealPlan || null,
    hotelId: booking.hotelId,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    status: booking.status,
    nights: booking.nights ?? null,
    rooms: booking.rooms != null ? booking.rooms : 1,
    adults: booking.adults != null ? booking.adults : 1,
    children: booking.children || 0,
    infants: booking.infants || 0,
    guestType: booking.guestType || "individual",
    specialRequests: booking.specialRequests,
    purpose: booking.purpose,
    dndEnabled: booking.dndEnabled,
    roomAllocations: (booking.roomAllocations || []).map((alloc) => ({
      id: alloc._id || alloc.allocationId,
      allocationId: alloc.allocationId,
      roomTypeCode: alloc.roomTypeCode,
      roomId: alloc.roomId?._id || alloc.roomId || null,
      roomNumber: alloc.roomNumber || alloc.roomId?.roomNumber || null,
      ratePlanId: alloc.ratePlanId?._id || alloc.ratePlanId || null,
      nightlyRate: alloc.nightlyRate || 0,
      adults: alloc.adults || 1,
      children: alloc.children || 0,
      occupantName: alloc.occupantName || null,
      occupantPhone: alloc.occupantPhone || null,
      occupantEmail: alloc.occupantEmail || null,
      occupantIdType: alloc.occupantIdType || null,
      occupantIdNumber: alloc.occupantIdNumber || null,
      status: alloc.status || "unassigned",
      notes: alloc.notes || null,
    })),
    roomRequirements: (booking.roomRequirements || []).map((req) => ({
      roomTypeCode: req.roomTypeCode,
      rooms: req.rooms,
      adultsPerRoom: req.adultsPerRoom,
      childrenPerRoom: req.childrenPerRoom,
      notes: req.notes || null,
    })),
    groupInfo: booking.groupInfo || null,
    guestRoster: (booking.guestRoster || []).map((g) => ({
      name: g.name,
      phone: g.phone || null,
      email: g.email || null,
      designation: g.designation || null,
      assignedRoom: g.assignedRoom || null,
      roomTypeCode: g.roomTypeCode || null,
      notes: g.notes || null,
      isPrimary: Boolean(g.isPrimary),
    })),
    pricing: booking.pricing || null,
    paymentStatus: booking.paymentStatus || "unpaid",
    checkInVerified: booking.checkInVerified || false,
    otaInfo: booking.otaInfo || null,
    cancellation: booking.cancellation || null,
    auditTrail: booking.auditTrail || [],
    // Legacy channel-manager fields (OTA imports)
    channel: booking.channel,
    aiosellBookingId: booking.aiosellBookingId,
    bookedOn: booking.bookedOn,
    totalAmountBeforeTax: booking.totalAmountBeforeTax,
    tax: booking.tax,
    commission: booking.commission,
    currency: booking.currency,
    documents: await Promise.all((guest?.documents || []).map(documentDTO)),
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    ...extra,
  };
};
