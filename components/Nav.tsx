import { BuyLink } from "./BuyLink";
import { ClickSounds, SoundToggle } from "./Sound";
import { WalletButton } from "./WalletButton";

const LINKS = [
  { href: "#story", label: "Story" },
  { href: "#burns", label: "Burns" },
  { href: "#contents", label: "Contents" },
  { href: "#how-to-buy", label: "How to buy" },
];

export function Nav() {
  return (
    <header className="nav">
      <a className="nav__logo" href="#top" aria-label="$BRICK home">
        <svg viewBox="0 0 44 30" aria-hidden="true">
          <rect x="7" y="2" width="11" height="7" rx="2" fill="#ffd75e" />
          <rect x="26" y="2" width="11" height="7" rx="2" fill="#ffd75e" />
          <rect x="1" y="7" width="42" height="22" rx="4" fill="#f7bb22" />
          <rect x="1" y="23" width="42" height="6" rx="3" fill="#c98d08" />
        </svg>
        <span className="nav__logo-text">$BRICK</span>
      </a>
      <nav aria-label="Sections">
        <ul className="nav__links">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href}>{l.label}</a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="nav__actions">
        <WalletButton />
        <SoundToggle />
        <BuyLink className="brick-btn--sm" />
      </div>
      <ClickSounds />
    </header>
  );
}
