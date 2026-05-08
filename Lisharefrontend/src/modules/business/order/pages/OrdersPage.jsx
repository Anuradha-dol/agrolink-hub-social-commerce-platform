import { useEffect, useState } from "react";
import { orderService } from "../services/orderService";
import { useAuth } from "/src/modules/platform/app/store";
import LoadingState from "/src/modules/platform/common/components/LoadingState";
import { useToast } from "/src/modules/platform/common/hooks/useToast";

const ORDER_STATUSES = ["PENDING", "ACCEPTED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

function OrderRow({ order, children }) {
  return (
    <li className="order-row">
      <div>
        <strong>#{order.id}</strong> {order.productName}
        <p>
          Qty: {order.quantity} | Unit: ${order.unitPrice} | Total: ${order.totalPrice}
        </p>
        <p>Status: {order.status}</p>
      </div>
      {children}
    </li>
  );
}

export default function OrdersPage() {
  const { role } = useAuth();
  const { pushToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [myOrders, setMyOrders] = useState([]);
  const [businessOrders, setBusinessOrders] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const mine = await orderService.myOrders({ page: 0, size: 50 });
      setMyOrders(mine?.data?.data?.content || []);

      if (role === "ROLE_BUSINESS") {
        const biz = await orderService.businessOrders({ page: 0, size: 50 });
        setBusinessOrders(biz?.data?.data?.content || []);
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

  const cancelOrder = async (orderId) => {
    if (!window.confirm("Cancel this order?")) return;
    try {
      await orderService.cancelOrder(orderId);
      pushToast("Order cancelled", "success");
      load();
    } catch {
      pushToast("Failed to cancel order", "error");
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await orderService.updateOrderStatus(orderId, { status });
      pushToast("Order status updated", "success");
      load();
    } catch {
      pushToast("Failed to update order status", "error");
    }
  };

  if (loading) return <LoadingState text="Loading orders..." />;

  return (
    <div className="orders-page">
      <section className="card">
        <h2>My Orders</h2>
        <ul className="simple-list">
          {myOrders.map((order) => (
            <OrderRow key={order.id} order={order}>
              {(order.status === "PENDING" || order.status === "ACCEPTED") ? (
                <button className="btn btn-secondary" type="button" onClick={() => cancelOrder(order.id)}>
                  Cancel
                </button>
              ) : null}
            </OrderRow>
          ))}
        </ul>
      </section>

      {role === "ROLE_BUSINESS" ? (
        <section className="card">
          <h2>Business Orders</h2>
          <ul className="simple-list">
            {businessOrders.map((order) => (
              <OrderRow key={order.id} order={order}>
                <select value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value)}>
                  {ORDER_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </OrderRow>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
