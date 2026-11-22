import { UserRound } from "lucide-react";
import { BottomNav, PageHeader } from "../components/Layout";

export default function Profile() {
  return (
    <main className="page with-nav">
      <PageHeader title="Profile" />
      <section className="placeholder-page">
        <UserRound size={30} />
        <span className="eyebrow">YOUR VISIT</span>
        <h1>
          Welcome,
          <br />
          <em>guest.</em>
        </h1>
        <p>Your table order details and preferences will appear here.</p>
      </section>
      <BottomNav />
    </main>
  );
}
