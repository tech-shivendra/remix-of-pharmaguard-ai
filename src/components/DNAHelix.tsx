import { motion } from "framer-motion";

const HELIX_PAIRS = 20;

export const DNAHelix = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-30">
      <div className="absolute right-[10%] top-0 h-full w-40">
        {Array.from({ length: HELIX_PAIRS }).map((_, i) => {
          const delay = i * 0.15;
          const yPos = (i / HELIX_PAIRS) * 100;

          return (
            <motion.div
              key={i}
              className="absolute w-full"
              style={{ top: `${yPos}%` }}
              animate={{ y: [0, 40, 0] }}
              transition={{
                duration: 4,
                delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {/* Left nucleotide */}
              <motion.div
                className="absolute h-2.5 w-2.5 rounded-full"
                style={{ background: "hsl(183 100% 50%)" }}
                animate={{
                  x: [0, 60, 0, -60, 0],
                  scale: [1, 0.6, 1, 0.6, 1],
                  opacity: [0.9, 0.4, 0.9, 0.4, 0.9],
                }}
                transition={{
                  duration: 3,
                  delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              {/* Right nucleotide */}
              <motion.div
                className="absolute h-2.5 w-2.5 rounded-full right-0"
                style={{ background: "hsl(265 70% 65%)" }}
                animate={{
                  x: [0, -60, 0, 60, 0],
                  scale: [0.6, 1, 0.6, 1, 0.6],
                  opacity: [0.4, 0.9, 0.4, 0.9, 0.4],
                }}
                transition={{
                  duration: 3,
                  delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              {/* Connector bar */}
              <motion.div
                className="absolute top-1 h-[2px] left-1/2 -translate-x-1/2 rounded-full"
                style={{ background: "linear-gradient(90deg, hsl(183 100% 50% / 0.4), hsl(265 70% 65% / 0.4))" }}
                animate={{
                  width: ["60%", "20%", "60%", "20%", "60%"],
                  opacity: [0.6, 0.15, 0.6, 0.15, 0.6],
                }}
                transition={{
                  duration: 3,
                  delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
