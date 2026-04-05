
"use client";
import { motion, AnimatePresence } from "framer-motion";
import { fmt } from "@/lib/utils";

interface ResultOverlayProps {
  show: boolean;
  won: boolean;
  amount: number;
  message?: string;
  onDismiss: () => void;
}

export function ResultOverlay({show, won, amount, message, onDismiss}: ResultOverlayProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{opacity:0,scale:0.7}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.7}}
          transition={{type:"spring",stiffness:300,damping:20}}
          onClick={onDismiss}
          className="absolute inset-0 flex items-center justify-center rounded-2xl cursor-pointer"
          style={{background:"rgba(8,8,15,0.85)",backdropFilter:"blur(8px)",zIndex:50}}>
          <div className="text-center px-6">
            <motion.div initial={{y:-20}} animate={{y:0}} className="text-6xl mb-3">
              {won ? "🎉" : "💔"}
            </motion.div>
            <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.1}}
              className="text-2xl font-bold mb-2"
              style={{color:won?"#10b981":"#ef4444"}}>
              {won ? "You Won!" : "You Lost"}
            </motion.p>
            {amount !== 0 && (
              <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.2}}
                className="text-4xl font-black mb-1" style={{color:won?"#34d399":"#f87171"}}>
                {won?"+":"-"}🍪{fmt(Math.abs(amount))}
              </motion.p>
            )}
            {message && (
              <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.3}} className="text-slate-400 text-sm mb-4">
                {message}
              </motion.p>
            )}
            <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.4}} className="text-slate-500 text-xs">
              Tap anywhere to continue
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
