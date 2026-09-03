import { generateDownloadUrl } from "../../../config/r2.js";

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

export const guestProfileDTO = (user, room) => ({
  id: user._id,
  name: user.name,
  username: user.username,
  role: user.role,
  hotelId: user.hotelId,
  checkIn: user.checkIn,
  checkOut: user.checkOut,
  dndEnabled: user.dndEnabled,
  room: room
    ? {
        id: room._id,
        roomNumber: room.roomNumber,
        type: room.type,
        status: room.status,
      }
    : null,
});

export const guestResponseDTO = async (guest, extra = {}) => ({
  id: guest._id,
  name: guest.name,
  email: guest.email,
  phone: guest.phone,
  address: guest.address,
  idType: guest.idType,
  idNumber: guest.idNumber,
  roomId: guest.roomId,
  room: guest.room
    ? {
        id: guest.room._id,
        roomNumber: guest.room.roomNumber,
        type: guest.room.type,
        rate: guest.room.rate,
        floor: guest.room.floor,
      }
    : null,
  hotelId: guest.hotelId,
  userId: guest.userId,
  checkIn: guest.checkIn,
  checkOut: guest.checkOut,
  status: guest.status,
  nights: guest.nights ?? null,
  documents: await Promise.all((guest.documents || []).map(documentDTO)),
  createdAt: guest.createdAt,
  ...extra,
});
