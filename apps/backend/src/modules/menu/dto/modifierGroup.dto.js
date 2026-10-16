// modifierGroup.dto.js
export const modifierGroupDTO = (g) => ({
  id: g._id,
  name: g.name,
  type: g.type,
  description: g.description,
  image: g.image,
  displayOrder: g.displayOrder,
  status: g.status,
  required: g.required,
  minSelection: g.minSelection,
  maxSelection: g.maxSelection,
  allowMultiple: g.allowMultiple,
  options: g.options.map((o) => ({
    id: o._id,
    name: o.name,
    image: o.image,
    price: o.price,
    isDefault: o.isDefault,
    status: o.status,
  })),
});
