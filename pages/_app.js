import '../styles/globals.css'; // Global CSS import
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

function App({ Component, pageProps }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const session = await getSession();
      setUser(session?.user || null);
    };
    checkUser();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <div>
      <nav className="nav">
        <Link href="/" className="nav-link">Home</Link>
        <Link href="/about" className="nav-link">About</Link>
        {user ? (
          <>
            <Link href="/gallery" className="nav-link">Gallery</Link>
            <a href="#" onClick={handleLogout} className="nav-link">Logout</a>
          </>
        ) : (
          <Link href="/login" className="nav-link">Login/Signup</Link>
        )}
      </nav>
      <Component {...pageProps} />
    </div>
  );
}

// Export getSession for use in other components
export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
};

export default App;
