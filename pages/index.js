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

      {/* Hero Section */}
      <section className="text-center pt-32 pb-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex justify-center mb-6"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-blue-400 rounded-3xl blur-3xl opacity-40 animate-pulse-slow"></div>
            <Image
              src={logo}
              alt="Snappcrop Logo"
              width={100}
              height={100}
              className="relative rounded-3xl shadow-2xl"
              priority
            />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 text-transparent bg-clip-text animate-gradient"
        >
          Snap. Crop. Perfect.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.9 }}
          className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto"
        >
          Instantly turn your selfie into a professional passport photo.
          Powered by AI — ready in seconds.
        </motion.p>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="mt-8 inline-flex items-center gap-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold px-6 py-3 rounded-full shadow-lg cursor-pointer transition"
          onClick={triggerFile}
        >
          <FaCamera className="text-2xl animate-pulse" />
          <span>Try Snappcrop Now</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
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
