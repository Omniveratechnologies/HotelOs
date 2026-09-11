export const serviceRequestDTO = (r) => ({
  id: r._id,
  type: r.type,
  description: r.description,
  items: r.items,
  details: r.details,
  status: r.status,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

export const staffServiceRequestDTO = (req, room, guest) => ({
  id: req._id,
  roomNumber: room ? room.roomNumber : req.roomId || null,
  guestName: guest?.name || "",
  type: req.type,
  description: req.description,
  items: req.items,
  priority: req.priority,
  status: req.status,
  createdAt: req.createdAt,
  updatedAt: req.updatedAt,
});
