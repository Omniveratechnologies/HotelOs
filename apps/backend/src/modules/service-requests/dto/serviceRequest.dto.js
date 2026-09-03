export const serviceRequestDTO = (r) => ({
  id: r._id,
  type: r.type,
  description: r.description,
  items: r.items,
  status: r.status,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});
