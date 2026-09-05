import Wordmark from './Wordmark';
import { CONTACT_URL, PRIVACY_URL, TERMS_URL } from '../lib/links';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-left">
        <Wordmark size={16} />
        <span className="site-footer-rule" />
        <span>Made in Melbourne, Australia</span>
      </div>
      <div className="site-footer-links">
        <a href={PRIVACY_URL}>Privacy Policy</a>
        <a href={TERMS_URL}>Terms of Service</a>
        <a href={CONTACT_URL}>Contact Us</a>
        <span style={{ color: 'var(--ink-faint)' }}>&copy; {new Date().getFullYear()} Bloomed</span>
      </div>
    </footer>
  );
}
