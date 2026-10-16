// category.dto.js
export const categoryDTO = (c) => ({
  id: c._id,
  name: c.name,
  description: c.description,
  parentCategory: c.parentCategory,
  image: c.image,
  icon: c.icon,
  displayOrder: c.displayOrder,
  status: c.status,
  gstRate: c.gstRate,
  cgstRate: c.cgstRate,
  sgstRate: c.sgstRate,
  hotelId: c.hotelId,
});
