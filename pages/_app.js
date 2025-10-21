import '../styles/globals.css'; // Global CSS import allowed here
import Link from 'next/link';

export default function App({ Component, pageProps }) {
  return (
    <div>
      <nav className="nav">
        <Link href="/" className="nav-link">Home</Link>
        <Link href="/about" className="nav-link">About</Link>
        <Link href="/gallery" className="nav-link">Gallery</Link>
      </nav>
      <Component {...pageProps} />
    </div>
  );
}
