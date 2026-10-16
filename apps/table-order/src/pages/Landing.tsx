import { useEffect, useState } from "react";
import {
  ArrowRight,
  Leaf,
  Menu as MenuIcon,
  Sparkles,
  Utensils,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";
import { useCart } from "../context/CartContext";
import { useMenu } from "../components/Layout";
import type { TableDetails } from "../types";

export default function Landing() {
  const { hotelId = "", tableId = "" } = useParams();
  const { setTableNumber } = useCart();
  const menu = useMenu();
  const [table, setTable] = useState<TableDetails | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getTable(hotelId, tableId)
      .then((t) => {
        setTable(t);
        setTableNumber(t.tableNumber);
      })
      .catch((error: Error) => setError(error.message));
  }, [hotelId, tableId, setTableNumber]);

  if (error)
    return (
      <main className="page landing">
        <section className="error-panel">
          <Utensils size={34} />
          <h1>We couldn't find this table</h1>
          <p>{error}. Please scan the table QR code again.</p>
        </section>
      </main>
    );
  if (!table)
    return <main className="page loading">Checking your table...</main>;

  const heroImage = menu.find((item) => item.image)?.image;
  const heroStyle = heroImage
    ? {
        backgroundImage: `linear-gradient(110deg, rgba(18,45,33,.97) 0%, rgba(18,45,33,.72) 46%, rgba(18,45,33,.18) 100%), url("${heroImage}")`,
      }
    : undefined;

  return (
    <main className="page landing">
      <section className="landing-hero" style={heroStyle}>
        <header className="brand-bar">
          <div className="brand-mark">
            <Leaf size={17} />
            <span>
              Spice &amp; Soul<small>RESTAURANT</small>
            </span>
          </div>
          <span className="language">EN</span>
          <MenuIcon size={18} />
        </header>
        <div className="table-label">
          <Utensils size={14} /> {table.section || "Dining room"} · Table{" "}
          {table.tableNumber}
        </div>
        <div className="hero-copy-wrap">
          <p className="kicker">WELCOME TO THE TABLE</p>
          <h1>
            Good Food
            <br />
            <em>
              Brings People
              <br />
              Together
            </em>
          </h1>
          <p className="hero-copy">
            Discover our carefully crafted menu and enjoy a delightful dining
            experience.
          </p>
          <Link className="button primary hero-button" to="menu">
            View Our Menu <ArrowRight size={18} />
          </Link>
        </div>
      </section>
      <section className="trust">
        <div>
          <Leaf size={18} />
          <small>
            Pure Veg
            <br />
            Options
          </small>
        </div>
        <div>
          <Sparkles size={18} />
          <small>
            Fresh
            <br />
            Ingredients
          </small>
        </div>
        <div>
          <Utensils size={18} />
          <small>
            Hygienic
            <br />
            Kitchen
          </small>
        </div>
      </section>
      <div className="landing-strip">Scan · Explore · Order · Enjoy</div>
    </main>
  );
}
