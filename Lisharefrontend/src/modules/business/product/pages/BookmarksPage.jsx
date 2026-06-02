import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  addCartItem,
  getCompareProducts,
  getSavedProducts,
  removeSavedProduct,
  toggleCompareProduct
} from "../utils/productStorage";
import { useToast } from "/src/modules/platform/common/hooks/useToast";
import {
  Button,
  Card,
  EmptyPanel,
  Icon,
  OverviewHero,
  PageGrid,
  ProductCard,
  SectionHeader,
  StatusBadge,
  Tabs
} from "/src/modules/platform/common/ui/DashboardUI";

export default function BookmarksPage() {
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const [saved, setSaved] = useState([]);
  const [compare, setCompare] = useState([]);
  const [tab, setTab] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [availability, setAvailability] = useState("");
  const [sort, setSort] = useState("newest");

  const sync = () => {
    setSaved(getSavedProducts());
    setCompare(getCompareProducts());
  };

  useEffect(() => {
    sync();
    window.addEventListener("lishare-product-storage", sync);
    return () => window.removeEventListener("lishare-product-storage", sync);
  }, []);

  const collections = useMemo(() => {
    const map = new Map();
    saved.forEach((item) => {
      const collection = item.collection || "Wishlist";
      if (!map.has(collection)) map.set(collection, []);
      map.get(collection).push(item);
    });
    return [...map.entries()].map(([name, items]) => ({ name, items }));
  }, [saved]);

  const priceDrops = useMemo(() => saved.filter((item) => Number(item.oldPrice || 0) > Number(item.price || 0)), [saved]);
  const categories = useMemo(() => [...new Set(saved.map((item) => item.category).filter(Boolean))], [saved]);

  const visibleProducts = useMemo(() => {
    let list = [...saved];
    const search = query.trim().toLowerCase();
    if (search) list = list.filter((item) => String(item.name || "").toLowerCase().includes(search) || String(item.businessPageName || "").toLowerCase().includes(search));
    if (category) list = list.filter((item) => item.category === category);
    if (availability === "available") list = list.filter((item) => item.available !== false && Number(item.stock ?? 1) > 0);
    if (tab === "wishlist") list = list.filter((item) => (item.collection || "Wishlist") === "Wishlist");
    if (tab === "price") list = priceDrops;
    if (tab === "recent") list = list.sort((a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0));
    else if (sort === "priceAsc") list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    else if (sort === "priceDesc") list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    return list;
  }, [availability, category, priceDrops, query, saved, sort, tab]);

  const moveToCart = (product) => {
    addCartItem(product, 1);
    pushToast("Saved product moved to cart", "success");
  };

  const remove = (product) => {
    setSaved(removeSavedProduct(product.id));
    pushToast("Product removed from bookmarks", "success");
  };

  const compareProduct = (product) => {
    setCompare(toggleCompareProduct(product));
    pushToast("Compare list updated", "success");
  };

  return (
    <PageGrid className="bookmarks-dashboard">
      <OverviewHero
        icon="bookmark"
        eyebrow="Your saved space"
        title="All your favorite products in one place"
        subtitle="Saved products stay here for later viewing. Saving does not place an order."
        stats={[
          { label: "Saved Products", value: saved.length, trend: "Reference only" },
          { label: "Collections", value: collections.length, trend: "Organized" },
          { label: "Price Drops", value: priceDrops.length, trend: "Alerts" },
          { label: "Followed Shops", value: new Set(saved.map((item) => item.businessPageId)).size, trend: "Sellers" }
        ]}
      />

      <div className="bookmarks-layout">
        <main className="bookmarks-main">
          <Card className="filter-panel">
            <Tabs
              active={tab}
              onChange={setTab}
              tabs={[
                { value: "all", label: "All Saved", icon: "bookmark", count: saved.length },
                { value: "wishlist", label: "Wishlist", icon: "heart", count: saved.filter((item) => (item.collection || "Wishlist") === "Wishlist").length },
                { value: "collections", label: "Collections", icon: "grid", count: collections.length },
                { value: "price", label: "Price Alerts", icon: "bell", count: priceDrops.length },
                { value: "recent", label: "Recently Saved", icon: "calendar" }
              ]}
            />
            <div className="filter-grid bookmark-filter-grid">
              <label><Icon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search saved products..." /></label>
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="">All Categories</option>
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <select>
                <option>All Price Ranges</option>
                <option>Under $50</option>
                <option>$50 - $200</option>
                <option>$200+</option>
              </select>
              <select value={availability} onChange={(event) => setAvailability(event.target.value)}>
                <option value="">All Availability</option>
                <option value="available">Available</option>
              </select>
              <select value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="newest">Sort: Newest</option>
                <option value="priceAsc">Price: Low</option>
                <option value="priceDesc">Price: High</option>
              </select>
              <Button icon="analytics" onClick={() => pushToast("Bookmark filters applied", "success")}>Filters</Button>
            </div>
          </Card>

          {tab === "collections" ? (
            <Card>
              <SectionHeader title="Your Collections" action={<Button icon="plus" onClick={() => pushToast("Create a collection by saving products with a collection name.", "success")}>New Collection</Button>} />
              <div className="collection-grid">
                {collections.map((collection) => (
                  <article key={collection.name}>
                    <div>{collection.items.slice(0, 3).map((item) => item.imageUrl ? <img key={item.id} src={item.imageUrl} alt={item.name} /> : <span key={item.id}><Icon name="bag" /></span>)}</div>
                    <strong>{collection.name}</strong>
                    <span>{collection.items.length} items</span>
                  </article>
                ))}
                {!collections.length ? <EmptyPanel icon="grid" title="No collections yet" subtitle="Saved product groups will appear here." /> : null}
              </div>
            </Card>
          ) : (
            <Card>
              <SectionHeader title={`${visibleProducts.length} Saved Products`} action={<div className="view-toggle"><button type="button" className={viewMode === "grid" ? "active" : ""} onClick={() => setViewMode("grid")}><Icon name="grid" /></button><button type="button" className={viewMode === "list" ? "active" : ""} onClick={() => setViewMode("list")}><Icon name="order" /></button></div>} />
              {visibleProducts.length === 0 ? <EmptyPanel icon="bookmark" title="No saved products" subtitle="Save products in Marketplace to view them here later." action={<Button variant="gradient" icon="bag" onClick={() => navigate("/marketplace")}>Open Marketplace</Button>} /> : null}
              <div className="products-grid-v2">
                {visibleProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={{
                      ...product,
                      description: product.oldPrice && Number(product.oldPrice) > Number(product.price)
                        ? `Price drop from $${Number(product.oldPrice).toFixed(2)}`
                        : product.description
                    }}
                    saved
                    cta="Move to Cart"
                    onSave={() => remove(product)}
                    onView={() => pushToast("Product details opened from saved list", "success")}
                    onCart={() => moveToCart(product)}
                  />
                ))}
              </div>
              <div className="bookmark-secondary-actions">
                {visibleProducts.map((product) => (
                  <div key={`actions-${product.id}`}>
                    <Button icon="analytics" onClick={() => compareProduct(product)}>Compare</Button>
                    <Button icon="trash" variant="danger" onClick={() => remove(product)}>Remove</Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </main>

        <aside className="side-stack">
          <Card>
            <SectionHeader title="Saved Summary" action={<button type="button" className="text-link" onClick={() => setTab("all")}>View all</button>} />
            <ul className="panel-list">
              <li className="panel-row"><div><strong>Total Saved Products</strong><span>Reference only</span></div><strong>{saved.length}</strong></li>
              <li className="panel-row"><div><strong>Total Collections</strong><span>Product groups</span></div><strong>{collections.length}</strong></li>
              <li className="panel-row"><div><strong>Price Drop Alerts</strong><span>Potential savings</span></div><strong>{priceDrops.length}</strong></li>
              <li className="panel-row"><div><strong>Estimated Value</strong><span>Saved catalog</span></div><strong>${saved.reduce((sum, item) => sum + Number(item.price || 0), 0).toFixed(2)}</strong></li>
            </ul>
            <Button variant="gradient" icon="bookmark" onClick={() => setTab("all")}>View All Saved</Button>
          </Card>

          <Card>
            <SectionHeader title="Price Drop Alerts" action={<button type="button" className="text-link" onClick={() => setTab("price")}>View all</button>} />
            <ul className="panel-list">
              {priceDrops.slice(0, 4).map((item) => (
                <li key={`drop-${item.id}`} className="panel-row">
                  <div className="cart-product-mini">
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : <Icon name="bag" />}
                    <div><strong>{item.name}</strong><span>${Number(item.price).toFixed(2)} was ${Number(item.oldPrice).toFixed(2)}</span></div>
                  </div>
                  <StatusBadge status="Drop" tone="green" />
                </li>
              ))}
              {!priceDrops.length ? <li><EmptyPanel icon="bell" title="No price drops" subtitle="Alerts show when old price is above current price." /></li> : null}
            </ul>
          </Card>

          <Card>
            <SectionHeader title="Recently Viewed" action={<button type="button" className="text-link" onClick={() => setTab("recent")}>View all</button>} />
            <div className="recent-strip">
              {saved.slice(0, 6).map((item) => item.imageUrl ? <img key={item.id} src={item.imageUrl} alt={item.name} /> : <span key={item.id}><Icon name="bag" /></span>)}
            </div>
          </Card>

          <Card>
            <SectionHeader title="Compare List" action={<StatusBadge status={`${compare.length} items`} tone="blue" />} />
            <div className="recent-strip">
              {compare.map((item) => item.imageUrl ? <img key={item.id} src={item.imageUrl} alt={item.name} /> : <span key={item.id}><Icon name="bag" /></span>)}
              <button type="button" className="compare-add" onClick={() => pushToast("Use Compare on a saved product to add it here.", "success")}><Icon name="plus" />Add</button>
            </div>
            <Button icon="analytics" onClick={() => pushToast(compare.length ? "Compare list ready" : "Add saved products before comparing", compare.length ? "success" : "error")}>View Compare</Button>
          </Card>
        </aside>
      </div>
    </PageGrid>
  );
}
