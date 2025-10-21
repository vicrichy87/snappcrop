// Removed: import styles from '../styles/globals.css';
import Image from 'next/image';
import logo from '../public/logo.png';

export default function About() {
  return (
    <div className="container">
      <div className="banner">
        <Image src={logo} alt="Snappcrop Logo" width={200} height={100} />
        <h1 className="bannerTitle">Snappcrop</h1>
      </div>
      <p className="subtitle">Learn more about our passport photo service.</p>
      <p>
        Snappcrop is a simple web app that lets you create passport photos from a selfie in just a few clicks. Upload your photo, crop it to the right size, and download a high-quality image that meets passport requirements.
      </p>
      <h2>Features</h2>
      <ul>
        <li>Easy selfie upload from your phone or computer.</li>
        <li>Automatic face detection and cropping to standard passport sizes (e.g., 2x2 inches).</li>
        <li>Background removal with a plain white option.</li>
        <li>Secure storage and processing with Supabase.</li>
        <li>Future updates: Multi-country compliance checks and print options.</li>
      </ul>
      <p>
        Built with love by the Snappcrop team. Have feedback? Share it on{' '}
        <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="link">
          X
        </a>
        {' '}using #Snappcrop!
      </p>
    </div>
  );
}
