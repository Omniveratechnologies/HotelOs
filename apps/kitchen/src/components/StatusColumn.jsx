import { motion } from "framer-motion";

const StatusColumn = ({ title, color, count, children }) => {
  return (
    <motion.div layout className="flex h-full flex-col">
      <div className="sticky top-0 z-10 bg-[#111111]">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="relative ml-3 flex h-3 w-3">
              <span
                className={`absolute inline-flex h-full w-full rounded-full ${color} animate-ping opacity-75`}
              ></span>

              <span
                className={`relative inline-flex h-3 w-3 rounded-full ${color}`}
              ></span>
            </div>

            <h2 className="text-sm font-bold tracking-wider text-white uppercase">
              {title}
            </h2>
          </div>

          <span className="text-sm font-semibold text-gray-400">({count})</span>
        </div>

        <div className="h-px bg-[#2d2d2d]"></div>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        {count > 0 ? (
          children
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="text-4xl opacity-20">🍽️</div>

            <p className="mt-3 text-xs tracking-[3px] text-gray-500 uppercase">
              WAITING
            </p>

            <p className="text-sm text-gray-600">No Orders</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatusColumn;
