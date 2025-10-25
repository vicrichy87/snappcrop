import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import logo from "../public/logo.png";
import { supabase } from "../lib/supabase";


export default function About() {
  const [showLogin, setShowLogin] = useState(false);

  const [loginSuccess, setLoginSuccess] = useState(false);
  const [loginCountdown, setLoginCountdown] = useState(3);


  return (
    <main className="relative min-h-screen bg-gradient-to-b from-sky-50 via-white to-blue-100 overflow-hidden">
      {/* Animated background gradients */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-0 left-0 w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-200 via-transparent to-transparent opacity-40 animate-wave-slow"></div>
        <div className="absolute bottom-0 right-0 w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-200 via-transparent to-transparent opacity-40 animate-wave-fast"></div>
      </div>

      {/* ✅ Top Navigation */}
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

        <motion.button
          onClick={() => setShowLogin(true)}
          whileHover={{ scale: 1.08, rotate: 1 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 250, damping: 12 }}
          className="relative inline-flex items-center justify-center px-6 py-2 font-semibold text-sm text-white rounded-full bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 shadow-lg overflow-hidden"
        >
          <span className="relative z-10">Login</span>
          <span className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 blur-md opacity-75 animate-pulse-slow"></span>
          <span className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shine"></span>
        </motion.button>
      </nav>

      {/* Header */}
      <section className="w-full max-w-5xl mx-auto px-6 lg:px-12 py-10 text-center">
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
            About Snappcrop
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl leading-relaxed">
            Snappcrop helps you transform your selfie into a perfect passport photo — 
            compliant, clean, and ready in seconds.
          </p>
        </motion.div>
      </section>

      {/* About content */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-3xl mx-auto bg-white/80 backdrop-blur-md border border-blue-100 rounded-3xl shadow-2xl p-10 mb-24 text-slate-700"
      >
        <h2 className="text-2xl font-bold text-sky-800 mb-4">What is Snappcrop?</h2>
        <p className="mb-6">
          Snappcrop is a simple web app that lets you create passport photos from a selfie in just a few clicks. 
          Upload your photo, crop it to the correct size, and download a high-quality image that meets passport requirements. 
          Designed for everyone, Snappcrop simplifies official photo creation with AI-powered tools and clean design.
        </p>

        <h2 className="text-2xl font-bold text-sky-800 mb-4">Key Features</h2>
        <ul className="list-disc list-inside mb-6 space-y-2">
          <li>📸 Easy selfie upload from your phone or computer.</li>
          <li>🤖 Automatic face detection and cropping to standard passport sizes.</li>
          <li>🎨 Background removal with customizable red or white backgrounds.</li>
          <li>☁️ Secure storage and fast image delivery powered by Supabase.</li>
          <li>🌍 Future updates: Multi-country compliance checks and print-ready exports.</li>
        </ul>

        <p className="mt-6">
          Built with ❤️ by the Snappcrop team to make passport photos accessible to everyone.  
          Have feedback or suggestions? Share them on{" "}
          <a
            href="https://x.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-600 hover:text-indigo-600 font-semibold underline"
          >
            X (Twitter)
          </a>{" "}
          using <strong>#Snappcrop</strong>!
        </p>
      </motion.section>

      {/* Contact Us Section */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true }}
        className="relative z-10 w-full max-w-3xl mx-auto mb-24 bg-white/80 backdrop-blur-md border border-blue-100 rounded-3xl shadow-2xl p-10 text-center"
      >
        <h2 className="text-3xl font-bold text-sky-800 mb-4">Contact Us</h2>
        <p className="text-slate-600 mb-8">
          Have a question, feature request, or feedback? We’d love to hear from you!  
          Fill out the form below and we’ll get back to you soon.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            alert("✅ Thank you! Your message has been sent successfully.");
          }}
          className="flex flex-col gap-4 text-left"
        >
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Name</label>
            <input
              type="text"
              required
              placeholder="Your full name"
              className="w-full border border-sky-200 rounded-full px-4 py-2 focus:ring-2 focus:ring-sky-400 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              className="w-full border border-sky-200 rounded-full px-4 py-2 focus:ring-2 focus:ring-sky-400 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Message</label>
            <textarea
              required
              placeholder="Type your message here..."
              rows="5"
              className="w-full border border-sky-200 rounded-3xl px-4 py-3 focus:ring-2 focus:ring-sky-400 outline-none resize-none"
            ></textarea>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            type="submit"
            className="mt-4 px-8 py-3 bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-semibold rounded-full shadow-md hover:from-sky-700 hover:to-indigo-700 transition-all"
          >
            Send Message
          </motion.button>
        </form>
      </motion.section>

      {/* ✅ LOGIN MODAL */}
      <AnimatePresence>
        {showLogin && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 150, damping: 12 }}
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-[90%] text-center border border-blue-100 relative"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowLogin(false)}
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 text-xl"
              >
                ✕
              </button>
      
              {/* Logo */}
              <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-r from-sky-100 to-indigo-100 flex items-center justify-center shadow-inner">
                <img src="/logo.png" alt="Snappcrop" className="w-12 h-12 object-contain" />
              </div>
      
              <h2 className="text-2xl font-bold text-sky-800 mb-2">Welcome Back</h2>
              <p className="text-slate-600 mb-6 text-sm">Login to continue using Snappcrop</p>
      
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const email = e.target.email.value;
                  const password = e.target.password.value;
      
                  try {
                    const { data, error } = await supabase.auth.signInWithPassword({
                      email,
                      password,
                    });
      
                    if (error) throw error;
      
                    // ✅ Show success modal
                    setLoginSuccess(true);
                    let seconds = 3;
                    const timer = setInterval(() => {
                      seconds -= 1;
                      setLoginCountdown(seconds);
                      if (seconds <= 0) {
                        clearInterval(timer);
                        setShowLogin(false);
                        window.location.href = "/";
                      }
                    }, 1000);
                  } catch (err) {
                    alert(`❌ ${err.message}`);
                  }
                }}
                className="text-left"
              >
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="w-full border border-sky-200 rounded-full px-4 py-2 mb-3 focus:ring-2 focus:ring-sky-400 outline-none"
                />
      
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full border border-sky-200 rounded-full px-4 py-2 mb-4 focus:ring-2 focus:ring-sky-400 outline-none"
                />
      
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  className="w-full py-3 mt-2 rounded-full font-semibold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 shadow-md"
                >
                  Login
                </motion.button>
              </form>
      
              <p className="mt-6 text-sm text-slate-600">
                Don’t have an account?{" "}
                <a
                  href="/register"
                  className="text-sky-600 hover:text-indigo-600 font-semibold underline"
                >
                  Click here to register
                </a>
              </p>
      
              {/* Google Login Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => alert("🌐 Google login coming soon!")}
                className="mt-6 w-full flex items-center justify-center gap-3 bg-white border border-sky-200 rounded-full px-6 py-3 shadow-md hover:shadow-lg transition-all"
              >
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google logo"
                  className="w-5 h-5"
                />
                <span className="font-semibold text-slate-700">Login with Google</span>
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* ✅ SUCCESS MODAL */}
      {loginSuccess && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 150, damping: 10 }}
            className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-[90%] text-center border border-blue-100"
          >
            <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-r from-sky-100 to-indigo-100 flex items-center justify-center">
              <span className="text-5xl">✅</span>
            </div>
            <h2 className="text-2xl font-bold text-sky-800 mb-2">Login Successful!</h2>
            <p className="text-slate-600 mb-4">Welcome back to Snappcrop.</p>
            <p className="text-sm text-gray-500">
              Redirecting to home in {loginCountdown} seconds...
            </p>
          </motion.div>
        </div>
      )}

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
