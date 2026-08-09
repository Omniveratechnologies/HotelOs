import { useEffect, useState } from "react";

const Navbar = () => {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateClock = () => {
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }),
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full flex flex-col">
      <div className="flex items-center justify-between py-3">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold uppercase tracking-[4px] text-white">
          Kitchen Display
        </h1>

        <div className="text-lg md:text-xl lg:text-2xl font-bold text-yellow-400 tracking-wider">
          {time}
        </div>
      </div>

      <div className="border-b-2 border-dotted border-gray-600"></div>
    </header>
  );
};

export default Navbar;
