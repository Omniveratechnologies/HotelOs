import { Plus, ShoppingBag } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import {
  BottomNav,
  formatMoney,
  PageHeader,
  useMenu,
} from "../components/Layout";
import { useCart } from "../context/CartContext";

export default function CategoryItems() {
  const { category = "", hotelId, tableId } = useParams();
  const menu = useMenu();
  const { addItem, itemCount } = useCart();
  const decoded = decodeURIComponent(category);
  const source = menu.filter(
    (item) => (item.category || "General") === decoded,
  );
  const dietaryAvailable = source.some(
    (item) =>
      item.isVeg != null ||
      item.isVegetarian != null ||
      item.isJain != null ||
      item.dietaryType ||
      item.foodType ||
      item.type,
  );
  const [filter, setFilter] = useState("All");
  const items = source.filter(
    (item) => filter === "All" || dietaryMatches(item, filter),
  );
  const base = `/${hotelId}/table/${tableId}`;
  return (
    <main className="page with-nav">
      <PageHeader title={decoded} />
      <div className="category-heading">
        <span className="eyebrow">{source.length} DISHES</span>
        <h1>
          Made to be
          <br />
          <em>shared.</em>
        </h1>
      </div>
      {dietaryAvailable && (
        <div className="filter-row">
          {["All", "Veg", "Non-Veg", "Jain"].map((value) => (
            <button
              className={filter === value ? "active" : ""}
              key={value}
              onClick={() => setFilter(value)}
            >
              {value}
            </button>
          ))}
        </div>
      )}
      <div className="item-list">
        {items.map((item) => {
          const id = item.id ?? item._id ?? "";
          return (
            <Link
              className="food-row"
              key={id}
              to={`${base}/menu/${category}/${id}`}
            >
              <div className="food-thumb">
                {item.image ? (
                  <img src={item.image} alt="" />
                ) : (
                  <span>{item.name.charAt(0)}</span>
                )}
              </div>
              <div className="food-info">
                <h2>
                  <i
                    className={item.isVeg === false ? "nonveg-dot" : "veg-dot"}
                  />
                  {item.name}
                </h2>
                {item.description && <p>{item.description}</p>}
                <strong>{formatMoney(item.price)}</strong>
              </div>
              <button
                type="button"
                className="add-button"
                onClick={(event) => {
                  event.preventDefault();
                  addItem(item);
                }}
              >
                <Plus size={14} /> Add
              </button>
            </Link>
          );
        })}
      </div>
      {itemCount > 0 && (
        <Link to={`${base}/cart`} className="floating-cart">
          <ShoppingBag size={17} /> View cart <b>{itemCount}</b>
        </Link>
      )}
      <BottomNav />
    </main>
  );
}

function dietaryMatches(
  item: ReturnType<typeof useMenu>[number],
  filter: string,
) {
  const value =
    `${item.dietaryType ?? item.foodType ?? item.type ?? ""}`.toLowerCase();
  if (filter === "Jain") return item.isJain === true || value.includes("jain");
  if (filter === "Veg")
    return (
      item.isVeg === true ||
      item.isVegetarian === true ||
      (value.includes("veg") && !value.includes("non"))
    );
  return (
    item.isVeg === false ||
    item.isVegetarian === false ||
    value.includes("non-veg") ||
    value.includes("nonveg")
  );
}
