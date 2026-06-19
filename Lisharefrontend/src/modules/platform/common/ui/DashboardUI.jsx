import { createPortal } from "react-dom";

export function Icon({ name = "spark", className = "" }) {
  const icons = {
    home: <path d="m3.5 10.8 8.5-7 8.5 7V20a1 1 0 0 1-1 1h-5.2v-6.3H9.7V21H4.5a1 1 0 0 1-1-1z" />,
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.7 20c.8-4 3.5-6 7.3-6s6.5 2 7.3 6" />
      </>
    ),
    users: (
      <>
        <circle cx="8.2" cy="8.4" r="3.2" />
        <circle cx="16.4" cy="8.9" r="2.8" />
        <path d="M2.8 20c.6-3.5 2.6-5.2 5.4-5.2s4.8 1.7 5.4 5.2M13.2 15.3c2.8.1 4.7 1.6 5.2 4.7" />
      </>
    ),
    chat: <path d="M5 4h14a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2H9.4L4 20.2V6a2 2 0 0 1 2-2z" />,
    bag: <path d="M5.2 7.2h13.6l-1 12.2a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9zM8.3 7.2a3.7 3.7 0 0 1 7.4 0" />,
    marketplace: (
      <>
        <path d="M4 9h16l-1 11H5z" />
        <path d="M7 9V7a5 5 0 0 1 10 0v2M4.8 9l1.4-4h11.6l1.4 4" />
        <path d="M8.5 13h7M8.5 16h4" />
      </>
    ),
    business: (
      <>
        <path d="M4 21V7l8-4 8 4v14" />
        <path d="M8 21v-6h8v6M8 10h.1M12 10h.1M16 10h.1" />
      </>
    ),
    order: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M8 9h8M8 13h8M8 17h5" />
      </>
    ),
    calendar: (
      <>
        <rect x="4" y="5.5" width="16" height="15" rx="2" />
        <path d="M8 3.5v4M16 3.5v4M4 10h16" />
      </>
    ),
    bookmark: <path d="M7 4h10a1 1 0 0 1 1 1v16l-6-4-6 4V5a1 1 0 0 1 1-1z" />,
    analytics: <path d="M4 20V9M9.3 20V4M14.7 20v-7M20 20v-4" />,
    search: <path d="M21 21l-4.4-4.4M18 11a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" />,
    back: <path d="M19 12H5M11 6l-6 6 6 6" />,
    mail: (
      <>
        <rect x="4" y="6" width="16" height="12" rx="2" />
        <path d="m5 8 7 5 7-5" />
      </>
    ),
    bell: (
      <>
        <path d="M18 15.7V11a6 6 0 0 0-12 0v4.7L4.5 18h15z" />
        <path d="M9.6 20a2.5 2.5 0 0 0 4.8 0" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
      </>
    ),
    logout: <path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 16l4-4-4-4M20 12H10" />,
    plus: <path d="M12 5v14M5 12h14" />,
    image: (
      <>
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <circle cx="8.5" cy="9" r="1.4" />
        <path d="M5.5 17 10 12.5l3 3 2.2-2.2L19 17" />
      </>
    ),
    video: (
      <>
        <rect x="4" y="6" width="11" height="12" rx="2" />
        <path d="m15 10 5-3v10l-5-3z" />
      </>
    ),
    gif: <path d="M5 7h5M5 12h4M5 17h5M13 7v10M17 7h4M17 12h3" />,
    smile: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M9 10h.1M15 10h.1M8.8 14.5c1.8 1.6 4.6 1.6 6.4 0" />
      </>
    ),
    poll: <path d="M5 19V9M12 19V5M19 19v-7" />,
    pin: (
      <>
        <path d="M12 21s7-5.3 7-11a7 7 0 1 0-14 0c0 5.7 7 11 7 11z" />
        <circle cx="12" cy="10" r="2.4" />
      </>
    ),
    heart: <path d="M12 20s-7.4-4.6-8.7-9.2C2.5 8 4.2 5.5 7 5.5c2 0 3.2 1.1 4 2.4.8-1.3 2-2.4 4-2.4 2.8 0 4.5 2.5 3.7 5.3C19.4 15.4 12 20 12 20z" />,
    send: (
      <>
        <path d="M21 3 10.8 13.2" />
        <path d="m21 3-6.4 18-4.1-7.8L3 9.4z" />
      </>
    ),
    share: <path d="M15 6l4 4-4 4M19 10H9.5A5.5 5.5 0 0 0 4 15.5V18" />,
    save: <path d="M7 4h10a1 1 0 0 1 1 1v16l-6-4-6 4V5a1 1 0 0 1 1-1z" />,
    edit: <path d="m4 16.5-.8 4.3 4.3-.8L18.7 8.8l-3.5-3.5zM14.5 6l3.5 3.5" />,
    trash: (
      <>
        <path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" />
      </>
    ),
    eye: (
      <>
        <path d="M2.8 12s3.3-6 9.2-6 9.2 6 9.2 6-3.3 6-9.2 6-9.2-6-9.2-6z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    star: <path d="m12 3 2.5 5.5 6 .7-4.4 4 1.2 5.8-5.3-3-5.3 3 1.2-5.8-4.4-4 6-.7z" />,
    check: <path d="m5 12 4 4 10-10" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    spark: <path d="M12 3.5 13.8 8l4.7 1.3-4.7 1.3L12 15l-1.8-4.4-4.7-1.3L10.2 8zM18.5 15l.8 2 2.2.7-2.2.7-.8 2-.8-2-2.2-.7 2.2-.7z" />,
    phone: <path d="M7 4h4l1 4-2.4 1.4a12 12 0 0 0 5 5L16 12l4 1v4a2 2 0 0 1-2 2A14 14 0 0 1 5 6a2 2 0 0 1 2-2z" />,
    more: <path d="M5 12h.1M12 12h.1M19 12h.1" />,
    invoice: <path d="M7 3h10v18l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4zM9 8h6M9 12h6M9 16h4" />,
    truck: <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7zM7 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />,
    mic: <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zM5 11a7 7 0 0 0 14 0M12 18v3" />,
    attach: <path d="M8 12.8 14.8 6a3.2 3.2 0 1 1 4.5 4.5l-8.8 8.8a5 5 0 0 1-7.1-7.1l8.5-8.5" />,
    grid: <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
  };

  return (
    <svg className={`ui-icon ${className}`.trim()} viewBox="0 0 24 24" aria-hidden="true">
      {icons[name] || icons.spark}
    </svg>
  );
}

