import { useContext } from "react";
import { HotelOSContext } from "./hotelOSContext.js";

export function useHotelOS() {
  return useContext(HotelOSContext);
}
