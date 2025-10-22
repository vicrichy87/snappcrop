// components/Navbar.js
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import logo from '../public/logo.png';
import { FaHome, FaImages, FaInfoCircle } from 'react-icons/fa';

export default function Navbar() {
  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, type: 'spring' }}
      className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md shadow-md z-50"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
        {/* Logo + Brand Name */}
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center">
            <Image
              src={logo}
              alt="Snappcrop Logo"
              width={40}
              height={40}
              className="rounded-lg object-contain"
              priority
            />
          </div>
          <span className="text-lg md:text-xl font-bold text-sky-700 tracking-tight">
            Snappcrop
          </span>
        </div>

        {/* Navigation Links */}
        <div className="flex gap-5 text-sm md:text-base font-medium text-gray-700">
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-sky-600 transition-colors"
          >
            <FaHome /> Home
          </Link>
          <Link
            href="/gallery"
            className="flex items-center gap-1 hover:text-sky-600 transition-colors"
          >
            <FaImages /> Gallery
          </Link>
          <Link
            href="/about"
            className="flex items-center gap-1 hover:text-sky-600 transition-colors"
          >
            <FaInfoCircle /> About
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
