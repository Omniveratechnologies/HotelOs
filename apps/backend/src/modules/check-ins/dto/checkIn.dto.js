import { generateDownloadUrl } from "#/config/r2.js";

const withUrl = async (file) => {
  if (!file?.key) return file || null;
  return { ...file, url: await generateDownloadUrl(file.key) };
};

/**
 * Receptionist-facing session view (includes signed document URLs).
 *
 * @param {object} session - CheckInSession doc (populated reservationId).
 */
export const checkInSessionDTO = async (session) => {
  const booking = session.reservationId?._id ? session.reservationId : null;
  const guest = booking?.guestId?._id ? booking.guestId : null;

  return {
    id: session._id,
    reservationId: booking?._id || session.reservationId,
    reservationNo: booking?.reservationNo || null,
    bookingSource: booking?.source || null,
    guestName: guest?.name || session.stepData?.guestName || "",
    guestPhone: guest?.phone || session.stepData?.phone || "",
    guestEmail: guest?.email || session.stepData?.email || "",
    room: booking?.roomId
      ? {
          id: booking.roomId._id || booking.roomId,
          roomNumber: booking.roomId.roomNumber,
          type: booking.roomId.type,
        }
      : null,
    roomType: booking?.roomTypeCode || booking?.roomId?.type || null,
    checkIn: booking?.checkIn || null,
    checkOut: booking?.checkOut || null,
    bookingStatus: booking?.status || null,
    status: session.status,
    sentVia: session.sentVia,
    sentAt: session.sentAt,
    currentStep: session.currentStep,
    submittedAt: session.submittedAt,
    expiresAt: session.expiresAt,
    review: session.review
      ? {
          reviewedBy: session.review.reviewedBy || null,
          reviewedAt: session.review.reviewedAt || null,
          decision: session.review.decision || null,
          message: session.review.message || null,
          steps: session.review.steps || [],
        }
      : null,
    stepData: session.stepData
      ? {
          ...session.stepData,
          idFront: await withUrl(session.stepData.idFront),
          idBack: await withUrl(session.stepData.idBack),
          selfie: await withUrl(session.stepData.selfie),
          signature: await withUrl(session.stepData.signature),
        }
      : null,
    auditTrail: session.auditTrail || [],
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
};

/**
 * Public (guest) session view — no internal notes, no other-guest data,
 * files returned as signed URLs.
 */
export const publicCheckInSessionDTO = async (session) => {
  const booking = session.reservationId?._id ? session.reservationId : null;
  const guest = booking?.guestId?._id ? booking.guestId : null;

  return {
    status: session.status,
    currentStep: session.currentStep,
    correctionMessage: session.review?.message || null,
    correctionSteps:
      session.review?.decision === "correction-requested"
        ? session.review.steps || []
        : [],
    booking: booking
      ? {
          reservationNo: booking.reservationNo || null,
          roomType: booking.roomTypeCode || booking.roomId?.type || null,
          roomNumber: booking.roomId?.roomNumber || null,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          nights: booking.nights ?? null,
          guests: {
            adults: booking.adults ?? 1,
            children: booking.children ?? 0,
            infants: booking.infants ?? 0,
          },
        }
      : null,
    guest: {
      name: session.stepData?.guestName || guest?.name || "",
      email: session.stepData?.email || guest?.email || "",
      phone: session.stepData?.phone || guest?.phone || "",
      nationality: session.stepData?.nationality || guest?.nationality || "",
    },
    stepData: session.stepData
      ? {
          idType: session.stepData.idType || "",
          idNumber: session.stepData.idNumber || "",
          dateOfBirth: session.stepData.dateOfBirth || "",
          idFront: await withUrl(session.stepData.idFront),
          idBack: await withUrl(session.stepData.idBack),
          selfie: await withUrl(session.stepData.selfie),
          signature: await withUrl(session.stepData.signature),
          preferences: session.stepData.preferences || [],
          remarks: session.stepData.remarks || "",
          termsAcceptedAt: session.stepData.termsAcceptedAt || null,
        }
      : null,
    submittedAt: session.submittedAt,
  };
};
