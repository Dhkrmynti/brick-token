import { XLogo, TelegramLogo } from "@phosphor-icons/react/dist/ssr";
import { TOKEN } from "@/lib/config";
import { Wordmark } from "./Wordmark";

function Social({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  if (!href) {
    return (
      <span className="social social--soon" aria-label={`${label} link coming at launch`}>
        {children}
        <span>{label}</span>
        <small>soon</small>
      </span>
    );
  }
  return (
    <a className="social" href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <span>{label}</span>
    </a>
  );
}

export function BoxBack() {
  return (
    <footer className="back" aria-labelledby="back-title">
      <div className="back__inner">
        <div className="back__brand">
          <Wordmark className="back__wordmark" />
          <h2 id="back-title" className="back__title">
            Collect the set. Watch it shrink.
          </h2>
          <div className="back__socials">
            <Social href={TOKEN.socials.x} label="X">
              <XLogo size={22} weight="bold" />
            </Social>
            <Social href={TOKEN.socials.telegram} label="Telegram">
              <TelegramLogo size={22} weight="bold" />
            </Social>
          </div>
        </div>

        <p className="back__legal">
          $BRICK is an independent community token. It is not affiliated with, endorsed by, or sponsored by any toy
          company. Launched on Pons, {TOKEN.chain}.
        </p>
      </div>
    </footer>
  );
}
