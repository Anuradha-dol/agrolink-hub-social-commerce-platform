import { useEffect, useMemo, useState } from "react";
import { marketplaceService } from "../services/marketplaceService";
import { orderService } from "/src/modules/business/order/services/orderService";
import LoadingState from "/src/modules/platform/common/components/LoadingState";
import ErrorState from "/src/modules/platform/common/components/ErrorState";
import EmptyState from "/src/modules/platform/common/components/EmptyState";
import { useToast } from "/src/modules/platform/common/hooks/useToast";

export default function MarketplacePage() {
  const { pushToast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
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
    setWishlist((prev) => (prev.includes(productId) ? prev : [...prev, productId]));
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

  const placeOrder = async (productId, quantity = 1) => {
    try {
      await orderService.createOrder({ productId, quantity });
      pushToast("Order placed successfully", "success");
    } catch {
      pushToast("Failed to place order", "error");
    }
  };

  const totalCartValue = useMemo(
    () =>
      cart.reduce((total, item) => total + Number(item.product.price || 0) * Number(item.quantity || 0), 0),
    [cart]
  );

  if (loading) return <LoadingState text="Loading marketplace..." />;
  if (error) return <ErrorState message={error} onRetry={loadProducts} />;

  return (
    <div className="marketplace-page">
      <section className="card">
        <h2>Marketplace</h2>
        <div className="inline-form">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products" />
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" />
          <button className="btn btn-primary" type="button" onClick={loadProducts}>
            Search
          </button>
        </div>
      </section>

      <section className="product-grid">
        {products.length === 0 ? <EmptyState title="No products found" /> : null}
        {products.map((product) => (
          <article key={product.id} className="card product-card">
            {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="product-image" /> : null}
            <h3>{product.name}</h3>
            <p>{product.description || "No description"}</p>
            <p className="price">${product.price}</p>
            <p className="muted">Stock: {product.stock}</p>
            <div className="row-actions">
              <button className="btn btn-secondary" type="button" onClick={() => addToWishlist(product.id)}>
                {wishlist.includes(product.id) ? "Saved" : "Wishlist"}
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

      <section className="card">
        <h3>Cart</h3>
        <ul className="simple-list">
          {cart.map((item) => (
            <li key={item.product.id}>
              {item.product.name} x {item.quantity} (${item.product.price})
            </li>
          ))}
        </ul>
        <p className="price">Total: ${totalCartValue.toFixed(2)}</p>
      </section>
    </div>
  );
}
