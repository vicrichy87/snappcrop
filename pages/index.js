// pages/index.js
import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Cropper from "react-easy-crop";
import { motion } from "framer-motion";
import {
  FaCamera,
  FaCloudUploadAlt,
  FaMagic,
  FaDownload,
} from "react-icons/fa";
import logo from "../public/logo.png";
import { supabase } from "../lib/supabase";
import { getSession } from "./_app";
import Lottie from "lottie-react";
import aiTransform from "../public/ai-transform.json"; // you'll add this next

export default function Home() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [isBgRemoved, setIsBgRemoved] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const inputRef = useRef(null);

  const onCropComplete = useCallback((_, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setMessage("");
    setIsBgRemoved(false);
    setDownloadUrl(null);
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(f);
  };

  const triggerFile = () => inputRef.current?.click();

  const handleRemoveBackground = async () => {
    if (!file || !previewUrl) return setMessage("Please upload a selfie first.");
    setLoading(true);
    setMessage("Removing background...");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/remove-bg", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Error");
      setPreviewUrl(data.url);
      setIsBgRemoved(true);
      setMessage("Background removed successfully!");
    } catch {
      setMessage("Failed to remove background. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCropAndSave = async () => {
    if (!croppedAreaPixels || !previewUrl)
      return setMessage("Please crop your image first.");
    setLoading(true);
    setMessage("Processing...");

    try {
      const img = new Image();
      img.src = previewUrl;
      await new Promise((r) => (img.onload = r));
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = 600;
      canvas.height = 600;
      ctx.drawImage(
        img,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        600,
        600
      );
      const blob = await new Promise((r) =>
        canvas.toBlob(r, "image/jpeg", 0.95)
      );
      const fd = new FormData();
      fd.append("file", blob, `snappcrop-${Date.now()}.jpg`);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Upload failed");

      const session = await getSession();
      if (session?.user?.id) {
        await supabase.from("photos").insert({
          user_id: session.user.id,
          filename: data.url.split("/").pop(),
        });
      }

      setDownloadUrl(data.url);
      setMessage("Saved successfully!");
    } catch {
      setMessage("Error saving image.");
    } finally {
      setLoading(false);
    }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8 } },
  };

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-sky-50 via-white to-blue-100 overflow-hidden">
      {/* Animated gradient waves */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-0 left-0 w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-200 via-transparent to-transparent opacity-40 animate-wave-slow"></div>
        <div className="absolute bottom-0 right-0 w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-200 via-transparent to-transparent opacity-40 animate-wave-fast"></div>
      </div>

      {/* NAV / HERO */}
      <section className="w-full max-w-6xl px-6 lg:px-12 py-10 flex flex-col md:flex-row items-center justify-between gap-10">
        {/* Left side — Logo and text */}
        <div className="flex flex-col items-start gap-5 text-left max-w-2xl">
          {/* Enlarged logo with glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 90, damping: 10 }}
            className="flex items-center gap-4"
          >
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden shadow-2xl border border-sky-100 hover:scale-105 hover:shadow-sky-200 transition duration-300 ease-in-out">
              <Image
                src={logo}
                alt="Snappcrop Logo"
                fill
                className="object-contain brightness-110"
                priority
              />
            </div>
            <h1 className="text-5xl sm:text-6xl font-extrabold text-sky-800 tracking-tight">
              Snappcrop
            </h1>
          </motion.div>
      
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="text-lg sm:text-xl text-slate-600 leading-relaxed"
          >
            Transform your selfie into a perfect passport photo — smart cropping, background cleanup, and official dimensions in seconds.
          </motion.p>
      
          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="flex flex-col sm:flex-row flex-wrap items-center justify-start sm:justify-start gap-3 sm:gap-4 mt-6 w-full"
          >
            {/* Try It Now Button */}
            <button
              onClick={triggerFile}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 w-full sm:w-auto bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-semibold rounded-full shadow-md transition-all transform hover:-translate-y-0.5 text-sm sm:text-base"
            >
              <FaCloudUploadAlt /> Try It Now
            </button>
          
            {/* About Button */}
            <a
              href="/about"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 w-full sm:w-auto bg-white text-sky-700 border border-sky-200 rounded-full font-semibold shadow-sm hover:shadow-md hover:bg-sky-50 transition-all text-sm sm:text-base"
            >
              About
            </a>
          
            {/* Gallery Button */}
            <a
              href="/gallery"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 w-full sm:w-auto bg-white text-sky-700 border border-sky-200 rounded-full font-semibold shadow-sm hover:shadow-md hover:bg-sky-50 transition-all text-sm sm:text-base"
            >
              Gallery
            </a>
          </motion.div>
        </div>
      
        {/* Right side — animated hero visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative w-full max-w-[420px] aspect-[16/10] bg-gradient-to-br from-white to-sky-50 rounded-3xl shadow-2xl border border-sky-100 overflow-hidden flex items-center justify-center"
        >
          {/* decorative blobs */}
          <div className="absolute -left-8 -top-8 w-48 h-48 bg-sky-200/60 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute -right-8 -bottom-8 w-56 h-56 bg-indigo-200/40 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
                            
          {/* Hero Animation */}
          <div className="relative w-[260px] sm:w-[320px] md:w-[360px] h-[380px] bg-white rounded-3xl shadow-xl border border-sky-100 overflow-hidden">
            {/* Base image (selfie) */}
            <Image
              src="/demo-selfie.png"
              alt="Snappcrop Selfie Preview"
              fill
              className="object-cover"
              priority
            />
          
            {/* Lottie gradient sweep overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-transparent"
            >
              <Lottie
                animationData={aiTransform}
                loop={true}
                autoplay={true}
                className="w-full h-full opacity-90 mix-blend-overlay"
              />
            </motion.div>
          
            {/* Glass caption overlay */}
            <div className="absolute bottom-0 w-full text-center bg-white/70 backdrop-blur-md py-3 border-t border-sky-100">
              <p className="text-sm text-slate-600 font-medium">
                AI-powered transformation in seconds
              </p>
            </div>
          </div>

        </motion.div>
      </section>

      {/* Upload & Crop Section */}
      <motion.section
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.15 } } }}
        className="relative z-10 flex flex-col items-center px-6 pb-24"
      >
        <motion.div
          variants={fadeUp}
          className="w-full max-w-3xl bg-white/80 backdrop-blur-md border border-blue-100 rounded-3xl shadow-2xl p-8 text-center"
        >
          {!previewUrl ? (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-sky-200 rounded-2xl bg-sky-50/40">
              <FaCloudUploadAlt className="text-5xl text-sky-600 mb-3 animate-bounce" />
              <p className="text-sky-700 font-medium">
                Upload your selfie to get started
              </p>
            </div>
          ) : (
            <>
              <div className="relative w-full h-[400px] rounded-2xl overflow-hidden border border-blue-100">
                <Cropper
                  image={previewUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  showGrid={false}
                />
              </div>

              <div className="flex justify-center gap-4 flex-wrap mt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={handleRemoveBackground}
                  disabled={loading}
                  className={`px-6 py-3 rounded-full font-semibold text-white shadow-md transition ${
                    isBgRemoved
                      ? "bg-emerald-500 hover:bg-emerald-600"
                      : "bg-sky-600 hover:bg-sky-700"
                  }`}
                >
                  <FaMagic className="inline mr-2" />
                  {isBgRemoved ? "Background Removed" : "Remove Background"}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={handleCropAndSave}
                  disabled={loading}
                  className="px-6 py-3 rounded-full font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md"
                >
                  <FaDownload className="inline mr-2" /> Crop & Save
                </motion.button>
              </div>
            </>
          )}

          {downloadUrl && (
            <motion.a
              whileHover={{ scale: 1.05 }}
              href={downloadUrl}
              download
              className="block mt-8 text-center bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-full font-semibold shadow-lg"
            >
              Download Passport Photo
            </motion.a>
          )}
          {message && (
            <p className="mt-4 text-sm text-gray-600 italic">{message}</p>
          )}
        </motion.div>
      </motion.section>

      {/* Live Demo Section */}
      <section className="relative z-10 text-center pb-32">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-4xl font-extrabold text-sky-800 mb-12"
        >
          See Snappcrop in Action
        </motion.h2>
      
        <div className="relative w-[280px] sm:w-[320px] md:w-[360px] mx-auto aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border border-blue-100">
          {/* Animated Crossfade */}
          <motion.div
            key={previewUrl ? "after" : "before"}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <Image
              src="/demo-selfie.png"
              alt="Before - Selfie"
              fill
              className="object-cover brightness-95 transition-all duration-[3000ms] ease-in-out animate-fadeIn"
            />
          </motion.div>
      
          {/* Overlaying the Passport Image (fades in/out) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0, 1, 1, 0], scale: [1, 1.05, 1] }}
            transition={{
              duration: 8,
              repeat: Infinity,
              repeatType: "loop",
              ease: "easeInOut",
            }}
            className="absolute inset-0"
          >
            <Image
              src="/demo-passport.png"
              alt="After - Passport Photo"
              fill
              className="object-cover brightness-100 transition-all duration-700 ease-in-out"
            />
          </motion.div>
        </div>
      
        <p className="mt-6 text-gray-600 text-sm max-w-lg mx-auto">
          Watch how Snappcrop automatically transforms your selfie into a passport-ready photo.
        </p>
      </section>
      
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0.8;
            transform: scale(1.03);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 2s ease-in-out;
        }
      `}</style>
    </main>
  );
}
