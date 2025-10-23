// pages/gallery.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import logo from "../public/logo.png";
import { supabase } from "../lib/supabase";
import { getSession } from "../lib/session"; // ✅ Only one import — from lib/session

export default function Gallery() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const session = await getSession();
      if (!session) {
        router.push("/login");
      } else {
        fetchPhotos(session.user.id);
      }
    };
    checkAuth();
  }, [router]);

  const fetchPhotos = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("photos")
        .select("filename, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPhotos(data);
    } catch (err) {
      setError("Failed to load gallery. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="text-center mt-10 text-gray-600">Loading...</p>;

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="flex flex-col items-center mb-8">
        <Image src={logo} alt="Snappcrop Logo" width={160} height={80} />
        <h1 className="text-4xl font-extrabold text-sky-700 mt-4">Snappcrop Gallery</h1>
        <p className="text-gray-500 mt-2">Your recently processed passport photos</p>
      </div>

      {error && <p className="text-center text-red-500">{error}</p>}
      {!loading && !error && photos.length === 0 && (
        <p className="text-center text-gray-600">
          No photos found. Upload a selfie to get started!
        </p>
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {photos.map((photo) => {
            const imageUrl = supabase.storage
              .from("passport-photos")
              .getPublicUrl(photo.filename).data.publicUrl;

            return (
              <div
                key={photo.filename}
                className="rounded-xl overflow-hidden shadow-lg bg-white p-3 border border-sky-100 text-center hover:shadow-xl transition"
              >
                <Image
                  src={imageUrl}
                  alt={`Passport photo ${photo.filename}`}
                  width={200}
                  height={200}
                  className="rounded-lg object-cover mx-auto"
                />
                <p className="mt-2 text-sm text-gray-500">
                  {new Date(photo.created_at).toLocaleDateString()}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
