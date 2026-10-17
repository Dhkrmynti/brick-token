import { Nav } from "@/components/Nav";
import { BoxOpen } from "@/components/BoxOpen";
import { Story } from "@/components/Story";
import { Ledger } from "@/components/Ledger";
import { Contents } from "@/components/Contents";
import { HowToBuy } from "@/components/HowToBuy";
import { BoxBack } from "@/components/BoxBack";
import { EngineProvider } from "@/components/Engine";

export default function Home() {
  return (
    <EngineProvider>
      <a className="skip" href="#story">
        Skip to the story
      </a>
      <Nav />
      <main id="main">
        <BoxOpen />
        <Story />
        <Ledger />
        <Contents />
        <HowToBuy />
      </main>
      <BoxBack />
    </EngineProvider>
  );
}
