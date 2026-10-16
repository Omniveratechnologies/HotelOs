import { ArrowLeft, Heart, Minus, Plus, Share2 } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader, formatMoney, useMenu } from "../components/Layout";
import { useCart } from "../context/CartContext";

export default function ItemDetail() {
  const { itemId = "", category = "" } = useParams();
  const item = useMenu().find((entry) => (entry.id ?? entry._id) === itemId);
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState("");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  if (!item)
    return (
      <main className="page">
        <PageHeader title="Dish" />
        <section className="empty">
          <h2>Dish unavailable</h2>
          <p>This item is no longer on the menu.</p>
        </section>
      </main>
    );
  const addons = item.addons ?? [];
  const addonTotal = addons
    .filter((addon) => selectedAddons.includes(addon.name))
    .reduce((sum, addon) => sum + addon.price, 0);
  return (
    <main className="page detail-page">
      <header className="photo-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </button>
        <span />
        <div>
          <button aria-label="Add to favourites">
            <Heart size={18} />
          </button>
          <button
            aria-label="Share dish"
            onClick={() =>
              navigator.share?.({ title: item.name, text: item.description })
            }
          >
            <Share2 size={18} />
          </button>
        </div>
      </header>
      <div className="dish-photo">
        {item.image ? (
          <img src={item.image} alt={item.name} />
        ) : (
          <span>{item.name.charAt(0)}</span>
        )}
      </div>
      <article className="detail">
        <span className="eyebrow">
          {item.category || decodeURIComponent(category)}
        </span>
        <h1>{item.name}</h1>
        <div className="detail-meta">
          {item.rating != null && (
            <span>
              ★ {item.rating}
              {item.reviewCount != null && ` (${item.reviewCount})`}
            </span>
          )}
          <strong>{formatMoney(item.price)}</strong>
        </div>
        {item.description && (
          <p className="detail-description">{item.description}</p>
        )}
        {item.badge && <span className="badge">{item.badge}</span>}
        {addons.length > 0 && (
          <section className="addons">
            <h2>
              Add-ons <small>(Optional)</small>
            </h2>
            {addons.map((addon) => (
              <label key={addon.name}>
                <input
                  type="checkbox"
                  checked={selectedAddons.includes(addon.name)}
                  onChange={() =>
                    setSelectedAddons((current) =>
                      current.includes(addon.name)
                        ? current.filter((name) => name !== addon.name)
                        : [...current, addon.name],
                    )
                  }
                />
                <span>{addon.name}</span>
                <strong>+{formatMoney(addon.price)}</strong>
              </label>
            ))}
          </section>
        )}
        <label className="field-label">
          Special Instructions
          <textarea
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            placeholder="E.g. Less spicy, no onion, etc."
          />
        </label>
        <div className="detail-footer">
          <div className="quantity">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>
              <Minus size={16} />
            </button>
            <b>{quantity}</b>
            <button onClick={() => setQuantity(quantity + 1)}>
              <Plus size={16} />
            </button>
          </div>
          <button
            className="button primary"
            onClick={() => {
              addItem(
                item,
                quantity,
                instructions,
                addons.filter((addon) => selectedAddons.includes(addon.name)),
              );
              navigate("..");
            }}
          >
            Add to Cart{" "}
            <span>{formatMoney((item.price + addonTotal) * quantity)}</span>
          </button>
        </div>
      </article>
    </main>
  );
}