export function PageGrid({ children, className = "" }) {
  return <div className={`dash-page ${className}`.trim()}>{children}</div>;
}

export function Card({ children, className = "", as: Tag = "section" }) {
  return <Tag className={`dash-card ${className}`.trim()}>{children}</Tag>;
}

export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="dash-section-header">
      <div>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {action ? <div className="dash-section-action">{action}</div> : null}
    </div>
  );
}

export function StatCard({ icon = "analytics", label, value, trend, tone = "blue", onClick }) {
  const content = (
    <>
      <span className={`stat-icon stat-${tone}`}>
        <Icon name={icon} />
      </span>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
        {trend ? <small>{trend}</small> : null}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" className="dash-card stat-card stat-card-button" onClick={onClick}>
        {content}
      </button>
    );
  }

  return (
    <Card className="stat-card">
      {content}
    </Card>
  );
}

export function OverviewHero({ icon = "spark", eyebrow, title, subtitle, stats = [] }) {
  return (
    <div className="overview-hero">
      <Card className="overview-intro">
        <span className="hero-glow-icon">
          <Icon name={icon} />
        </span>
        <div>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </Card>
      <Card className="overview-stats">
        {stats.map((stat) => (
          <div key={stat.label} className="overview-stat">
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            {stat.trend ? <small>{stat.trend}</small> : null}
          </div>
        ))}
      </Card>
    </div>
  );
}

export function SearchBar({ value, onChange, placeholder = "Search...", onSubmit, className = "" }) {
  return (
    <form
      className={`dash-search ${className}`.trim()}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.();
      }}
    >
      <Icon name="search" />
      <input value={value} onChange={(event) => onChange?.(event.target.value)} placeholder={placeholder} />
      <button type="submit">Search</button>
    </form>
  );
}

export function GradientButton({ children, icon, className = "", ...props }) {
  return (
    <button className={`gradient-btn ${className}`.trim()} type="button" {...props}>
      {icon ? <Icon name={icon} /> : null}
      {children}
    </button>
  );
}

export function Button({ children, icon, variant = "secondary", className = "", ...props }) {
  if (variant === "gradient") {
    return <GradientButton icon={icon} className={className} {...props}>{children}</GradientButton>;
  }

  return (
    <button className={`ui-btn ui-btn-${variant} ${className}`.trim()} type="button" {...props}>
      {icon ? <Icon name={icon} /> : null}
      {children}
    </button>
  );
}

export function Tabs({ tabs, active, onChange, className = "" }) {
  return (
    <div className={`dash-tabs ${className}`.trim()} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          className={active === tab.value ? "active" : ""}
          onClick={() => onChange(tab.value)}
        >
          {tab.icon ? <Icon name={tab.icon} /> : null}
          <span>{tab.label}</span>
          {tab.count !== undefined ? <strong>{tab.count}</strong> : null}
        </button>
      ))}
    </div>
  );
}

export function StatusBadge({ status, tone }) {
  const normalized = String(status || "Pending").toLowerCase().replace(/\s+/g, "-");
  return <span className={`status-badge status-${tone || normalized}`}>{status}</span>;
}

export function Avatar({ name = "User", src, size = "md", online = null, className = "" }) {
  const initial = String(name || "U").trim().slice(0, 1).toUpperCase() || "U";
  const showPresence = typeof online === "boolean";
  const isOnline = Boolean(online);
  return (
    <span className={`ui-avatar avatar-${size} ${className}`.trim()}>
      {src ? <img src={src} alt={name} /> : initial}
      {showPresence ? (
        <i
          className={`avatar-presence ${isOnline ? "online" : "offline"}`}
          title={isOnline ? "Online" : "Offline"}
          aria-hidden="true"
        />
      ) : null}
    </span>
  );
}

