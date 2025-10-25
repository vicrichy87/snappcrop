import { motion } from "framer-motion";
import Image from "next/image";
import logo from "../public/logo.png";
import { useState } from "react";

export default function Register() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      alert("✅ Registration successful! You can now log in.");
      setLoading(false);
    }, 1200);
  };

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-sky-50 via-white to-blue-100 overflow-hidden">
      {/* Animated background gradients */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-0 left-0 w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-200 via-transparent to-transparent opacity-40 animate-wave-slow"></div>
        <div className="absolute bottom-0 right-0 w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-200 via-transparent to-transparent opacity-40 animate-wave-fast"></div>
      </div>

      {/* Top Navigation */}
      <nav className="w-full flex justify-end items-center px-6 lg:px-12 py-6 gap-3">
        <motion.a
          href="/"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 250, damping: 12 }}
          className="inline-flex items-center justify-center px-6 py-2 bg-white/80 backdrop-blur-md text-sky-700 font-semibold border border-sky-200 rounded-full shadow-sm hover:shadow-md hover:bg-sky-50 transition text-sm"
        >
          Home
        </motion.a>

        <motion.a
          href="/login"
          whileHover={{ scale: 1.08, rotate: 1 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 250, damping: 12 }}
          className="relative inline-flex items-center justify-center px-6 py-2 font-semibold text-sm text-white rounded-full bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 shadow-lg overflow-hidden"
        >
          <span className="relative z-10">Login</span>
          <span className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 blur-md opacity-75 animate-pulse-slow"></span>
          <span className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shine"></span>
        </motion.a>
      </nav>

      {/* Main Section */}
      <section className="w-full max-w-md mx-auto px-6 py-10 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center justify-center gap-6"
        >
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden shadow-2xl border border-sky-100">
            <Image
              src={logo}
              alt="Snappcrop Logo"
              fill
              className="object-contain brightness-110"
              priority
            />
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold text-sky-800 tracking-tight">
            Create Account
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 leading-relaxed">
            Join Snappcrop and start creating your perfect passport photos.
          </p>
        </motion.div>

        {/* Registration Form */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-10 w-full bg-white/80 backdrop-blur-md border border-blue-100 rounded-3xl shadow-2xl p-8 text-left"
        >
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              placeholder="John Doe"
              className="w-full border border-sky-200 rounded-full px-4 py-2 focus:ring-2 focus:ring-sky-400 outline-none"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              className="w-full border border-sky-200 rounded-full px-4 py-2 focus:ring-2 focus:ring-sky-400 outline-none"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="w-full border border-sky-200 rounded-full px-4 py-2 focus:ring-2 focus:ring-sky-400 outline-none"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              required
              placeholder="Re-enter password"
              className="w-full border border-sky-200 rounded-full px-4 py-2 focus:ring-2 focus:ring-sky-400 outline-none"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            className={`mt-4 w-full px-8 py-3 rounded-full font-semibold text-white shadow-md transition-all ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700"
            }`}
          >
            {loading ? "Registering..." : "Sign Up"}
          </motion.button>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-sky-600 hover:text-indigo-600 font-semibold underline"
            >
              Login here
            </a>
          </p>
        </motion.form>
      </section>

      {/* Footer */}
      <footer className="text-center pb-10 text-gray-500 text-sm">
        © {new Date().getFullYear()} Snappcrop — Speak. Snap. Smile.
      </footer>

      {/* Animations */}
      <style jsx>{`
        @keyframes wave-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes wave-fast {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        .animate-wave-slow { animation: wave-slow 6s ease-in-out infinite; }
        .animate-wave-fast { animation: wave-fast 4s ease-in-out infinite; }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.75; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.02); }
        }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        @keyframes shine {
          0% { transform: translateX(-100%); opacity: 0; }
          50% { opacity: 0.8; }
          100% { transform: translateX(100%); opacity: 0; }
        }
        .animate-shine { animation: shine 3.5s linear infinite; }
      `}</style>
    </main>
  );
}
