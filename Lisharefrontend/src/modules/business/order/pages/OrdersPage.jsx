import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { orderService } from "../services/orderService";
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
  StatusBadge,
  Tabs
} from "/src/modules/platform/common/ui/DashboardUI";

const ORDER_STATUSES = ["PENDING", "ACCEPTED", "PROCESSING", "ON_THE_WAY", "COMPLETED", "CANCELLED"];
const STATUS_STEPS = ["PENDING", "ACCEPTED", "PROCESSING", "ON_THE_WAY", "COMPLETED"];

function unwrap(response) {
  return response?.data?.data?.content || response?.data?.data || response?.data?.content || [];
}

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function orderTotal(order) {
  return Number(order.totalPrice ?? Number(order.unitPrice || 0) * Number(order.quantity || 1));
}

function statusLabel(status = "") {
  const normalized = String(status || "PENDING");
  if (normalized === "ACCEPTED") return "Accepted / Open";
  if (normalized === "ON_THE_WAY" || normalized === "SHIPPED") return "On the Way";
  if (normalized === "COMPLETED" || normalized === "DELIVERED") return "Completed / Done";
  return normalized.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function statusTone(status = "") {
  const normalized = String(status);
  if (["COMPLETED", "DELIVERED"].includes(normalized)) return "green";
  if (normalized === "CANCELLED") return "red";
  if (["ON_THE_WAY", "SHIPPED"].includes(normalized)) return "blue";
  if (normalized === "PROCESSING") return "purple";
  return "orange";
}

function productImage(order) {
  const value = String(order.productImageUrl || "").trim();
  if (!value) return "";
  if (/^(data:image\/|blob:)/i.test(value)) return value;
  if (/^https?:\/\//i.test(value) || value.startsWith("/") || value.startsWith("uploads/")) return toMediaUrl(value);
  return "";
}

function currentStep(status) {
  const normalized = status === "SHIPPED" ? "ON_THE_WAY" : status === "DELIVERED" ? "COMPLETED" : status;
  const index = STATUS_STEPS.indexOf(normalized);
  return index < 0 ? 0 : index;
}

function ProductImage({ src, alt }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <Icon name="bag" />;
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
}

export default function OrdersPage() {
  const { role } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const isBusiness = role === "ROLE_BUSINESS" || role === "ROLE_FARMER";

  const [loading, setLoading] = useState(true);
  const [myOrders, setMyOrders] = useState([]);
  const [businessOrders, setBusinessOrders] = useState([]);
  const [mode, setMode] = useState("user");
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modal, setModal] = useState("");
  const [busy, setBusy] = useState("");

  const load = async () => {
      setLoading(true);
      try {
        const [mineRes, businessRes] = await Promise.allSettled([
        isBusiness ? Promise.resolve({ data: { data: [] } }) : orderService.myOrders({ page: 0, size: 100 }),
        isBusiness ? orderService.businessOrders({ page: 0, size: 100 }) : Promise.resolve({ data: { data: [] } })
      ]);
      if (mineRes.status === "fulfilled") setMyOrders(unwrap(mineRes.value));
      if (businessRes.status === "fulfilled") setBusinessOrders(unwrap(businessRes.value));
    } catch {
      pushToast("Failed to load orders", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMode(isBusiness ? "business" : "user");
    load();
  }, [role]);

  const activeOrders = mode === "business" ? businessOrders : myOrders;
  const visibleOrders = useMemo(() => {
    const search = query.trim().toLowerCase();
    return activeOrders.filter((order) => {
      const status = String(order.status || "PENDING");
      const matchesStatus = statusFilter === "all" || status.toLowerCase() === statusFilter;
      const matchesSearch = !search || [order.productName, order.businessName, order.sellerName, order.buyerName, order.deliveryMethod, order.id]
        .some((value) => String(value || "").toLowerCase().includes(search));
      return matchesStatus && matchesSearch;
    });
  }, [activeOrders, query, statusFilter]);

  const stats = useMemo(() => {
    const combined = [...myOrders, ...businessOrders];
    return {
      my: myOrders.length,
      received: businessOrders.length,
      pending: combined.filter((order) => String(order.status) === "PENDING").length,
      completed: combined.filter((order) => ["COMPLETED", "DELIVERED"].includes(String(order.status))).length,
      spending: myOrders.reduce((sum, order) => sum + orderTotal(order), 0),
      revenue: businessOrders.reduce((sum, order) => sum + orderTotal(order), 0)
    };
  }, [businessOrders, myOrders]);

  const openDetails = (order) => {
    setSelectedOrder(order);
    setModal("details");
  };

  const updateStatus = async (order, status) => {
    setBusy(`status-${order.id}`);
    try {
      await orderService.updateOrderStatus(order.id, { status });
      pushToast("Order status updated", "success");
      await load();
    } catch {
      pushToast("Invalid status transition or update failed", "error");
    } finally {
      setBusy("");
    }
  };

  const cancelOrder = async (order) => {
    setBusy(`cancel-${order.id}`);
    try {
      await orderService.cancelOrder(order.id);
      pushToast("Order cancelled", "success");
      setModal("");
      await load();
    } catch {
      pushToast("Failed to cancel order", "error");
    } finally {
      setBusy("");
    }
  };

  const reorder = async (order) => {
    setBusy(`reorder-${order.id}`);
    try {
      await orderService.createOrder({ productId: order.productId, quantity: order.quantity || 1, deliveryMethod: order.deliveryMethod });
      pushToast("Reorder placed", "success");
      await load();
    } catch {
      pushToast("Failed to reorder", "error");
    } finally {
      setBusy("");
    }
  };

  if (loading) return <LoadingState text="Loading orders..." />;

  return (
    <PageGrid className="orders-dashboard commerce-pro-page social-pro-page social-commerce-page">
      <section className="commerce-hero commerce-orders-hero">
        <div>
          <span className="commerce-kicker">Order Center</span>
          <h2>{isBusiness ? "Business fulfillment and seller order management." : "Buyer orders and business fulfillment in one clean workflow."}</h2>
          <p>{isBusiness ? "Business accounts manage received orders only. Buyers place orders from the marketplace cart." : "Orders are stored in the backend, refresh safely, and status updates from business users are visible to buyers."}</p>
          <form className="commerce-hero-search" onSubmit={(event) => event.preventDefault()}>
            <Icon name="search" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search orders, products, business names, delivery methods..." />
            <Button icon={isBusiness ? "business" : "marketplace"} variant="gradient" onClick={() => navigate(isBusiness ? "/business" : "/marketplace")}>{isBusiness ? "Business Studio" : "Marketplace"}</Button>
          </form>
        </div>
        <div className="commerce-hero-panel">
          <StatCard icon="order" label="My Orders" value={stats.my} trend="Purchases" tone="green" />
          <StatCard icon="business" label="Received" value={stats.received} trend={isBusiness ? "Business" : "Seller only"} tone="blue" />
          <StatCard icon="analytics" label={mode === "business" ? "Revenue" : "Spending"} value={money(mode === "business" ? stats.revenue : stats.spending)} trend="Backend totals" tone="orange" />
        </div>
      </section>

      <OverviewHero
        icon="order"
        eyebrow="Persistent Order Flow"
        title="Placed orders go here and status stays synced after refresh."
        subtitle="Business users can move received orders through Pending, Accepted/Open, Processing, On the Way, Completed/Done, or Cancelled."
        stats={[
          { label: "Pending", value: stats.pending, trend: "Needs action" },
          { label: "Completed", value: stats.completed, trend: "Done" },
          { label: "Visible Rows", value: visibleOrders.length, trend: mode === "business" ? "Seller view" : "Buyer view" },
          { label: "Mode", value: mode === "business" ? "Seller" : "Buyer", trend: "Current" }
        ]}
      />

      <div className="commerce-orders-layout">
        <main className="commerce-orders-main">
          <Card className="commerce-panel">
            <div className="commerce-order-topbar">
              <Tabs
                active={statusFilter}
                onChange={setStatusFilter}
                tabs={[
                  { value: "all", label: "All" },
                  { value: "pending", label: "Pending" },
                  { value: "accepted", label: "Accepted" },
                  { value: "processing", label: "Processing" },
                  { value: "on_the_way", label: "On the Way" },
                  { value: "completed", label: "Completed" },
                  { value: "cancelled", label: "Cancelled" }
                ]}
              />
              <div className="segmented commerce-mode-toggle">
                {!isBusiness ? <button type="button" className={mode === "user" ? "active" : ""} onClick={() => setMode("user")}>My Orders</button> : null}
                {isBusiness ? <button type="button" className={mode === "business" ? "active" : ""} onClick={() => setMode("business")}>Business Orders</button> : null}
              </div>
            </div>

            {visibleOrders.length ? (
              <div className="commerce-order-list">
                {visibleOrders.map((order) => (
                  <article className="commerce-order-card" key={`${mode}-${order.id}`}>
                    <div className="commerce-order-media"><ProductImage src={productImage(order)} alt={order.productName} /></div>
                    <div className="commerce-order-copy">
                      <div>
                        <StatusBadge status={statusLabel(order.status)} tone={statusTone(order.status)} />
                        <StatusBadge status={order.deliveryMethod || "Pickup"} tone="blue" />
                      </div>
                      <h3>{order.productName || "Product"}</h3>
                      <p>{mode === "business" ? `Customer: ${order.buyerName || "Customer"}` : `Business: ${order.businessName || order.sellerName || "Seller"}`}</p>
                      <span>Order LSH-{String(order.id).padStart(6, "0")} - {order.createdAt ? new Date(order.createdAt).toLocaleString() : "Recent"}</span>
                    </div>
                    <div className="commerce-order-numbers">
                      <span>Qty</span><strong>{order.quantity || 1}</strong>
                      <span>Total</span><strong>{money(orderTotal(order))}</strong>
                    </div>
                    <div className="commerce-order-actions">
                      <Button icon="eye" onClick={() => openDetails(order)}>Details</Button>
                      {mode === "user" ? <Button icon="bag" onClick={() => reorder(order)} disabled={busy === `reorder-${order.id}`}>Reorder</Button> : null}
                      {mode === "user" && ["PENDING", "ACCEPTED"].includes(String(order.status)) ? <Button icon="close" variant="danger" onClick={() => cancelOrder(order)} disabled={busy === `cancel-${order.id}`}>Cancel</Button> : null}
                      {mode === "business" ? (
                        <select value={order.status} onChange={(event) => updateStatus(order, event.target.value)} disabled={busy === `status-${order.id}`}>
                          {ORDER_STATUSES.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
                        </select>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyPanel icon="order" title="No orders found" subtitle={isBusiness ? "Received customer orders will appear here." : "Orders appear here after checkout from Cart."} action={<Button icon={isBusiness ? "business" : "marketplace"} variant="gradient" onClick={() => navigate(isBusiness ? "/business" : "/marketplace")}>{isBusiness ? "Open Business Studio" : "Open Marketplace"}</Button>} />
            )}
          </Card>
        </main>

        <aside className="commerce-order-side">
          <Card className="commerce-panel">
            <SectionHeader title="Status Pipeline" />
            <div className="commerce-status-pipeline">
              {STATUS_STEPS.map((status) => (
                <div key={status}>
                  <span>{activeOrders.filter((order) => String(order.status) === status || (status === "ON_THE_WAY" && String(order.status) === "SHIPPED") || (status === "COMPLETED" && String(order.status) === "DELIVERED")).length}</span>
                  <strong>{statusLabel(status)}</strong>
                </div>
              ))}
            </div>
          </Card>
          <Card className="commerce-panel">
            <SectionHeader title="Quick Actions" />
            <div className="commerce-rail-actions">
              {isBusiness ? (
                <>
                  <Button icon="business" variant="gradient" onClick={() => navigate("/business")}>Business Studio</Button>
                  <Button icon="analytics" onClick={() => navigate("/analytics")}>Seller Analytics</Button>
                </>
              ) : (
                <>
                  <Button icon="marketplace" variant="gradient" onClick={() => navigate("/marketplace")}>Shop Products</Button>
                  <Button icon="bag" onClick={() => navigate("/cart")}>Open Cart</Button>
                </>
              )}
            </div>
          </Card>
        </aside>
      </div>

      <Modal open={modal === "details"} title={`Order LSH-${String(selectedOrder?.id || "").padStart(6, "0")}`} subtitle={selectedOrder?.productName || "Order details"} onClose={() => setModal("")} className="ui-modal-wide">
        {selectedOrder ? <OrderDetails order={selectedOrder} /> : null}
      </Modal>
    </PageGrid>
  );
}

function OrderDetails({ order }) {
  const step = currentStep(order.status);
  return (
    <div className="commerce-order-detail-grid">
      <div className="commerce-detail-media"><ProductImage src={productImage(order)} alt={order.productName} /></div>
      <div className="commerce-detail-copy">
        <StatusBadge status={statusLabel(order.status)} tone={statusTone(order.status)} />
        <h2>{order.productName}</h2>
        <p>{order.businessName || order.sellerName || "AgroLink Seller"} - {order.deliveryMethod || "Pickup"}</p>
        <div className="commerce-total-row"><span>Quantity</span><strong>{order.quantity || 1}</strong></div>
        <div className="commerce-total-row"><span>Unit price</span><strong>{money(order.unitPrice)}</strong></div>
        <div className="commerce-total-row grand"><span>Total</span><strong>{money(orderTotal(order))}</strong></div>
      </div>
      <div className="commerce-tracker span-two">
        {STATUS_STEPS.map((status, index) => (
          <span key={status} className={index <= step ? "done" : ""}><i />{statusLabel(status)}</span>
        ))}
      </div>
    </div>
  );
}