export function Modal({ open, title, subtitle, children, footer, onClose, className = "" }) {
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className={`ui-modal ${className}`.trim()} onMouseDown={(event) => event.stopPropagation()}>
        <header className="ui-modal-header">
          <div>
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close modal">
            <Icon name="close" />
          </button>
        </header>
        <div className="ui-modal-body">{children}</div>
        {footer ? <footer className="ui-modal-footer">{footer}</footer> : null}
      </section>
    </div>,
    document.body
  );
}

export function EmptyPanel({ icon = "spark", title, subtitle, action }) {
  return (
    <div className="empty-panel">
      <span>
        <Icon name={icon} />
      </span>
      <h3>{title}</h3>
      {subtitle ? <p>{subtitle}</p> : null}
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export function MiniChart({ values = [], tone = "blue" }) {
  const max = Math.max(...values, 1);
  return (
    <div className={`mini-chart chart-${tone}`} aria-hidden="true">
      {values.map((value, index) => (
        <span key={`${value}-${index}`} style={{ height: `${Math.max(10, (value / max) * 100)}%` }} />
      ))}
    </div>
  );
}

export function LineChart({ values = [], tone = "purple" }) {
  const max = Math.max(...values, 1);
  const points = values.map((value, index) => {
    const x = values.length <= 1 ? 0 : (index / (values.length - 1)) * 100;
    const y = 100 - (value / max) * 84 - 8;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg className={`line-chart chart-${tone}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} />
    </svg>
  );
}

export function ProductCard({ product, saved, onSave, onView, onCart, onEdit, onDelete, cta = "Add to cart" }) {
  const price = Number(product?.price || 0);
  const name = product?.name || product?.title || "Product";
  const seller = product?.businessPageName || product?.seller || "AgroLink Seller";
  const rating = product?.rating ?? product?.averageRating;
  const soldCount = product?.soldCount ?? product?.orderCount ?? product?.ordersCount;
  const stock = Number(product?.stock || 0);
  const sellerVerified = Boolean(product?.sellerVerified || product?.businessVerified || product?.verifiedSeller);
  return (
    <Card className="product-card-v2" as="article">
      <div className="product-media">
        {product?.imageUrl ? <img src={product.imageUrl} alt={name} /> : <Icon name="bag" />}
        <button type="button" className={`round-action ${saved ? "active" : ""}`} onClick={onSave} aria-label="Save product">
          <Icon name="heart" />
        </button>
      </div>
      <div className="product-info">
        <p className="seller-line">{seller}{sellerVerified ? <StatusBadge status="Verified" tone="blue" /> : null}</p>
        <h3>{name}</h3>
        <p>{product?.description || product?.category || "Marketplace listing."}</p>
        <div className="product-meta-row">
          <strong>${price.toFixed(2)}</strong>
          {rating !== undefined && rating !== null && rating !== "" ? <span><Icon name="star" /> {Number(rating).toFixed(1)}</span> : null}
          {soldCount !== undefined && soldCount !== null ? <span>{Number(soldCount || 0)} sold</span> : <span>{stock} in stock</span>}
        </div>
      </div>
      <div className="product-actions">
        <Button icon="eye" onClick={onView}>View</Button>
        <Button icon="bag" variant="gradient" onClick={onCart}>{cta}</Button>
      </div>
      {(onEdit || onDelete) ? (
        <div className="product-admin-actions">
          {onEdit ? <Button icon="edit" onClick={onEdit}>Update</Button> : null}
          {onDelete ? <Button icon="trash" onClick={onDelete}>Delete</Button> : null}
        </div>
      ) : null}
    </Card>
  );
}
function hasUserVerifiedBadge(user) {
  return Boolean(user?.profileVerified || user?.verifiedBadge || Number(user?.verifiedXp || 0) >= 100);
}

export function UserCard({ user, primaryAction, secondaryAction, status = "Profile", onClick }) {
  const name = user?.displayName || user?.name || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "AgroLink User";
  const handle = user?.handle || user?.email || `@${name.toLowerCase().replace(/[^a-z0-9]+/g, "")}`;
  const isOnline = Boolean(user?.online || user?.isOnline || status === "Online");
  return (
    <Card className="user-card-v2" as="article">
      <button type="button" className="user-card-profile-button" onClick={onClick} disabled={!onClick}>
        <Avatar name={name} src={user?.profileImageUrl || user?.imageUrl} size="xl" online={isOnline} />
        <h3>{name}{hasUserVerifiedBadge(user) ? <StatusBadge status="Verified XP" tone="blue" /> : null}</h3>
      </button>
      <p>{handle}</p>
      <span className="mutual-line">{user?.role || user?.title || "Community member"} - {user?.mutual || user?.mutualFriends || 0} mutual</span>
      <div className="avatar-row">
        {[0, 1, 2].map((item) => <Avatar key={item} name={`${name}${item}`} size="xs" />)}
      </div>
      <div className="user-card-actions">
        {primaryAction}
        {secondaryAction}
      </div>
    </Card>
  );
}
