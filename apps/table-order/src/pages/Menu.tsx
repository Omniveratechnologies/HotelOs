import {
  Search,
  ChevronRight,
  Leaf,
  Menu as MenuIcon,
  Utensils,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { BottomNav, useMenu } from "../components/Layout";
import { useCart } from "../context/CartContext";
import type { OrderType } from "../types";

export default function Menu() {
  const menu = useMenu();
  const { hotelId, tableId } = useParams();
  const { orderType, setOrderType } = useCart();
  const [search, setSearch] = useState("");
  const filtered = menu.filter((item) =>
    `${item.name} ${item.category ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const categories = [
    ...new Set(filtered.map((item) => item.category || "General")),
  ];
  const base = `/${hotelId}/table/${tableId}`;
  return (
    <main className="page with-nav">
      <header className="menu-top">
        <div className="brand-inline">
          <LeafMark />
          <strong>
            Spice &amp; Soul<small>RESTAURANT</small>
          </strong>
        </div>
        <Link
          className="menu-icon"
          to={`${base}/assistance`}
          aria-label="Assistance"
        >
          <MenuIcon size={18} />
        </Link>
      </header>
      <div className="order-toggle">
        {(
          [
            ["DINE_IN", "Dine In"],
            ["TAKEAWAY", "Takeaway"],
            ["DELIVERY", "Delivery"],
          ] as [OrderType, string][]
        ).map(([value, label]) => (
          <button
            className={orderType === value ? "active" : ""}
            key={value}
            onClick={() => setOrderType(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <label className="search">
        <Search size={16} />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search for dishes..."
        />
      </label>
      <div className="section-title">
        <span>POPULAR CATEGORIES</span>
        <small>{filtered.length} items</small>
      </div>
      <div className="category-list">
        {categories.map((category) => {
          const categoryItem = filtered.find(
            (item) => (item.category || "General") === category,
          );
          return (
            <Link
              key={category}
              to={`${base}/menu/${encodeURIComponent(category)}`}
              className="category-card"
              style={
                categoryItem?.image
                  ? {
                      backgroundImage: `linear-gradient(180deg, rgba(21,40,29,.05), rgba(21,40,29,.9)), url("${categoryItem.image}")`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : undefined
              }
            >
              <div className="category-image">
                {categoryItem?.image ? (
                  <img src={categoryItem.image} alt="" />
                ) : (
                  <Utensils size={27} />
                )}
              </div>
              <div>
                <strong>{category}</strong>
                <small>
                  {
                    filtered.filter(
                      (item) => (item.category || "General") === category,
                    ).length
                  }{" "}
                  items
                </small>
              </div>
              <ChevronRight size={18} />
            </Link>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <p className="muted">No menu items match your search.</p>
      )}
      <BottomNav />
    </main>
  );
}

function LeafMark() {
  return <Leaf className="leaf-mark" size={21} />;
}
