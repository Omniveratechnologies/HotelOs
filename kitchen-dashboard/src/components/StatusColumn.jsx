import { motion } from "framer-motion";

const StatusColumn = ({ title, color, count, children }) => {
  return (
    <motion.div layout className="h-full flex flex-col">
      <div className="sticky top-0 z-10 bg-[#111111]">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="relative flex h-3 w-3 ml-3">
              <span
                className={`absolute inline-flex h-full w-full rounded-full ${color} animate-ping opacity-75`}
              ></span>

              <span
                className={`relative inline-flex h-3 w-3 rounded-full ${color}`}
              ></span>
            </div>

            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              {title}
            </h2>
          </div>

          <span className="text-sm font-semibold text-gray-400">({count})</span>
        </div>

        <div className="h-px bg-[#2d2d2d]"></div>
      </div>

      <div className="flex-1 flex flex-col gap-3 p-3 overflow-y-auto">
        {count > 0 ? (
          children
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center ">
            <div className="text-4xl opacity-20">🍽️</div>

            <p className="mt-3 text-xs uppercase tracking-[3px] text-gray-500">
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
