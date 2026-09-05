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

export const bookingDTO = async (booking, extra = {}) => {
  const guest = booking.guestId?._id ? booking.guestId : null;

  return {
    id: booking._id,
    guestId: booking.guestId?._id || booking.guestId,
    name: guest?.name,
    email: guest?.email,
    phone: guest?.phone,
    address: guest?.address,
    idType: guest?.idType,
    idNumber: guest?.idNumber,
    roomId: booking.roomId,
    room: booking.room
      ? {
          id: booking.room._id,
          roomNumber: booking.room.roomNumber,
          type: booking.room.type,
          rate: booking.room.rate,
          floor: booking.room.floor,
        }
      : null,
    hotelId: booking.hotelId,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    status: booking.status,
    nights: booking.nights ?? null,
    dndEnabled: booking.dndEnabled,
    documents: await Promise.all((guest?.documents || []).map(documentDTO)),
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    ...extra,
  };
};
