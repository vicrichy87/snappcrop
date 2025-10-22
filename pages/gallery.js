import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Image from 'next/image';
import logo from '../public/logo.png';

export default function Gallery() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const session = await getSession();
      if (!session) {
        router.push('/login');
      } else {
        fetchPhotos();
      }
    };

    checkAuth();
  }, [router]);

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('filename, created_at')
        .eq('user_id', (await getSession())?.user.id) // Filter by current user
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPhotos(data);
    } catch (err) {
      setError('Failed to load gallery. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="container">
      <div className="banner">
        <Image src={logo} alt="Snappcrop Logo" width={200} height={100} />
        <h1 className="bannerTitle">Snappcrop</h1>
      </div>
      <p className="subtitle">View your recently processed passport photos.</p>
      {error && <p className="message">{error}</p>}
      {!loading && !error && photos.length === 0 && (
        <p>No photos found. Upload a selfie to get started!</p>
      )}
      {photos.length > 0 && (
        <div className="galleryGrid">
          {photos.map((photo) => {
            const imageUrl = supabase.storage
              .from('passport-photos')
              .getPublicUrl(photo.filename).data.publicUrl;
            return (
              <div key={photo.filename} className="galleryItem">
                <Image
                  src={imageUrl}
                  alt={`Passport photo ${photo.filename}`}
                  width={150}
                  height={150}
                  className="thumbnail"
                />
                <p>{new Date(photo.created_at).toLocaleDateString()}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Reuse getSession from _app.js
import { getSession } from './_app';
