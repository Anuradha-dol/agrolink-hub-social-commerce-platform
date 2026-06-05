import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cartService } from "/src/modules/business/cart/services/cartService";
import { useAuth } from "/src/modules/platform/app/store";
import LoadingState from "/src/modules/platform/common/components/LoadingState";
import { useToast } from "/src/modules/platform/common/hooks/useToast";
import { toMediaUrl } from "/src/modules/platform/common/utils/mediaUrl";
import {
  Button,
  Card,
  EmptyPanel,
  Icon,
  Modal,
  OverviewHero,
  PageGrid,
  SectionHeader,
  StatCard,
  StatusBadge
} from "/src/modules/platform/common/ui/DashboardUI";

function unwrap(response) {
  return response?.data?.data?.content || response?.data?.data || response?.data?.content || [];
}

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function lineTotal(item) {
  return Number(item.lineTotal ?? Number(item.unitPrice || 0) * Number(item.quantity || 1));
}

function itemImage(item) {
  const value = String(item.productImageUrl || "").trim();
  if (!value) return "";
  if (/^(data:image\/|blob:)/i.test(value)) return value;
  if (/^https?:\/\//i.test(value) || value.startsWith("/") || value.startsWith("uploads/")) return toMediaUrl(value);
  return "";
}

function ProductImage({ src, alt }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <Icon name="bag" />;
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
}

export default function CartPage() {
  const { role } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const isBusiness = role === "ROLE_BUSINESS" || role === "ROLE_FARMER";
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [modal, setModal] = useState("");
  const [busy, setBusy] = useState("");

  const load = async () => {
    setLoading(true);
    if (isBusiness) {
      setCart([]);
      setLoading(false);
      return;
    }
    try {
      const response = await cartService.list();
      setCart(unwrap(response));
    } catch {
      pushToast("Failed to load cart", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [role]);

  const visibleCart = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return cart;
    return cart.filter((item) => [item.productName, item.businessName, item.category, item.deliveryMethod]
      .some((value) => String(value || "").toLowerCase().includes(search)));
  }, [cart, query]);

  const subtotal = cart.reduce((sum, item) => sum + lineTotal(item), 0);
  const serviceFee = subtotal > 0 ? Math.max(1.5, subtotal * 0.025) : 0;
  const total = subtotal + serviceFee;
  const quantity = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  const updateQuantity = async (item, quantityValue) => {
    const nextQuantity = Number(quantityValue);
    if (!Number.isFinite(nextQuantity) || nextQuantity < 1) return;
    setBusy(`qty-${item.id}`);
    try {
      await cartService.update(item.id, { productId: item.productId, quantity: nextQuantity });
      await load();
      pushToast("Cart quantity updated", "success");
    } catch {
      pushToast("Failed to update cart quantity", "error");
    } finally {
      setBusy("");
    }
  };

  const removeItem = async (item) => {
    setBusy(`remove-${item.id}`);
    try {
      await cartService.remove(item.id);
      await load();
      setModal("");
      pushToast("Item removed from cart", "success");
    } catch {
      pushToast("Failed to remove cart item", "error");
    } finally {
      setBusy("");
    }
  };

  const clearCart = async () => {
    setBusy("clear");
    try {
      await cartService.clear();
      await load();
      setModal("");
      pushToast("Cart cleared", "success");
    } catch {
      pushToast("Failed to clear cart", "error");
    } finally {
      setBusy("");
    }
  };

  const checkout = async () => {
    if (!cart.length) return;
    setBusy("checkout");
    try {
      await cartService.checkout();
      await load();
      pushToast("Order placed successfully", "success");
      navigate("/orders");
    } catch {
      pushToast("Checkout failed. Check stock and seller availability.", "error");
    } finally {
      setBusy("");
    }
  };

  if (loading) return <LoadingState text="Loading cart..." />;

  if (isBusiness) {
    return (
      <PageGrid className="cart-dashboard commerce-pro-page social-pro-page social-commerce-page">
        <Card className="commerce-panel">
          <EmptyPanel
            icon="business"
            title="Seller accounts do not use cart checkout"
            subtitle="Business and farmer accounts sell products and manage received orders from Business Studio."
            action={<Button icon="business" variant="gradient" onClick={() => navigate("/business")}>Open Business Studio</Button>}
          />
        </Card>
      </PageGrid>
    );
  }

  return (
    <PageGrid className="cart-dashboard commerce-pro-page social-pro-page social-commerce-page">
      <section className="commerce-hero commerce-cart-hero">
        <div>
          <span className="commerce-kicker">Persistent Cart</span>
          <h2>Your selected products are saved in the backend.</h2>
          <p>Refresh the page and your cart remains synced. Update quantities, remove products, or place orders directly from this section.</p>
          <form className="commerce-hero-search" onSubmit={(event) => event.preventDefault()}>
            <Icon name="search" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search cart products, sellers or delivery methods..." />
            <Button icon="bag" variant="gradient" onClick={() => navigate("/marketplace")}>Shop More</Button>
          </form>
        </div>
        <div className="commerce-hero-panel">
          <StatCard icon="bag" label="Items" value={quantity} trend="Selected quantity" tone="green" />
          <StatCard icon="business" label="Businesses" value={new Set(cart.map((item) => item.businessPageId)).size} trend="Seller count" tone="blue" />
          <StatCard icon="order" label="Total" value={money(total)} trend="Before checkout" tone="orange" />
        </div>
      </section>

      <OverviewHero
        icon="bag"
        eyebrow="Checkout Flow"
        title="Cart items move into Orders after checkout."
        subtitle="Every checkout creates backend order records, clears the cart, and the Orders page fetches the persisted order status after refresh."
        stats={[
          { label: "Products", value: cart.length, trend: "Cart rows" },
          { label: "Quantity", value: quantity, trend: "Total units" },
          { label: "Subtotal", value: money(subtotal), trend: "Products" },
          { label: "Service", value: money(serviceFee), trend: "Estimated" }
        ]}
      />

      <div className="commerce-cart-layout">
        <main className="commerce-cart-main">
          <Card className="commerce-panel">
            <SectionHeader title="Cart Products" subtitle="Update quantity, remove items, and proceed to order." action={<Button icon="bag" variant="gradient" onClick={() => navigate("/marketplace")}>Continue Shopping</Button>} />
            {visibleCart.length ? (
              <div className="commerce-cart-list">
                {visibleCart.map((item) => (
                  <article className="commerce-cart-item" key={item.id}>
                    <div className="commerce-cart-media"><ProductImage src={itemImage(item)} alt={item.productName} /></div>
                    <div className="commerce-cart-copy">
                      <div>
                        <StatusBadge status={item.available ? "Available" : "Unavailable"} tone={item.available ? "green" : "red"} />
                        <StatusBadge status={item.deliveryMethod || "Pickup"} tone="blue" />
                      </div>
                      <h3>{item.productName}</h3>
                      <p>{item.businessName || "AgroLink Seller"} - {item.category || "General"}</p>
                      <strong>{money(item.unitPrice)} each</strong>
                    </div>
                    <div className="commerce-cart-quantity">
                      <button type="button" onClick={() => updateQuantity(item, Number(item.quantity || 1) - 1)} disabled={Number(item.quantity || 1) <= 1 || busy === `qty-${item.id}`}>-</button>
                      <input type="number" min="1" max={item.stock || 999} value={item.quantity || 1} onChange={(event) => updateQuantity(item, event.target.value)} />
                      <button type="button" onClick={() => updateQuantity(item, Number(item.quantity || 1) + 1)} disabled={busy === `qty-${item.id}` || Number(item.quantity || 1) >= Number(item.stock || 999)}>+</button>
                    </div>
                    <div className="commerce-cart-total">
                      <span>Line total</span>
                      <strong>{money(lineTotal(item))}</strong>
                    </div>
                    <div className="commerce-cart-actions">
                      <Button icon="eye" onClick={() => { setSelectedItem(item); setModal("details"); }}>View</Button>
                      <Button icon="trash" variant="danger" onClick={() => removeItem(item)} disabled={busy === `remove-${item.id}`}>Remove</Button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyPanel icon="bag" title="Your cart is empty" subtitle="Add products from Marketplace and they will persist here." action={<Button icon="marketplace" variant="gradient" onClick={() => navigate("/marketplace")}>Open Marketplace</Button>} />
            )}
          </Card>
        </main>

        <aside className="commerce-cart-summary">
          <Card className="commerce-panel checkout-panel">
            <SectionHeader title="Order Summary" />
            <div className="commerce-total-row"><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
            <div className="commerce-total-row"><span>Service fee</span><strong>{money(serviceFee)}</strong></div>
            <div className="commerce-total-row grand"><span>Total</span><strong>{money(total)}</strong></div>
            <Button icon="order" variant="gradient" onClick={checkout} disabled={!cart.length || busy === "checkout"}>{busy === "checkout" ? "Placing..." : "Proceed to Order"}</Button>
            <Button icon="trash" variant="danger" onClick={() => setModal("clear")} disabled={!cart.length}>Clear Cart</Button>
          </Card>

          <Card className="commerce-panel">
            <SectionHeader title="Delivery Methods" />
            <ul className="panel-list">
              {[...new Set(cart.map((item) => item.deliveryMethod || "Pickup"))].map((method) => (
                <li className="panel-row" key={method}><div><strong>{method}</strong><span>{cart.filter((item) => (item.deliveryMethod || "Pickup") === method).length} cart rows</span></div><Icon name="truck" /></li>
              ))}
              {!cart.length ? <li><EmptyPanel icon="truck" title="No delivery yet" subtitle="Delivery methods appear after adding products." /></li> : null}
            </ul>
          </Card>
        </aside>
      </div>

      <Modal open={modal === "details"} title={selectedItem?.productName || "Cart Item"} subtitle={selectedItem?.businessName || "Cart product"} onClose={() => setModal("")} className="ui-modal-wide commerce-cart-detail-modal">
        {selectedItem ? (
          <div className="commerce-cart-detail">
            <div className="commerce-cart-media large"><ProductImage src={itemImage(selectedItem)} alt={selectedItem.productName} /></div>
            <div className="commerce-cart-detail-copy">
              <StatusBadge status={selectedItem.available ? "Available" : "Unavailable"} tone={selectedItem.available ? "green" : "red"} />
              <h2>{selectedItem.productName}</h2>
              <p>{selectedItem.businessName || "AgroLink Seller"} - {selectedItem.category || "General"}</p>
              <div className="commerce-total-row"><span>Unit price</span><strong>{money(selectedItem.unitPrice)}</strong></div>
              <div className="commerce-total-row"><span>Quantity</span><strong>{selectedItem.quantity}</strong></div>
              <div className="commerce-total-row"><span>Delivery</span><strong>{selectedItem.deliveryMethod || "Pickup"}</strong></div>
              <div className="commerce-total-row grand"><span>Total</span><strong>{money(lineTotal(selectedItem))}</strong></div>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={modal === "clear"}
        title="Clear Cart"
        subtitle="This removes all selected products from your backend cart."
        onClose={() => setModal("")}
        footer={(
          <>
            <Button onClick={() => setModal("")}>Cancel</Button>
            <Button icon="trash" variant="danger" onClick={clearCart} disabled={busy === "clear"}>{busy === "clear" ? "Clearing..." : "Clear Cart"}</Button>
          </>
        )}
      >
        <p className="commerce-confirm-copy">Remove all products from your cart?</p>
      </Modal>
    </PageGrid>
  );
}
