import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { marketplaceService } from "../services/marketplaceService";
import { orderService } from "/src/modules/business/order/services/orderService";
import { useAuth } from "/src/modules/platform/app/store";
import LoadingState from "/src/modules/platform/common/components/LoadingState";
import ErrorState from "/src/modules/platform/common/components/ErrorState";
import { useToast } from "/src/modules/platform/common/hooks/useToast";
import { toMediaUrl } from "/src/modules/platform/common/utils/mediaUrl";
import {
  addCartItem,
  clearCartItems,
  getCartItems,
  getSavedProducts,
  isProductSaved,
  removeSavedProduct,
  saveProduct,
  updateCartItem
} from "../utils/productStorage";
import {
  Avatar,
  Button,
  Card,
  EmptyPanel,
  Icon,
  LineChart,
  Modal,
  OverviewHero,
  PageGrid,
  ProductCard,
  SectionHeader,
  StatusBadge,
  Tabs
} from "/src/modules/platform/common/ui/DashboardUI";

const emptyProduct = {
  businessPageId: "",
  name: "",
  description: "",
  price: "",
  stock: "",
  category: "",
  imageUrl: ""
};

function unwrapProducts(response) {
  return response?.data?.data?.content || response?.data?.data || response?.data?.content || [];
}

function normalizeProduct(product) {
  return {
    ...product,
    id: product.id ?? product.productId,
    imageUrl: product.imageUrl ? toMediaUrl(product.imageUrl) : "",
    rating: product.rating ?? product.averageRating ?? null,
    soldCount: product.soldCount ?? product.orderCount ?? product.ordersCount ?? null
  };
}

function totalCart(cart) {
  return cart.reduce((total, item) => total + Number(item.product?.price || 0) * Number(item.quantity || 0), 0);
}

