import Button from './Button';
import SiteFooter from './SiteFooter';
import Skyline from './Skyline';
import { SIGN_UP_URL } from '../lib/links';

export default function ClosingCta() {
  return (
    <section className="closing">
      <h2 className="closing-title">Twenty questions is enough to draw your first map.</h2>
      <p className="closing-body" style={{ margin: 0 }}>See exactly where you stand. Get exactly what you need to succeed.</p>
      <Button icon="arrow-right" href={SIGN_UP_URL} style={{ marginTop: 8 }}>Start free</Button>
      <Skyline />
      <SiteFooter />
    </section>
  );
}
