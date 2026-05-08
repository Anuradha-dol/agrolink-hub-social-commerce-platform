import { useEffect, useMemo, useState } from "react";
import { marketplaceService } from "../services/marketplaceService";
import { orderService } from "/src/modules/business/order/services/orderService";
import LoadingState from "/src/modules/platform/common/components/LoadingState";
import ErrorState from "/src/modules/platform/common/components/ErrorState";
import EmptyState from "/src/modules/platform/common/components/EmptyState";
import { useToast } from "/src/modules/platform/common/hooks/useToast";
import { toMediaUrl } from "/src/modules/platform/common/utils/mediaUrl";

export default function MarketplacePage() {
  const { pushToast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [wishlist, setWishlist] = useState([]);
  const [cart, setCart] = useState([]);

  const loadProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await marketplaceService.listProducts({ page: 0, size: 24, q: query || undefined, category: category || undefined });
      const payload = response?.data?.data?.content || [];
      setProducts(payload);
    } catch {
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const addToWishlist = (productId) => {
    setWishlist((prev) => (
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    ));
  };

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productId, nextQuantity) => {
    if (nextQuantity <= 0) {
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((item) => (
        item.product.id === productId
          ? { ...item, quantity: nextQuantity }
          : item
      ))
    );
  };

  const placeOrder = async (productId, quantity = 1) => {
    try {
      await orderService.createOrder({ productId, quantity });
      pushToast("Order placed successfully", "success");
    } catch {
      pushToast("Failed to place order", "error");
    }
  };

  const checkoutCart = async () => {
    if (cart.length === 0) return;
    try {
      await Promise.all(
        cart.map((item) => orderService.createOrder({
          productId: item.product.id,
          quantity: item.quantity
        }))
      );
      pushToast("Cart checkout completed", "success");
      setCart([]);
    } catch {
      pushToast("Failed to checkout cart", "error");
    }
  };

  const totalCartValue = useMemo(
    () =>
      cart.reduce((total, item) => total + Number(item.product.price || 0) * Number(item.quantity || 0), 0),
    [cart]
  );

  const categoryOptions = useMemo(
    () => [...new Set(products.map((item) => item.category).filter(Boolean))],
    [products]
  );

  const visibleProducts = useMemo(() => {
    let list = [...products];
    if (inStockOnly) {
      list = list.filter((item) => Number(item.stock || 0) > 0);
    }

    if (sortBy === "priceAsc") {
      list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sortBy === "priceDesc") {
      list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else if (sortBy === "name") {
      list.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
    } else {
      list.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
    }

    return list;
  }, [products, inStockOnly, sortBy]);

  if (loading) return <LoadingState text="Loading marketplace..." />;
  if (error) return <ErrorState message={error} onRetry={loadProducts} />;

  return (
    <div className="marketplace-page">
      <section className="page-hero">
        <div>
          <h2>Marketplace</h2>
          <p>Browse products, save favorites and place orders with a modern shopping flow.</p>
        </div>
        <div className="hero-stats">
          <article>
            <strong>{products.length}</strong>
            <span>Products</span>
          </article>
          <article>
            <strong>{wishlist.length}</strong>
            <span>Wishlist</span>
          </article>
          <article>
            <strong>{cart.reduce((total, item) => total + Number(item.quantity || 0), 0)}</strong>
            <span>Cart Items</span>
          </article>
        </div>
      </section>

      <section className="market-filter-bar">
        <h2>Product Discovery</h2>
        <div className="market-filter-grid">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products" />
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {categoryOptions.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="priceAsc">Price: Low to High</option>
            <option value="priceDesc">Price: High to Low</option>
            <option value="name">Name</option>
          </select>
          <button className="btn btn-primary" type="button" onClick={loadProducts}>
            Search
          </button>
        </div>

        <label className="muted" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(event) => setInStockOnly(event.target.checked)}
            style={{ width: "auto" }}
          />
          Show in-stock items only
        </label>
      </section>

      <section className="product-grid">
        {visibleProducts.length === 0 ? <EmptyState title="No products found" /> : null}
        {visibleProducts.map((product) => (
          <article key={product.id} className="card product-card">
            {product.imageUrl ? <img src={toMediaUrl(product.imageUrl)} alt={product.name} className="product-image" /> : null}
            <h3>{product.name}</h3>
            <p>{product.description || "No description"}</p>
            <div className="reaction-row">
              {product.category ? <span className="chip">{product.category}</span> : null}
              {product.businessPageName ? <span className="chip">{product.businessPageName}</span> : null}
            </div>
            <p className="price">${product.price}</p>
            <p className="muted">Stock: {product.stock}</p>
            <div className="row-actions">
              <button className="btn btn-secondary" type="button" onClick={() => addToWishlist(product.id)}>
                {wishlist.includes(product.id) ? "Saved" : "Save"}
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => addToCart(product)}>
                Add Cart
              </button>
              <button className="btn btn-primary" type="button" onClick={() => placeOrder(product.id, 1)}>
                Buy Now
              </button>
            </div>
          </article>
        ))}
      </section>

      <section className="market-cart-summary">
        <h3>Cart Summary</h3>
        <ul className="simple-list">
          {cart.map((item) => (
            <li key={item.product.id} className="user-row">
              <div>
                <strong>{item.product.name}</strong>
                <p>${item.product.price} each</p>
              </div>
              <div className="row-actions">
                <button className="btn btn-secondary" type="button" onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}>
                  -
                </button>
                <span className="chip">{item.quantity}</span>
                <button className="btn btn-secondary" type="button" onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}>
                  +
                </button>
                <button className="btn btn-secondary" type="button" onClick={() => placeOrder(item.product.id, item.quantity)}>
                  Order
                </button>
              </div>
            </li>
          ))}
        </ul>
        <p className="price">Total: ${totalCartValue.toFixed(2)}</p>
        <div className="row-actions">
          <button className="btn btn-primary" type="button" onClick={checkoutCart} disabled={cart.length === 0}>
            Checkout All
          </button>
          <button className="btn btn-secondary" type="button" onClick={() => setCart([])} disabled={cart.length === 0}>
            Clear Cart
          </button>
        </div>
      </section>
    </div>
  );
}
