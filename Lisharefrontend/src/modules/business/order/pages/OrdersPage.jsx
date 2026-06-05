import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { orderService } from "../services/orderService";
import { useAuth } from "/src/modules/platform/app/store";
import LoadingState from "/src/modules/platform/common/components/LoadingState";
import { useToast } from "/src/modules/platform/common/hooks/useToast";
import {
  Button,
  Card,
  EmptyPanel,
  Icon,
  LineChart,
  MiniChart,
  Modal,
  OverviewHero,
  PageGrid,
  SectionHeader,
  StatCard,
  StatusBadge,
  Tabs
} from "/src/modules/platform/common/ui/DashboardUI";

const ORDER_STATUSES = ["PENDING", "ACCEPTED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

function unwrap(response) {
  return response?.data?.data?.content || response?.data?.data || response?.data?.content || [];
}

function statusLabel(status = "") {
  const text = String(status || "Processing").replace(/_/g, " ").toLowerCase();
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
}

function orderTotal(order) {
  return Number(order.totalPrice ?? (Number(order.unitPrice || 0) * Number(order.quantity || 1)) ?? 0);
}

export default function OrdersPage() {
  const { role } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [myOrders, setMyOrders] = useState([]);
  const [businessOrders, setBusinessOrders] = useState([]);
  const [mode, setMode] = useState("user");
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState("");

  const isBusiness = role === "ROLE_BUSINESS" || role === "ROLE_FARMER";

  const load = async () => {
    setLoading(true);
    try {
      const mine = await orderService.myOrders({ page: 0, size: 80 });
      setMyOrders(unwrap(mine));
      if (isBusiness) {
        const biz = await orderService.businessOrders({ page: 0, size: 80 });
        setBusinessOrders(unwrap(biz));
      } else {
        setBusinessOrders([]);
      }
    } catch {
      pushToast("Failed to load orders", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [role]);

  const activeOrders = mode === "business" ? businessOrders : myOrders;
  const visibleOrders = useMemo(() => {
    const search = query.trim().toLowerCase();
    return activeOrders.filter((order) => {
      const matchesSearch = !search
        || String(order.productName || "").toLowerCase().includes(search)
        || String(order.sellerName || order.businessPageName || "").toLowerCase().includes(search)
        || String(order.id || "").toLowerCase().includes(search);
      const matchesStatus = statusFilter === "all" || String(order.status).toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [activeOrders, query, statusFilter]);

  const stats = useMemo(() => {
    const all = [...myOrders, ...businessOrders];
    return {
      my: myOrders.length,
      business: businessOrders.length,
      transit: all.filter((order) => ["SHIPPED", "IN_TRANSIT"].includes(String(order.status))).length,
      delivered: all.filter((order) => String(order.status) === "DELIVERED").length,
      returns: all.filter((order) => String(order.status).includes("RETURN")).length,
      spending: myOrders.reduce((total, order) => total + orderTotal(order), 0)
    };
  }, [businessOrders, myOrders]);

  const openModal = (type, order) => {
    setSelectedOrder(order);
    setModal(type);
  };

  const requestCancelOrder = (order) => {
    setSelectedOrder(order);
    setModal("cancel");
  };

  const confirmCancelOrder = async () => {
    const order = selectedOrder;
    if (!order) return;
    setBusy(`cancel-${order.id}`);
    try {
      await orderService.cancelOrder(order.id);
      pushToast("Order cancelled", "success");
      setModal(null);
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
      await orderService.createOrder({ productId: order.productId, quantity: order.quantity || 1 });
      pushToast("Reorder placed", "success");
      await load();
    } catch {
      pushToast("Failed to reorder", "error");
    } finally {
      setBusy("");
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    setBusy(`status-${orderId}`);
    try {
      await orderService.updateOrderStatus(orderId, { status });
      pushToast("Order status updated", "success");
      await load();
    } catch {
      pushToast("Failed to update status", "error");
    } finally {
      setBusy("");
    }
  };

  const contactSeller = (order) => {
    pushToast(`Seller contact opened for ${order.productName || `order #${order.id}`}`, "success");
  };

  if (loading) return <LoadingState text="Loading orders..." />;

  return (
    <PageGrid className="orders-dashboard">
      <OverviewHero
        icon="order"
        eyebrow="Stay updated, stay ahead"
        title="Track all your orders and grow your business"
        subtitle="Real-time tracking, insights, and complete order management for shoppers and sellers."
        stats={[
          { label: "My Orders", value: stats.my, trend: "Personal" },
          { label: "Business Orders", value: stats.business, trend: isBusiness ? "Seller mode" : "Restricted" },
          { label: "In Transit", value: stats.transit, trend: "Shipping" },
          { label: "Delivered", value: stats.delivered, trend: "Completed" }
        ]}
      />

      <div className="orders-layout">
        <main className="orders-main">
          <Card>
            <Tabs
              active={statusFilter}
              onChange={setStatusFilter}
              tabs={[
                { value: "all", label: "All Orders" },
                { value: "processing", label: "Processing" },
                { value: "shipped", label: "Shipped" },
                { value: "delivered", label: "Delivered" },
                { value: "cancelled", label: "Cancelled" }
              ]}
            />
            <div className="orders-toolbar">
              <label><Icon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search orders, products, sellers, order ID..." /></label>
              <select value={mode} onChange={(event) => setMode(event.target.value)} disabled={!isBusiness}>
                <option value="user">User Mode</option>
                <option value="business">Business Mode</option>
              </select>
              <Button icon="analytics" onClick={() => pushToast("Order filters applied", "success")}>Filters</Button>
            </div>
            <div className="dashboard-table-wrap">
              <table className="dashboard-table orders-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Seller</th>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <div className="table-product">
                          <span className="placeholder"><Icon name="bag" /></span>
                          <div><strong>{order.productName || "Product"}</strong><span>{order.category || "Order item"}</span></div>
                        </div>
                      </td>
                      <td>{order.sellerName || order.businessPageName || "AgroLink Seller"}</td>
                      <td>LSH-{String(order.id).padStart(6, "0")}</td>
                      <td>{order.createdAt ? new Date(order.createdAt).toLocaleString() : "Today"}</td>
                      <td>{order.quantity || 1}</td>
                      <td>${orderTotal(order).toFixed(2)}</td>
                      <td><StatusBadge status={statusLabel(order.status)} /></td>
                      <td>
                        <div className="table-action-row">
                          <Button icon="eye" onClick={() => openModal("details", order)}>Details</Button>
                          <Button icon="truck" onClick={() => openModal("track", order)}>Track</Button>
                          <button className="icon-button" type="button" aria-label="More actions" onClick={() => openModal("actions", order)}><Icon name="more" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!visibleOrders.length ? <EmptyPanel icon="order" title="No orders found" subtitle="Your order history will appear here after checkout." /> : null}
          </Card>

          <Card>
            <SectionHeader title="Business Insights" subtitle="Overview of seller performance." action={<button type="button" className="text-link" onClick={() => navigate("/marketplace")}>View all products</button>} />
            <div className="business-order-grid">
              <StatCard label="Total Sales" value={`$${businessOrders.reduce((sum, order) => sum + orderTotal(order), 0).toFixed(0)}`} icon="analytics" tone="green" />
              <StatCard label="Orders" value={businessOrders.length} icon="order" tone="blue" />
              <StatCard label="Pending" value={businessOrders.filter((order) => ["PENDING", "PROCESSING"].includes(String(order.status))).length} icon="bell" tone="orange" />
              <StatCard label="Completed" value={businessOrders.filter((order) => String(order.status) === "DELIVERED").length} icon="check" tone="purple" />
            </div>
          </Card>
        </main>

        <aside className="side-stack">
          <Card>
            <div className="segmented">
              <button type="button" className={mode === "user" ? "active" : ""} onClick={() => setMode("user")}>User Mode</button>
              <button type="button" className={mode === "business" ? "active" : ""} onClick={() => isBusiness && setMode("business")}>Business Mode</button>
            </div>
            <p className="muted mode-note">{mode === "user" ? "View and manage personal purchases and returns." : "Manage customer orders and fulfillment."}</p>
          </Card>

          <Card>
            <SectionHeader title="Spending Overview" action={<select className="mini-select"><option>This month</option></select>} />
            <h2 className="money-value">${stats.spending.toFixed(2)}</h2>
            <LineChart values={[180, 260, 230, 420, 350, 560, 470, 690, 780, 840]} />
          </Card>

          <Card>
            <SectionHeader title="Order Status Breakdown" />
            <div className="donut-chart" style={{ "--delivered": stats.delivered || 1, "--transit": stats.transit || 1 }}><span>{myOrders.length + businessOrders.length}</span></div>
            <ul className="panel-list">
              {["DELIVERED", "SHIPPED", "PROCESSING", "CANCELLED"].map((status) => (
                <li className="panel-row" key={status}><div><strong>{statusLabel(status)}</strong><span>{[...myOrders, ...businessOrders].filter((order) => String(order.status) === status).length} orders</span></div><StatusBadge status={statusLabel(status)} /></li>
              ))}
            </ul>
          </Card>

          <Card>
            <SectionHeader title="Current Shipment" />
            {myOrders.find((order) => ["SHIPPED", "IN_TRANSIT"].includes(String(order.status))) ? (
              <ShipmentTracker order={myOrders.find((order) => ["SHIPPED", "IN_TRANSIT"].includes(String(order.status)))} onTrack={(order) => openModal("track", order)} />
            ) : <EmptyPanel icon="truck" title="No active shipment" subtitle="Tracked shipments appear here." />}
          </Card>

          <Card>
            <SectionHeader title="Recent Notifications" />
            <ul className="panel-list">
              {visibleOrders.slice(0, 3).map((order) => (
                <li className="panel-row" key={`notif-${order.id}`}><div><strong>{order.productName || "Order"} is {statusLabel(order.status)}</strong><span>Updated recently</span></div><Icon name="bell" /></li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>

      <Modal
        open={modal === "details"}
        title={`Order LSH-${String(selectedOrder?.id || "").padStart(6, "0")}`}
        subtitle="Timeline, shipping, payment summary, product list, and available actions."
        onClose={() => setModal(null)}
        className="ui-modal-wide"
        footer={<OrderActionFooter order={selectedOrder} onReorder={reorder} onCancel={requestCancelOrder} onInvoice={() => setModal("invoice")} onContact={contactSeller} busy={busy} />}
      >
        {selectedOrder ? <OrderDetails order={selectedOrder} /> : null}
      </Modal>

      <Modal
        open={modal === "track"}
        title="Track Package"
        subtitle="Shipment progress and delivery checkpoints."
        onClose={() => setModal(null)}
        footer={<Button onClick={() => setModal(null)}>Close</Button>}
      >
        {selectedOrder ? <ShipmentTracker order={selectedOrder} expanded /> : null}
      </Modal>

      <Modal
        open={modal === "invoice"}
        title="Invoice"
        subtitle="Printable order invoice preview."
        onClose={() => setModal(null)}
        footer={<><Button onClick={() => setModal(null)}>Close</Button><Button variant="gradient" icon="invoice" onClick={() => window.print()}>Print Invoice</Button></>}
      >
        {selectedOrder ? <Invoice order={selectedOrder} /> : null}
      </Modal>

      <Modal
        open={modal === "actions"}
        title="Order Actions"
        subtitle="Choose the next action for this order."
        onClose={() => setModal(null)}
        footer={<Button onClick={() => setModal(null)}>Close</Button>}
      >
        {selectedOrder ? (
          <div className="action-grid-modal">
            <Button icon="eye" onClick={() => setModal("details")}>View Details</Button>
            <Button icon="truck" onClick={() => setModal("track")}>Track Package</Button>
            <Button icon="invoice" onClick={() => setModal("invoice")}>View Invoice</Button>
            <Button icon="bag" onClick={() => reorder(selectedOrder)} disabled={busy === `reorder-${selectedOrder.id}`}>Reorder</Button>
            <Button icon="close" variant="danger" onClick={() => requestCancelOrder(selectedOrder)} disabled={busy === `cancel-${selectedOrder.id}`}>Cancel Order</Button>
            <Button icon="chat" onClick={() => contactSeller(selectedOrder)}>Contact Seller</Button>
            {mode === "business" ? (
              <select value={selectedOrder.status} onChange={(event) => updateOrderStatus(selectedOrder.id, event.target.value)}>
                {ORDER_STATUSES.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
              </select>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={modal === "cancel"}
        title="Cancel Order"
        subtitle="Confirm this before changing the order state."
        onClose={busy ? undefined : () => setModal(null)}
        footer={(
          <>
            <Button onClick={() => setModal(null)} disabled={Boolean(busy)}>Keep Order</Button>
            <Button variant="danger" icon="close" onClick={confirmCancelOrder} disabled={Boolean(busy)}>
              {busy ? "Cancelling..." : "Cancel Order"}
            </Button>
          </>
        )}
      >
        <div className="confirmation-panel">
          <span><Icon name="order" /></span>
          <div>
            <strong>{selectedOrder?.productName || "Selected order"}</strong>
            <p>This will request cancellation for order LSH-{String(selectedOrder?.id || "").padStart(6, "0")}.</p>
          </div>
        </div>
      </Modal>
    </PageGrid>
  );
}

function ShipmentTracker({ order, onTrack, expanded = false }) {
  const steps = ["Order Placed", "Shipped", "In Transit", "Delivered"];
  const current = ["PENDING", "ACCEPTED", "PROCESSING"].includes(String(order.status)) ? 0 : String(order.status) === "SHIPPED" ? 1 : String(order.status) === "DELIVERED" ? 3 : 2;
  return (
    <div className={`shipment-tracker ${expanded ? "expanded" : ""}`}>
      <div className="table-product">
        <span className="placeholder"><Icon name="bag" /></span>
        <div><strong>{order.productName || "Product"}</strong><span>Tracking ID: LSH-{String(order.id).padStart(6, "0")}</span></div>
      </div>
      <div className="shipment-line">
        {steps.map((step, index) => <span key={step} className={index <= current ? "done" : ""}><i />{step}</span>)}
      </div>
      {onTrack ? <Button icon="truck" onClick={() => onTrack(order)}>Track Package</Button> : null}
    </div>
  );
}

function OrderDetails({ order }) {
  return (
    <div className="order-detail-grid">
      <Card>
        <SectionHeader title="Timeline" />
        <div className="timeline-list">
          {["Order placed", "Payment confirmed", "Seller processing", statusLabel(order.status)].map((item, index) => (
        <div key={item} className="timeline-item"><span>{index + 1}</span><div><strong>{item}</strong><p>{index === 0 ? "Checkout completed" : "Updated by AgroLink Hub"}</p></div></div>
          ))}
        </div>
      </Card>
      <Card>
        <SectionHeader title="Shipping Info" />
        <p className="muted">Delivery address and carrier details are shown when provided by the seller.</p>
        <StatusBadge status={statusLabel(order.status)} />
      </Card>
      <Card>
        <SectionHeader title="Payment Summary" />
        <div className="cart-total-row"><span>Items</span><strong>{order.quantity || 1}</strong></div>
        <div className="cart-total-row"><span>Total</span><strong>${orderTotal(order).toFixed(2)}</strong></div>
      </Card>
      <Card>
        <SectionHeader title="Product List" />
        <div className="table-product"><span className="placeholder"><Icon name="bag" /></span><div><strong>{order.productName || "Product"}</strong><span>Qty {order.quantity || 1}</span></div></div>
      </Card>
    </div>
  );
}

function OrderActionFooter({ order, onReorder, onCancel, onInvoice, onContact, busy }) {
  if (!order) return null;
  return (
    <>
      <Button icon="invoice" onClick={onInvoice}>Invoice</Button>
      <Button icon="bag" onClick={() => onReorder(order)} disabled={busy === `reorder-${order.id}`}>Reorder</Button>
      <Button icon="chat" onClick={() => onContact(order)}>Contact Seller</Button>
      {["PENDING", "ACCEPTED", "PROCESSING"].includes(String(order.status)) ? (
        <Button variant="danger" icon="close" onClick={() => onCancel(order)} disabled={busy === `cancel-${order.id}`}>Cancel</Button>
      ) : null}
    </>
  );
}

function Invoice({ order }) {
  return (
    <div className="invoice-card">
  <h2>AgroLink Hub Invoice</h2>
      <p>Order: LSH-{String(order.id).padStart(6, "0")}</p>
      <div className="cart-total-row"><span>{order.productName || "Product"} x {order.quantity || 1}</span><strong>${orderTotal(order).toFixed(2)}</strong></div>
      <div className="cart-total-row"><span>Status</span><strong>{statusLabel(order.status)}</strong></div>
      <div className="cart-total-row"><span>Total Paid</span><strong>${orderTotal(order).toFixed(2)}</strong></div>
    </div>
  );
}
