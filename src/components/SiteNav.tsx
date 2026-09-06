import Button from './Button';
import Wordmark from './Wordmark';
import { CONTACT_URL, SIGN_IN_URL, SIGN_UP_URL } from '../lib/links';

export default function SiteNav() {
  return (
    <nav className="site-nav" aria-label="Site">
      <a href="/" aria-label="Bloomed home" style={{ display: 'inline-flex' }}>
        <Wordmark size={23} />
      </a>
      <div className="site-nav-links">
        <a className="site-nav-link" href="#how-it-works">How it works</a>
        <a className="site-nav-link" href={CONTACT_URL}>Contact</a>
        <a className="site-nav-link" href={SIGN_IN_URL}>Sign in</a>
        <Button size="nav" href={SIGN_UP_URL}>Start free</Button>
      </div>
    </nav>
  );
}
