import styles from '../styles/Home.module.css';

export default function About() {
  return (
    <div className={styles.container}>
      <h1>About Snappcrop</h1>
      <p>
        Snappcrop is a simple web app that lets you create passport photos from a selfie in just a few clicks. Upload your photo, crop it to the right size, and download a high-quality image that meets passport requirements.
      </p>
      <h2>Features</h2>
      <ul>
        <li>Easy selfie upload from your phone or computer.</li>
        <li>Automatic cropping to standard passport photo sizes (e.g., 2x2 inches).</li>
        <li>Secure storage and processing with Supabase.</li>
        <li>Future updates: Background removal, compliance checks, and print options.</li>
      </ul>
      <p>
        Built with love by the Snappcrop team. Have feedback? Share it on{' '}
        <a href="https://x.com" target="_blank" rel="noopener noreferrer">
          X
        </a>
        {' '}using #Snappcrop!
      </p>
    </div>
  );
}
