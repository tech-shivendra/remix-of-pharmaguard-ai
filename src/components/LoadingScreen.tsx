import { motion, AnimatePresence } from "framer-motion";
import generxLogo from "@/assets/generx-logo.png";

interface LoadingScreenProps {
  isLoading: boolean;
}

export const LoadingScreen = ({ isLoading }: LoadingScreenProps) => {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ scale: 3, opacity: 0, filter: "blur(30px)" }}
          transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
        >
          {/* Blurred background glow */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[150px]" />
          </div>

          {/* Spinning asterisk icon */}
          <motion.div
            className="relative flex items-center gap-6"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Spinning logo */}
            <motion.img
              src={generxLogo}
              alt="GeneRx logo"
              className="w-20 h-20 md:w-28 md:h-28 rounded-2xl"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />

            {/* Brand text - stacked like reference */}
            <motion.div
              className="flex flex-col"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <span className="font-display font-bold text-5xl md:text-7xl tracking-tight text-primary/70">
                Gene
              </span>
              <span className="font-display font-bold text-4xl md:text-6xl tracking-tight text-foreground/80 -mt-2 ml-8">
                <span className="gradient-text">Rx</span>
              </span>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
