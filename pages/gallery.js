import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import styles from '../styles/Home.module.css';

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
          .order('created_at', { ascending: false });

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
    <div className={styles.container}>
      <h1>Photo Gallery</h1>
      <p>View recently processed passport photos.</p>
      {loading && <p>Loading...</p>}
      {error && <p className={styles.message}>{error}</p>}
      {!loading && !error && photos.length === 0 && (
        <p>No photos found. Upload a selfie to get started!</p>
      )}
      {photos.length > 0 && (
        <ul className={styles.gallery}>
          {photos.map((photo) => (
            <li key={photo.filename} className={styles.galleryItem}>
              <span>{photo.filename}</span>
              <span>
                {new Date(photo.created_at).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
