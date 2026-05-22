// Loader.js
import React from "react";
import { motion } from 'framer-motion';

const Loader = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-white">
        <div className="relative w-32 h-40">
            {/* Book Cover */}
            <motion.div
                className="absolute w-full h-full bg-blue-500 rounded shadow-xl"
                animate={{ rotateY: [0, -15, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            />
            {/* Pages */}
            {[...Array(3)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-full h-full bg-white rounded shadow-lg"
                    style={{ left: `${i * 4}px`, zIndex: 10 - i }}
                    animate={{ rotateY: [0, -15, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2, ease: 'easeInOut' }}
                />
            ))}
        </div>
    </div>
);
};
export default Loader;
