// discount.dto.js
export const discountDTO = (d) => ({
  id: d._id,
  name: d.name,
  type: d.type,
  value: d.value,
  conditions: d.conditions,
  validity: d.validity,
  status: d.status,
});
