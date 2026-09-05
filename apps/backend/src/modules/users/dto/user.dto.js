export const userResponseDTO = (user) => ({
  id: user._id,
  name: user.name,
  username: user.username,
  email: user.email,
  role: user.role,
  hotelId: user.hotelId,
  roomId: user.roomId ?? null,
  isActive: user.isActive,
});
