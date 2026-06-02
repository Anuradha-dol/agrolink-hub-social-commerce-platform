import { useEffect, useMemo, useState } from "react";
import { adminService } from "/src/modules/business/admin/services/adminService";
import { marketplaceService } from "/src/modules/business/product/services/marketplaceService";
import { orderService } from "/src/modules/business/order/services/orderService";
import { feedService } from "/src/modules/social/post/services/feedService";
import { calendarService } from "/src/modules/platform/calendar/services/calendarService";
import { getSavedProducts } from "/src/modules/business/product/utils/productStorage";
import { useAuth } from "/src/modules/platform/app/store";
import LoadingState from "/src/modules/platform/common/components/LoadingState";
import { useToast } from "/src/modules/platform/common/hooks/useToast";
import { Button, Card, EmptyPanel, Icon, LineChart, PageGrid, SectionHeader, StatusBadge } from "/src/modules/platform/common/ui/DashboardUI";

const SERIES_DAYS = 12;
const DAY_MS = 24 * 60 * 60 * 1000;

function unwrap(response) {
  return response?.data?.data?.content || response?.data?.data || response?.data?.content || response?.data || [];
}

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function percent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function numberValue(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function dateValue(item) {
  const raw = item?.createdAt || item?.created_at || item?.sharedAt || item?.savedAt || item?.orderedAt || item?.orderDate || item?.startsAt || item?.date;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dailySeries(items = [], valueFn = () => 1, days = SERIES_DAYS) {
  const buckets = Array.from({ length: days }, () => 0);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - days + 1);

  items.forEach((item) => {
    const date = dateValue(item);
    if (!date) return;
    const itemDay = new Date(date);
    itemDay.setHours(0, 0, 0, 0);
    const index = Math.floor((itemDay.getTime() - start.getTime()) / DAY_MS);
    if (index >= 0 && index < buckets.length) {
      buckets[index] += numberValue(valueFn(item));
    }
  });

  return buckets;
}

function orderTotal(order) {
  const explicit = order?.totalPrice ?? order?.total ?? order?.amount;
  if (explicit !== undefined && explicit !== null) return numberValue(explicit);
  const price = order?.unitPrice ?? order?.price ?? order?.productPrice ?? order?.product?.price;
  return numberValue(price) * Math.max(1, numberValue(order?.quantity || 1));
}

function engagementValue(item) {
  return numberValue(item?.likeCount || item?.reactionCount) + numberValue(item?.commentCount) + numberValue(item?.shareCount);
}

function authorName(item) {
  return item?.authorName || item?.sharedByName || item?.authorEmail || item?.email || "Creator";
}

function productId(product) {
  return String(product?.id ?? product?.productId ?? "");
}

function productName(product) {
  return String(product?.name || product?.title || product?.productName || "Product");
}

function orderProductId(order) {
  return String(order?.productId ?? order?.product?.id ?? order?.product?.productId ?? "");
}

function orderProductName(order) {
  return String(order?.productName || order?.product?.name || "");
}

function matchesProduct(order, product) {
  const id = productId(product);
  if (id && orderProductId(order) === id) return true;
  return orderProductName(order).toLowerCase() === productName(product).toLowerCase();
}

function usagePercent(value, total) {
  return total ? Number(((value / total) * 100).toFixed(1)) : 0;
}

export default function AnalyticsPage() {
  const { pushToast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [adminStats, setAdminStats] = useState({});
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [feed, setFeed] = useState([]);
  const [events, setEvents] = useState([]);
  const [saved, setSaved] = useState([]);
  const roles = [user?.role, user?.roles, user?.authority, user?.authorities].flat().filter(Boolean).map(String);
  const isAdmin = roles.some((role) => role === "ADMIN" || role === "ROLE_ADMIN");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [statsRes, productsRes, ordersRes, feedRes, eventsRes] = await Promise.allSettled([
          isAdmin ? adminService.getStats() : Promise.resolve({ data: { data: {} } }),
          marketplaceService.listProducts({ page: 0, size: 100 }),
          orderService.myOrders({ page: 0, size: 100 }),
          feedService.getFeed(),
          calendarService.listMyEvents({ page: 0, size: 100 })
        ]);
        if (statsRes.status === "fulfilled") setAdminStats(statsRes.value?.data?.data || statsRes.value?.data || {});
        if (productsRes.status === "fulfilled") setProducts(unwrap(productsRes.value));
        if (ordersRes.status === "fulfilled") setOrders(unwrap(ordersRes.value));
        if (feedRes.status === "fulfilled") setFeed(Array.isArray(feedRes.value?.data) ? feedRes.value.data : unwrap(feedRes.value));
        if (eventsRes.status === "fulfilled") setEvents(unwrap(eventsRes.value));
        setSaved(getSavedProducts());
      } catch {
        pushToast("Failed to load analytics", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAdmin, pushToast]);

  const activeUsers = useMemo(() => {
    const map = new Map();
    feed.forEach((item) => {
      const name = authorName(item);
      map.set(name, (map.get(name) || 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [feed]);

  const metrics = useMemo(() => {
    const revenue = orders.reduce((sum, order) => sum + orderTotal(order), 0);
    const engagement = feed.reduce((sum, item) => sum + engagementValue(item), 0);
    return {
      users: adminStats.totalUsers ?? adminStats.users ?? 0,
      activeUsers: adminStats.activeUsers ?? activeUsers.length,
      posts: adminStats.totalPosts ?? feed.length,
      orders: adminStats.productOrders ?? orders.length,
      revenue,
      engagement,
      saved: saved.length,
      calendar: events.length
    };
  }, [activeUsers.length, adminStats, events.length, feed, orders, saved.length]);

  const productRows = useMemo(() => products.map((product) => {
    const relatedOrders = orders.filter((order) => matchesProduct(order, product));
    const savedCount = saved.filter((item) => {
      const savedId = String(item?.id ?? item?.productId ?? "");
      return (savedId && savedId === productId(product)) || productName(item).toLowerCase() === productName(product).toLowerCase();
    }).length;
    const revenue = relatedOrders.reduce((sum, order) => sum + orderTotal(order), 0);
    return {
      product,
      category: product.category || product.productCategory || "General",
      price: numberValue(product.price),
      stock: numberValue(product.stock),
      orders: relatedOrders.length,
      revenue,
      saved: savedCount
    };
  }).sort((a, b) => b.orders - a.orders || b.saved - a.saved || b.revenue - a.revenue || b.stock - a.stock).slice(0, 5), [orders, products, saved]);

  const likeCount = feed.reduce((sum, item) => sum + numberValue(item.likeCount || item.reactionCount), 0);
  const commentCount = feed.reduce((sum, item) => sum + numberValue(item.commentCount), 0);
  const shareCount = feed.reduce((sum, item) => sum + numberValue(item.shareCount), 0);
  const saveCount = metrics.saved;
  const engagementTotal = Math.max(1, likeCount + commentCount + shareCount + saveCount);
  const conversionRate = products.length ? (orders.length / products.length) * 100 : 0;
  const topCategory = productRows[0]?.category || products[0]?.category || products[0]?.productCategory || "Products";
  const mostSavedProduct = saved[0]?.name || saved[0]?.title || "No saved product";
  const platformActivity = metrics.posts + metrics.orders + metrics.calendar + metrics.saved;
  const usageTotal = Math.max(1, feed.length + products.length + orders.length + events.length + saved.length);

  const metricCards = [
    { icon: "users", label: "Total Users", value: formatNumber(metrics.users), trend: isAdmin ? "From admin stats" : "Admin-only count", tone: "blue" },
    { icon: "order", label: "Product Orders", value: formatNumber(metrics.orders), trend: `${orders.length} loaded order records`, tone: "purple" },
    { icon: "analytics", label: "Revenue", value: formatMoney(metrics.revenue), trend: `${orders.length} real orders loaded`, tone: "blue" },
    { icon: "heart", label: "Engagement", value: formatNumber(metrics.engagement), trend: `${feed.length} feed records loaded`, tone: "pink" },
    { icon: "user", label: "Active Users", value: formatNumber(metrics.activeUsers), trend: `${activeUsers.length} creators in feed`, tone: "green" },
    { icon: "chat", label: "Total Posts", value: formatNumber(metrics.posts), trend: `${feed.length} feed records loaded`, tone: "purple" },
    { icon: "bookmark", label: "Saved Products", value: formatNumber(metrics.saved), trend: "Saved product records", tone: "purple" },
    { icon: "calendar", label: "Calendar Usage", value: formatNumber(metrics.calendar), trend: metrics.calendar ? `${metrics.calendar} events loaded` : "No events yet", tone: "purple", negative: !metrics.calendar }
  ];

  const engagementBreakdown = [
    { label: "Likes", value: likeCount, color: "#8b5cf6" },
    { label: "Comments", value: commentCount, color: "#3b82f6" },
    { label: "Shares", value: shareCount, color: "#ec5bd8" },
    { label: "Saves", value: saveCount, color: "#fb923c" }
  ];

  const usageRows = [
    { label: "Social Feed", value: usagePercent(feed.length, usageTotal), tone: "purple" },
    { label: "Marketplace", value: usagePercent(products.length, usageTotal), tone: "blue" },
    { label: "Orders", value: usagePercent(orders.length, usageTotal), tone: "pink" },
    { label: "Calendar", value: usagePercent(events.length, usageTotal), tone: "orange" },
    { label: "Bookmarks", value: usagePercent(saved.length, usageTotal), tone: "green" }
  ];

  const feedSeries = dailySeries(feed, () => 1);
  const orderSeries = dailySeries(orders, () => 1);
  const revenueSeries = dailySeries(orders, orderTotal);
  const engagementSeries = dailySeries(feed, engagementValue);

  if (loading) return <LoadingState text="Loading analytics..." />;

  return (
    <PageGrid className="analytics-dashboard analytics-reference-page">
      <div className="analytics-reference-layout">
        <main className="analytics-reference-main">
          <div className="analytics-overview-grid">
            <Card className="analytics-hero-card">
              <span className="analytics-hero-icon"><Icon name="analytics" /></span>
              <div>
                <p className="eyebrow">Platform Intelligence</p>
                <h2>Analytics across social, marketplace, calendar, bookmarks and XP growth.</h2>
                <p>Every visible number on this page is now calculated from loaded backend records or saved product records.</p>
                <StatusBadge status="Real data" tone="green" />
              </div>
            </Card>

            <div className="analytics-metric-grid">
              {metricCards.map((metric) => <AnalyticsMetricCard key={metric.label} {...metric} />)}
            </div>
          </div>

          <div className="analytics-chart-row">
            <ReferenceChartCard title="Feed Activity By Date" values={feedSeries} legends={["Feed records"]} />
            <ReferenceChartCard title="Orders By Date" values={orderSeries} tone="blue" legends={["Orders"]} />
            <ReferenceChartCard title="Revenue By Date" values={revenueSeries} tone="green" legends={["Revenue (USD)"]} />
          </div>

          <div className="analytics-detail-row">
            <Card className="analytics-engagement-card">
              <SectionHeader title="Engagement Breakdown" action={<StatusBadge status="Loaded records" tone="blue" />} />
              <div className="engagement-breakdown-grid">
                <div className="engagement-donut" style={{ "--likes": `${(likeCount / engagementTotal) * 100}%`, "--comments": `${((likeCount + commentCount) / engagementTotal) * 100}%`, "--shares": `${((likeCount + commentCount + shareCount) / engagementTotal) * 100}%` }}>
                  <strong>{formatNumber(metrics.engagement)}</strong>
                  <span>Total</span>
                </div>
                <div className="engagement-legend-list">
                  {engagementBreakdown.map((item) => (
                    <div key={item.label} className="engagement-legend-row" style={{ "--dot": item.color }}>
                      <span>{item.label}</span>
                      <strong>{formatNumber(item.value)}</strong>
                      <small>{percent((item.value / engagementTotal) * 100)}</small>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <ReferenceChartCard title="Engagement By Date" values={engagementSeries} tone="purple" legends={["Last 12 days"]} wide />
          </div>

          <div className="analytics-bottom-row">
            <Card className="top-products-card">
              <SectionHeader title="Product Performance" action={<StatusBadge status="Orders + stock" tone="blue" />} />
              {productRows.length ? (
                <div className="analytics-table-wrap">
                  <table className="analytics-product-table">
                    <thead><tr><th>#</th><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Orders</th><th>Revenue</th><th>Saved</th></tr></thead>
                    <tbody>
                      {productRows.slice(0, 4).map((row, index) => (
                        <tr key={productId(row.product) || productName(row.product) || index}>
                          <td>{index + 1}</td>
                          <td><ProductMini product={row.product} /></td>
                          <td>{row.category}</td>
                          <td>{formatMoney(row.price)}</td>
                          <td>{formatNumber(row.stock)}</td>
                          <td>{formatNumber(row.orders)}</td>
                          <td>{formatMoney(row.revenue)}</td>
                          <td>{formatNumber(row.saved)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyPanel icon="bag" title="No product analytics yet" subtitle="Products will appear here after marketplace activity is available." />
              )}
            </Card>

            <Card className="platform-usage-card">
              <SectionHeader title="Platform Usage Breakdown" action={<StatusBadge status="Loaded records" tone="blue" />} />
              <div className="usage-breakdown-list">
                {usageRows.map((row) => <UsageRow key={row.label} {...row} />)}
              </div>
            </Card>
          </div>
        </main>

        <aside className="analytics-insight-rail">
          <div className="analytics-rail-actions">
            <StatusBadge status="Live loaded" tone="green" />
          </div>
          <Card className="analytics-insights-card">
            <SectionHeader title="Insights" action={<Icon name="analytics" />} />
            <InsightCard icon="bag" title="Top Category" value={topCategory} subtitle={`${formatNumber(productRows[0]?.orders || 0)} orders`} tone="blue" />
            <InsightCard icon="bookmark" title="Most Saved Product" value={mostSavedProduct} subtitle={`${formatNumber(metrics.saved)} saves`} tone="pink" />
            <InsightCard icon="analytics" title="Conversion Rate" value={percent(conversionRate)} subtitle="orders vs product listings" tone="green" />
            <InsightCard icon="bell" title="Reminder Activity" value={formatNumber(metrics.calendar)} subtitle="calendar events" tone="orange" />
            <InsightCard icon="spark" title="Platform Activity" value={formatNumber(platformActivity)} subtitle="loaded live records" tone="purple" />
          </Card>

          <Card className="active-creators-card">
            <SectionHeader title="Most Active Users" />
            {activeUsers.length ? (
              <ul className="panel-list compact-panel-list">
                {activeUsers.map(([name, count]) => (
                  <li key={name} className="panel-row">
                    <div><strong>{name}</strong><span>{count} feed item{count === 1 ? "" : "s"}</span></div>
                    <StatusBadge status="Feed activity" tone="blue" />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyPanel icon="user" title="No activity yet" subtitle="Feed activity will appear here." />
            )}
          </Card>
        </aside>
      </div>
    </PageGrid>
  );
}

function AnalyticsMetricCard({ icon, label, value, trend, tone = "blue", negative = false }) {
  return (
    <Card className="analytics-metric-card">
      <span className={`stat-icon stat-${tone}`}><Icon name={icon} /></span>
      <div><span>{label}</span><strong>{value}</strong><small className={negative ? "metric-negative" : ""}>{trend}</small></div>
    </Card>
  );
}

function ReferenceChartCard({ title, values, tone = "purple", legends = [], wide = false }) {
  return (
    <Card className={`analytics-reference-chart ${wide ? "analytics-chart-wide" : ""}`}>
      <SectionHeader title={title} action={<StatusBadge status="Real data" tone="blue" />} />
      <div className="analytics-chart-legends">
        {legends.map((legend, index) => <span key={legend} className={`legend-${index}`}>{legend}</span>)}
      </div>
      <LineChart values={values} tone={tone} />
    </Card>
  );
}

function InsightCard({ icon, title, value, subtitle, tone }) {
  return <article className={`analytics-insight-card insight-${tone}`}><span><Icon name={icon} /></span><div><small>{title}</small><strong>{value}</strong><p>{subtitle}</p></div></article>;
}

function UsageRow({ label, value, tone }) {
  return <div className={`usage-row usage-${tone}`}><span>{label}</span><div><i style={{ width: `${value}%` }} /></div><strong>{value.toFixed(1)}%</strong></div>;
}

function ProductMini({ product }) {
  return <span className="analytics-product-mini">{product.imageUrl ? <img src={product.imageUrl} alt={productName(product)} /> : <i><Icon name="bag" /></i>}<strong>{productName(product)}</strong></span>;
}