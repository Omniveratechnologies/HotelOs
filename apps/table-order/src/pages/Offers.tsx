import { Gift } from "lucide-react";
import { BottomNav, PageHeader } from "../components/Layout";

export default function Offers() {
  return (
    <main className="page with-nav">
      <PageHeader title="Offers" />
      <section className="placeholder-page">
        <Gift size={30} />
        <span className="eyebrow">COMING SOON</span>
        <h1>
          Something special
          <br />
          <em>is on its way.</em>
        </h1>
        <p>Offers from this restaurant will appear here when available.</p>
      </section>
      <BottomNav />
    </main>
  );
}
