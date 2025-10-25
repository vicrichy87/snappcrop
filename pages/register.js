import { motion } from "framer-motion";
import Image from "next/image";
import logo from "../public/logo.png";
import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      alert("⚠️ Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      // ✅ Step 1: Register user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.full_name, // stored as user_metadata
          },
        },
      });

      if (error) throw error;

      // ✅ Step 2: Optionally insert user into 'profiles' table
      if (data.user) {
        await supabase.from("profiles").insert([
          {
            id: data.user.id,
            full_name: form.full_name,
          },
        ]);
      }

      alert("✅ Registration successful! Please check your email to verify your account.");
      setForm({
        full_name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error("Registration error:", err.message);
      alert(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-sky-50 via-white to-blue-100 overflow-hidden">
      {/* Animated background */}
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

      {/* Registration Section */}
      <section className="w-full max-w-md mx-auto px-6 py-10 flex flex-col items-center justify-center text-center">
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden shadow-2xl border border-sky-100 mb-6">
          <Image
            src={logo}
            alt="Snappcrop Logo"
            fill
            className="object-contain brightness-110"
            priority
          />
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold text-sky-800 mb-4">
          Create Account
        </h1>
        <p className="text-lg sm:text-xl text-slate-600 mb-10">
          Join Snappcrop and start creating your perfect passport photos.
        </p>

        <form
          onSubmit={handleSubmit}
          className="w-full bg-white/80 backdrop-blur-md border border-blue-100 rounded-3xl shadow-2xl p-8 text-left"
        >
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Full Name
            </label>
            <input
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
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
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
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
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              className="w-full border border-sky-200 rounded-full px-4 py-2 focus:ring-2 focus:ring-sky-400 outline-none"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Confirm Password
            </label>
            <input
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
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
            className={`mt-2 w-full px-8 py-3 rounded-full font-semibold text-white shadow-md transition-all ${
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
        </form>
      </section>

      <footer className="text-center pb-10 text-gray-500 text-sm">
        © {new Date().getFullYear()} Snappcrop — Speak. Snap. Smile.
      </footer>

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
      `}</style>
    </main>
  );
}
