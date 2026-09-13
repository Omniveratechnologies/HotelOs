
import { useEffect, useState } from "react";
import Hamburger from "./Hamburger/Hamburger";
import SearchBar from "./SearchBar";

const Navbar = ({
  title,
  subtitle,
  isMenuOpen,
  setIsMenuOpen,
  searchTerm,
  setSearchTerm,
}) => {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();

      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }),
      );

      setDate(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      );
    };

    updateClock();

    const interval = setInterval(updateClock, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full">
      <div className="relative flex items-center justify-between py-3">
        <div className="flex items-center gap-2">
          <Hamburger
            isMenuOpen={isMenuOpen}
            setIsMenuOpen={setIsMenuOpen}
          />

          <div>
            <h1 className="text-xl font-bold tracking-[4px] text-white uppercase md:text-2xl lg:text-3xl">
              {title}
            </h1>

            <h4 className="text-gray-300">
              {subtitle}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />

          <div className="leading-tight p-2">
            <div className="text-lg font-bold tracking-wider text-yellow-400 md:text-xl lg:text-2xl">
              {time}
            </div>

            <div className="text-sm font-medium tracking-wide text-gray-400">
              {date}
            </div>
          </div>
        </div>
      </div>

      <div className="border-b-2 border-dotted border-gray-600"></div>
    </header>
  );
};

export default Navbar;
