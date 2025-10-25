import { motion } from "framer-motion";
import Image from "next/image";
import logo from "../public/logo.png";

export default function About() {
  return (
    <main className="relative min-h-screen bg-gradient-to-b from-sky-50 via-white to-blue-100 overflow-hidden">
      {/* Animated background gradients */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-0 left-0 w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-200 via-transparent to-transparent opacity-40 animate-wave-slow"></div>
        <div className="absolute bottom-0 right-0 w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-200 via-transparent to-transparent opacity-40 animate-wave-fast"></div>
      </div>

      {/* Header */}
      <section className="w-full max-w-5xl mx-auto px-6 lg:px-12 py-16 text-center">
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
      `}</style>
    </main>
  );
}
