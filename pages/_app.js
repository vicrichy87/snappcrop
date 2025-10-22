// pages/_app.js
import '../styles/globals.css';
import Navbar from '../components/Navbar';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Navbar />
      <main className="pt-20"> {/* pushes content below navbar */}
        <Component {...pageProps} />
      </main>
    </>
  );
}