export default function MarketplacePage() {
  const { role } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [saved, setSaved] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [activeCategory, setActiveCategory] = useState("all");
  const [modal, setModal] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [imagePreview, setImagePreview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isBusiness = role === "ROLE_BUSINESS" || role === "ROLE_FARMER";

  const loadProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await marketplaceService.listProducts({
        page: 0,
        size: 48,
        q: query || undefined,
        query: query || undefined,
        category: category || activeCategory !== "all" ? (category || activeCategory) : undefined
      });
      setProducts(unwrapProducts(response).map(normalizeProduct));
      setSaved(getSavedProducts());
      setCart(getCartItems());
    } catch {
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const sync = () => {
      setSaved(getSavedProducts());
      setCart(getCartItems());
    };
    window.addEventListener("lishare-product-storage", sync);
    return () => window.removeEventListener("lishare-product-storage", sync);
  }, []);

  const categories = useMemo(() => {
    const values = [...new Set(products.map((item) => item.category).filter(Boolean))];
    return ["all", ...values.slice(0, 7)];
  }, [products]);
  const heroCategoryLabels = useMemo(() => {
    const loaded = categories.filter((item) => item !== "all").slice(0, 4);
    return loaded.length ? loaded : ["Fresh Produce", "Seeds", "Tools", "Organic"];
  }, [categories]);

  const visibleProducts = useMemo(() => {
    let list = [...products];
    const search = query.trim().toLowerCase();
    if (search) {
      list = list.filter((item) =>
        String(item.name || "").toLowerCase().includes(search)
        || String(item.businessPageName || "").toLowerCase().includes(search)
        || String(item.category || "").toLowerCase().includes(search)
      );
    }
    if (activeCategory !== "all") list = list.filter((item) => item.category === activeCategory);
    if (category) list = list.filter((item) => item.category === category);
    if (sortBy === "priceAsc") list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    else if (sortBy === "priceDesc") list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    else if (sortBy === "name") list.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
    else list.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
    return list;
  }, [activeCategory, category, products, query, sortBy]);

  const savedIds = useMemo(() => new Set(saved.map((item) => String(item.id ?? item.productId))), [saved]);
  const cartCount = cart.reduce((total, item) => total + Number(item.quantity || 0), 0);
  const inventoryChartValues = useMemo(() => products.slice(0, 10).map((item) => Number(item.stock || 0)), [products]);
  const cartQuantityForProduct = (productId) => cart.find((item) => String(item.product?.id) === String(productId))?.quantity || 0;

  const openProductModal = (mode, product = null) => {
    setSelectedProduct(product);
    setModal(mode);
    setImagePreview(product?.imageUrl || "");
    setProductForm(product ? {
      businessPageId: product.businessPageId || "",
      name: product.name || "",
      description: product.description || "",
      price: product.price || "",
      stock: product.stock || "",
      category: product.category || "",
      imageUrl: product.imageUrl || ""
    } : emptyProduct);
  };

  const toggleSave = (product) => {
    if (isProductSaved(product.id)) {
      setSaved(removeSavedProduct(product.id));
      pushToast("Product removed from bookmarks", "success");
    } else {
      setSaved(saveProduct(product));
      pushToast("Product saved for later", "success");
    }
  };

  const addToCart = (product) => {
    setCart(addCartItem(product, 1));
    pushToast("Added to cart", "success");
  };

  const updateQuantity = (productId, quantity) => {
    setCart(updateCartItem(productId, quantity));
  };

  const checkoutCart = async () => {
    if (!cart.length) return;
    setSubmitting(true);
    try {
      await Promise.all(cart.map((item) => orderService.createOrder({ productId: item.product.id, quantity: item.quantity })));
      setCart(clearCartItems());
      pushToast("Checkout completed", "success");
    } catch {
      pushToast("Checkout failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const submitProduct = async (event) => {
    event.preventDefault();
    if (!productForm.businessPageId || !productForm.name.trim() || productForm.price === "" || productForm.stock === "") {
      pushToast("Business page, name, price, and stock are required", "error");
      return;
    }
    setSubmitting(true);
    const payload = {
      businessPageId: Number(productForm.businessPageId),
      name: productForm.name.trim(),
      description: productForm.description.trim(),
      price: Number(productForm.price),
      stock: Number(productForm.stock),
      category: productForm.category.trim(),
      imageUrl: productForm.imageUrl.trim()
    };
    try {
      if (modal === "edit" && selectedProduct?.id) {
        await marketplaceService.updateProduct(selectedProduct.id, payload);
        pushToast("Product updated", "success");
      } else {
        await marketplaceService.createProduct(payload);
        pushToast("Product added", "success");
      }
      setModal(null);
      await loadProducts();
    } catch {
      pushToast(modal === "edit" ? "Failed to update product" : "Failed to add product", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteProduct = async () => {
    if (!selectedProduct?.id) return;
    setSubmitting(true);
    try {
      await marketplaceService.deleteProduct(selectedProduct.id);
      pushToast("Product deleted", "success");
      setModal(null);
      await loadProducts();
    } catch {
      pushToast("Failed to delete product", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState text="Loading marketplace..." />;
  if (error) return <ErrorState message={error} onRetry={loadProducts} />;

  return (
    <PageGrid className="marketplace-dashboard">
      <OverviewHero
        icon="bag"
        eyebrow="Shop smarter. Support better."
        title="Discover products from active seller pages"
        subtitle="Browse products, save favorites, manage cart items, and publish business listings from one marketplace workspace."
        stats={[
          { label: "Total Products", value: products.length, trend: "Live catalog" },
          { label: "Saved Products", value: saved.length, trend: "For later" },
          { label: "Cart Items", value: cartCount, trend: cartCount ? "Ready" : "Empty" },
          { label: "Active Shops", value: new Set(products.map((item) => item.businessPageId)).size, trend: "Seller pages" }
        ]}
      />

      <Card className="marketplace-reference-hero">
        <div className="marketplace-reference-copy">
          <span className="auth-badge">Product Market</span>
          <h2>Farm products, trusted sellers, and quick checkout in one place.</h2>
          <p>Use the reference support artwork as the marketplace atmosphere while keeping search, filters, cart, saved items, and business seller actions connected.</p>
          <form
            className="marketplace-hero-search"
            onSubmit={(event) => {
              event.preventDefault();
              loadProducts();
            }}
          >
            <Icon name="search" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search harvests, tools, shops or delivery products..." />
            <button type="submit">Search</button>
          </form>
          <div className="support-suggestion-row marketplace-topic-row" aria-label="Popular marketplace categories">
            {heroCategoryLabels.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  if (categories.includes(item)) {
                    setCategory("");
                    setActiveCategory(item);
                  } else {
                    setQuery(item);
                  }
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="marketplace-reference-art" aria-hidden="true">
          <span>Verified seller field</span>
        </div>
      </Card>

      <div className="market-layout marketplace-hub-layout">
        <aside className="marketplace-hub-nav">
          <div className="marketplace-nav-card">
            <span className="marketplace-nav-art" aria-hidden="true" />
            <strong>Marketplace</strong>
            <p>Products and shopping activity</p>
          </div>
          <nav aria-label="Marketplace tools">
            {[
              ["Dashboard", "home", () => window.scrollTo({ top: 0, behavior: "smooth" })],
              ["Discover Products", "bag", () => setActiveCategory("all")],
              ["Featured Shops", "grid", () => pushToast("Featured shops are shown below the catalog.", "success")],
              ["Categories", "spark", () => pushToast("Use category chips and filters to browse.", "success")],
              ["Seller Pages", "users", () => navigate("/business")],
              ["Add Product", "plus", () => isBusiness ? openProductModal("add") : pushToast("Business role required to add products.", "error")],
              ["My Products", "bag", () => isBusiness ? setActiveCategory("all") : pushToast("Seller tools are for business accounts.", "error")],
              ["Orders", "order", () => navigate("/orders")],
              ["Saved Items", "bookmark", () => navigate("/bookmarks")],
              ["Cart Items", "bag", () => pushToast(`${cartCount} cart item${cartCount === 1 ? "" : "s"} loaded.`, "success")]
            ].map(([label, icon, action], index) => (
              <button key={label} type="button" className={index === 0 ? "active" : ""} onClick={action}>
                <Icon name={icon} />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="market-main">
          <Card className="filter-panel">
            <SectionHeader
              title="Discover Products"
              action={isBusiness ? <Button variant="gradient" icon="plus" onClick={() => openProductModal("add")}>Add Product</Button> : null}
            />
            <div className="filter-grid market-filter-grid">
              <label><Icon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products, brands, or shops..." /></label>
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="">All Categories</option>
                {categories.filter((item) => item !== "all").map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="newest">Sort: Newest</option>
                <option value="priceAsc">Price: Low to High</option>
                <option value="priceDesc">Price: High to Low</option>
                <option value="name">Name</option>
              </select>
              <Button icon="search" variant="gradient" onClick={loadProducts}>Filters</Button>
            </div>
            <Tabs
              active={activeCategory}
              onChange={setActiveCategory}
              tabs={categories.map((item, index) => ({
                value: item,
                label: item === "all" ? "All" : item,
                icon: index % 2 ? "bag" : "spark"
              }))}
            />
          </Card>

          <Card className="product-section-card marketplace-product-list-card">
            <SectionHeader title="Product List" subtitle="Search, filter, inspect, save, cart, and seller-manage products from one table." action={<button type="button" className="text-link" onClick={() => { setQuery(""); setCategory(""); setActiveCategory("all"); }}>See all</button>} />
            {visibleProducts.length === 0 ? <EmptyPanel icon="bag" title="No products found" subtitle="Try another search, category, or seller filter." /> : null}
            <div className="dashboard-table-wrap marketplace-table-wrap">
              <table className="dashboard-table marketplace-products-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Views</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleProducts.slice(0, 10).map((product) => (
                    <tr key={`table-${product.id}`}>
                      <td>
                        <div className="table-product">
                          {product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <span className="placeholder"><Icon name="bag" /></span>}
                          <div>
                            <strong>{product.name || "Product"}</strong>
                            <span>SKU: AG-{String(product.id || "000").padStart(3, "0")} - {product.businessPageName || "AgroLink Seller"}</span>
                          </div>
                        </div>
                      </td>
                      <td><StatusBadge status={product.category || "General"} tone="green" /></td>
                      <td>${Number(product.price || 0).toFixed(2)}</td>
                      <td>{Number(product.stock || 0)} kg</td>
                      <td><StatusBadge status={Number(product.stock || 0) > 0 ? "Active" : "Out of Stock"} tone={Number(product.stock || 0) > 0 ? "green" : "red"} /></td>
                      <td>{Number(product.views || product.soldCount || product.orderCount || 0)}</td>
                      <td>
                        <div className="table-action-row">
                          <Button icon="eye" onClick={() => openProductModal("view", product)}>View</Button>
                          <Button icon="bag" variant="gradient" onClick={() => addToCart(product)}>Cart</Button>
                          {isBusiness ? <button className="icon-button" type="button" onClick={() => openProductModal("edit", product)} aria-label="Edit product"><Icon name="more" /></button> : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="marketplace-pagination-row">
              <span>Showing 1 to {Math.min(10, visibleProducts.length)} of {visibleProducts.length} products</span>
              <div>
                {[1, 2, 3, 4].map((page) => <button key={page} type="button" className={page === 1 ? "active" : ""}>{page}</button>)}
                <button type="button" aria-label="Next page"><Icon name="more" /></button>
              </div>
            </div>

            <div className="products-grid-v2 marketplace-card-backup">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  saved={savedIds.has(String(product.id))}
                  onSave={() => toggleSave(product)}
                  onView={() => openProductModal("view", product)}
                  onCart={() => addToCart(product)}
                  onEdit={isBusiness ? () => openProductModal("edit", product) : null}
                  onDelete={isBusiness ? () => openProductModal("delete", product) : null}
                />
              ))}
            </div>
          </Card>

          <Card>
            <SectionHeader title="Featured Shops" action={<StatusBadge status="Catalog sellers" tone="blue" />} />
            <div className="shop-strip">
              {[...new Map(products.map((item) => [item.businessPageId, item])).values()].slice(0, 8).map((shop) => (
                <article key={`shop-${shop.businessPageId}`}>
                  <Avatar name={shop.businessPageName || "Shop"} size="md" />
                  <div>
                    <strong>{shop.businessPageName || "AgroLink Shop"}</strong>
                    <span>{products.filter((item) => item.businessPageId === shop.businessPageId).length} products</span>
                  </div>
                  <StatusBadge status={`${products.filter((item) => item.businessPageId === shop.businessPageId).length} products`} tone="blue" />
                </article>
              ))}
            </div>
          </Card>

          {isBusiness ? (
            <Card>
              <SectionHeader title="Business Product Management" subtitle="Create, update, inspect, and remove listings with the same product modal workflow." />
              <div className="seller-analytics-grid">
                <StatBox label="Listings" value={visibleProducts.length} />
                <StatBox label="Cart Items" value={cartCount} />
                <StatBox label="Cart Subtotal" value={`$${totalCart(cart).toFixed(0)}`} />
                <StatBox label="Saved Products" value={saved.length} />
              </div>
            </Card>
          ) : null}
        </main>

        <aside className="side-stack">
          <Card>
            <SectionHeader title="Marketplace Insights" action={<button type="button" className="text-link" onClick={() => navigate("/analytics")}>View all</button>} />
            <ul className="panel-list">
              <li className="panel-row"><div><strong>{cartCount || 0} cart items</strong><span>Ready for checkout</span></div><Icon name="analytics" /></li>
              <li className="panel-row"><div><strong>{categories[1] || "Products"} category</strong><span>Based on active catalog</span></div><Icon name="spark" /></li>
            </ul>
            <LineChart values={inventoryChartValues.length ? inventoryChartValues : [0]} />
          </Card>

          <Card>
            <SectionHeader title="Cart Summary" action={<StatusBadge status={`${cartCount} items`} tone="purple" />} />
            <ul className="panel-list cart-list">
              {cart.length === 0 ? <li><EmptyPanel icon="bag" title="Cart is empty" subtitle="Add products to build an order." /></li> : null}
              {cart.map((item) => (
                <li className="panel-row cart-row" key={item.product.id}>
                  <div className="cart-product-mini">
                    {item.product.imageUrl ? <img src={item.product.imageUrl} alt={item.product.name} /> : <Icon name="bag" />}
                    <div>
                      <strong>{item.product.name}</strong>
                      <span>${Number(item.product.price || 0).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="qty-control">
                    <button type="button" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>+</button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="cart-total-row"><span>Subtotal</span><strong>${totalCart(cart).toFixed(2)}</strong></div>
            <Button variant="gradient" icon="bag" onClick={checkoutCart} disabled={!cart.length || submitting}>{submitting ? "Checking out..." : "Proceed to Checkout"}</Button>
            <Button onClick={() => setCart(clearCartItems())} disabled={!cart.length}>Clear Cart</Button>
          </Card>

          <Card>
            <SectionHeader title="Saved for Later" action={<StatusBadge status={`${saved.length} saved`} tone="blue" />} />
            <ul className="panel-list">
              {saved.slice(0, 4).map((item) => (
                <li className="panel-row" key={`saved-${item.id}`}>
                  <div className="cart-product-mini">
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : <Icon name="bookmark" />}
                    <div><strong>{item.name}</strong><span>${Number(item.price || 0).toFixed(2)}</span></div>
                  </div>
                  <Button icon="bag" onClick={() => addToCart(item)}>Cart</Button>
                </li>
              ))}
            </ul>
            <Button icon="bookmark" onClick={() => navigate("/bookmarks")}>View Saved Items</Button>
          </Card>
        </aside>
      </div>

      <Modal
        open={modal === "add" || modal === "edit"}
        title={modal === "edit" ? "Update Product" : "Add Product"}
        subtitle="Manage product details, pricing, stock, delivery notes, and media preview."
        onClose={() => setModal(null)}
        footer={(
          <>
            <Button onClick={() => setModal(null)}>Cancel</Button>
            <Button variant="gradient" icon="check" type="submit" form="product-form" disabled={submitting}>
              {submitting ? "Saving..." : (modal === "edit" ? "Update Product" : "Add Product")}
            </Button>
          </>
        )}
      >
        <form id="product-form" className="modal-grid two" onSubmit={submitProduct}>
          <label>Business page ID<input value={productForm.businessPageId} onChange={(event) => setProductForm((prev) => ({ ...prev, businessPageId: event.target.value }))} /></label>
          <label>Category<input value={productForm.category} onChange={(event) => setProductForm((prev) => ({ ...prev, category: event.target.value }))} /></label>
          <label>Product name<input value={productForm.name} onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))} /></label>
          <label>Price<input type="number" min="0" step="0.01" value={productForm.price} onChange={(event) => setProductForm((prev) => ({ ...prev, price: event.target.value }))} /></label>
          <label>Stock<input type="number" min="0" value={productForm.stock} onChange={(event) => setProductForm((prev) => ({ ...prev, stock: event.target.value }))} /></label>
          <label className="span-two">Description<textarea value={productForm.description} onChange={(event) => setProductForm((prev) => ({ ...prev, description: event.target.value }))} /></label>
          <label>Image URL<input value={productForm.imageUrl} onChange={(event) => { setProductForm((prev) => ({ ...prev, imageUrl: event.target.value })); setImagePreview(event.target.value); }} /></label>
          <div className="product-modal-preview span-two">
            {imagePreview ? <img src={imagePreview} alt="Product preview" /> : <Icon name="image" />}
            <div><strong>Product media preview</strong><p>Use a saved image URL. Product file upload is hidden until the backend exposes a product media upload endpoint.</p></div>
          </div>
        </form>
      </Modal>

      <Modal open={modal === "view"} title={selectedProduct?.name || "Product Details"} subtitle={selectedProduct?.businessPageName || "Seller details"} onClose={() => setModal(null)} className="ui-modal-wide">
        {selectedProduct ? (
          <div className="product-detail-grid">
            <div className="product-detail-media">{selectedProduct.imageUrl ? <img src={selectedProduct.imageUrl} alt={selectedProduct.name} /> : <Icon name="bag" />}</div>
            <div className="product-detail-copy">
              <StatusBadge status={selectedProduct.available === false ? "Out of stock" : "Available"} tone={selectedProduct.available === false ? "red" : "green"} />
              <h2>{selectedProduct.name}</h2>
              <p>{selectedProduct.description || "No description provided."}</p>
              <strong>${Number(selectedProduct.price || 0).toFixed(2)}</strong>
              <div className="seller-analytics-grid">
                <StatBox label="Price" value={`$${Number(selectedProduct.price || 0).toFixed(2)}`} />
                <StatBox label="Stock" value={Number(selectedProduct.stock || 0)} />
                <StatBox label="Cart Qty" value={cartQuantityForProduct(selectedProduct.id)} />
                <StatBox label="Saved" value={savedIds.has(String(selectedProduct.id)) ? 1 : 0} />
              </div>
              <div className="inline-action-row">
                <Button variant="gradient" icon="bag" onClick={() => addToCart(selectedProduct)}>Add to Cart</Button>
                <Button icon="bookmark" onClick={() => toggleSave(selectedProduct)}>{savedIds.has(String(selectedProduct.id)) ? "Saved" : "Save Product"}</Button>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={modal === "delete"}
        title="Delete Product"
        subtitle="This action removes the product listing from the marketplace."
        onClose={() => setModal(null)}
        footer={(
          <>
            <Button onClick={() => setModal(null)}>Cancel</Button>
            <Button variant="danger" icon="trash" onClick={deleteProduct} disabled={submitting}>{submitting ? "Deleting..." : "Delete Product"}</Button>
          </>
        )}
      >
        <p>Delete <strong>{selectedProduct?.name}</strong>? Existing orders are not deleted.</p>
      </Modal>
    </PageGrid>
  );
}

function StatBox({ label, value }) {
  return (
    <article className="mini-stat-box">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
