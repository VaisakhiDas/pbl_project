import { useNavigate } from "react-router-dom";
import { Sun, Home, Store, ShieldCheck, FileCheck2, Leaf, ArrowRight } from "lucide-react";
import { useWallet } from "../context/WalletContext";
import WalletButton from "../components/WalletButton";

export default function Landing() {
  const navigate = useNavigate();
  const { account } = useWallet();

  return (
    <div className="min-h-screen bg-paper-100">
      <header className="flex h-16 items-center justify-between border-b border-ink-200 px-6">
        <div className="flex items-center gap-2">
          <Leaf size={19} className="text-forest-600" />
          <span className="text-[15px] font-semibold tracking-tight text-ink-900">GridSwap</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/marketplace")}
            className="hidden text-sm text-ink-600 hover:text-ink-900 sm:block"
          >
            Marketplace
          </button>
          <WalletButton />
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pb-14 pt-16 sm:pt-20">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-forest-200 bg-forest-50 px-2.5 py-1 text-xs font-medium text-forest-700">
              <span className="h-1.5 w-1.5 rounded-full bg-forest-500" />
              Running on a local Hardhat network
            </p>
            <h1 className="text-3xl font-semibold leading-tight text-ink-900 sm:text-4xl">
              Trade renewable energy directly with your community
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-600">
              GridSwap is a peer-to-peer marketplace where households with surplus solar energy
              sell directly to neighbors who need it. Smart contracts record and settle every
              trade on-chain.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              {!account ? (
                <WalletButton />
              ) : (
                <button
                  onClick={() => navigate("/dashboard")}
                  className="inline-flex items-center gap-2 rounded-md bg-forest-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-forest-700"
                >
                  Go to Dashboard <ArrowRight size={15} />
                </button>
              )}
              <button
                onClick={() => navigate("/marketplace")}
                className="inline-flex items-center gap-2 rounded-md border border-ink-300 px-4 py-2.5 text-sm font-medium text-ink-700 hover:border-ink-400"
              >
                Explore Marketplace
              </button>
            </div>
          </div>

          <FlowDiagram />
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-ink-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <h2 className="text-lg font-semibold text-ink-900">Built for transparent settlement</h2>
          <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2">
            <Feature
              icon={Home}
              title="Peer-to-Peer Trading"
              description="Producers list surplus energy directly; consumers buy from listings that fit their needs and budget."
            />
            <Feature
              icon={ShieldCheck}
              title="Blockchain Transparency"
              description="Every offer and trade is recorded on-chain, giving both sides a tamper-resistant record of what happened."
            />
            <Feature
              icon={FileCheck2}
              title="Smart Contract Settlement"
              description="Payment and energy accounting are enforced by the contract itself — no manual reconciliation."
            />
            <Feature
              icon={Sun}
              title="Renewable Energy Marketplace"
              description="Built around solar surplus first, with room to extend to other distributed generation sources."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-6 py-14">
        <h2 className="text-lg font-semibold text-ink-900">How it works</h2>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-4">
          <Step number="1" title="Generate" description="Producer generates surplus renewable energy from rooftop solar." />
          <Step number="2" title="List" description="Producer lists the surplus on GridSwap with a price per kWh." />
          <Step number="3" title="Trade" description="Consumer browses the marketplace and purchases available energy." />
          <Step number="4" title="Settle" description="The smart contract records the trade and settles payment automatically." />
        </div>
      </section>

      <footer className="border-t border-ink-200 px-6 py-8">
        <p className="mx-auto max-w-5xl text-xs leading-relaxed text-ink-400">
          GridSwap simulates energy trading and blockchain-based settlement for a university
          project. It does not physically control or transfer electricity — power still flows
          through the existing grid. A real deployment would require integration with smart
          meters, utilities, and regulatory approval.
        </p>
      </footer>
    </div>
  );
}

function Feature({ icon: Icon, title, description }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded bg-forest-100 text-forest-600">
        <Icon size={15} />
      </div>
      <div>
        <p className="text-sm font-medium text-ink-900">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-ink-500">{description}</p>
      </div>
    </div>
  );
}

function Step({ number, title, description }) {
  return (
    <div className="border-t-2 border-forest-500 pt-3">
      <span className="font-mono text-xs text-ink-400">{number}</span>
      <p className="mt-1 text-sm font-medium text-ink-900">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-ink-500">{description}</p>
    </div>
  );
}

function FlowDiagram() {
  return (
    <div className="rounded-md border border-ink-200 bg-white p-6">
      <div className="flex items-center justify-between gap-2">
        <NodeBox icon={Sun} label="Solar Producer" />
        <div className="h-px flex-1 border-t border-dashed border-ink-300" />
        <NodeBox icon={Leaf} label="GridSwap" accent />
        <div className="h-px flex-1 border-t border-dashed border-ink-300" />
        <NodeBox icon={Store} label="Consumer" />
      </div>
      <p className="mt-5 text-center text-xs leading-relaxed text-ink-500">
        Energy still flows through the physical grid. GridSwap records who sold what to whom,
        and settles payment on-chain.
      </p>
    </div>
  );
}

function NodeBox({ icon: Icon, label, accent }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-md ${
          accent ? "bg-forest-600 text-white" : "bg-ink-100 text-ink-500"
        }`}
      >
        <Icon size={18} />
      </div>
      <span className="text-center text-[11px] text-ink-500">{label}</span>
    </div>
  );
}
