import { useEffect, useState } from "react";
import Hamburger from "../Hamburger/Hamburger";
import SearchBar from "./SearchBar";

const Navbar = ({
  icon,
  iconColor = "text-white",
  bgColor = "bg-transparent",
  title,
  subtitle,
  breadcrumb,
  pageAction,
  showPageHeading = false,
  isMenuOpen,
  setIsMenuOpen,
  searchTerm,
  setSearchTerm,
  placeholder
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
      <div className="relative flex flex-wrap items-center justify-between gap-3 py-3 sm:flex-nowrap">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <Hamburger isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

          {showPageHeading ? (
            <SearchBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              placeholder={placeholder}
            />
          ) : (
            <div className="flex items-center gap-2">
              {/* <div
                className={`flex h-8 w-8 items-center justify-center rounded ${iconColor} ${bgColor}`}
              >
                {icon}
              </div> */}

              <div>
                <h1 className="truncate text-lg font-bold tracking-[2px] text-white uppercase sm:text-xl md:text-2xl lg:text-3xl">
                  {title}
                </h1>

                <h4 className="text-gray-300">{subtitle}</h4>
              </div>
            </div>
          )}
        </div>

        <div className="flex w-full items-center gap-3 sm:w-auto sm:gap-5">
          {!showPageHeading && (
            <SearchBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              placeholder="Search order, items,..."
            />
          )}

          <div className="hidden p-2 leading-tight sm:block">
            <div className="text-base font-bold tracking-wider text-yellow-400 md:text-xl lg:text-2xl">
              {time}
            </div>

            <div className="text-sm font-medium tracking-wide text-gray-400">
              {date}
            </div>
          </div>
        </div>
      </div>

      <div className="border-b-2 border-dotted border-gray-600"></div>

      {showPageHeading && (
        <div className="mt-4 px-2 sm:mt-5 sm:px-4 lg:px-8">
          {breadcrumb && (
            <p className="mb-2 text-xs text-gray-500">{breadcrumb}</p>
          )}

          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded ${iconColor} ${bgColor}`}
                >
                  {icon}
                </div>

                <h2 className="text-xl font-semibold text-white">{title}</h2>
              </div>

              <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
            </div>

            {pageAction && <div>{pageAction}</div>}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
