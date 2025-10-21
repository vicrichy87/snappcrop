import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
// Removed: import styles from '../styles/globals.css';
import Image from 'next/image';
import logo from '../public/logo.png';

export default function Gallery() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPhotos() {
      try {
        const { data, error } = await supabase
          .from('photos')
          .select('filename, created_at')
          .order('created_at', { ascending: false});

        if (error) throw error;
        setPhotos(data);
      } catch (err) {
        setError('Failed to load gallery. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchPhotos();
  }, []);

  return (
    <div className="container">
      <div className="banner">
        <Image src={logo} alt="Snappcrop Logo" width={200} height={100} />
        <h1 className="bannerTitle">Snappcrop</h1>
      </div>
      <p className="subtitle">View your recently processed passport photos.</p>
      {loading && <p>Loading...</p>}
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
