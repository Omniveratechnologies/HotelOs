export const foodItemDTO = (item) => ({
  id: item._id,
  name: item.name,
  description: item.description,
  price: item.price,
  category: item.category,
  isAvailable: item.isAvailable,
});