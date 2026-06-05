import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { marketplaceService } from "../services/marketplaceService";
import { cartService } from "/src/modules/business/cart/services/cartService";
import { orderService } from "/src/modules/business/order/services/orderService";
import { businessService } from "/src/modules/business/page/services/businessService";
import { reviewService } from "/src/modules/business/review/services/reviewService";
import { useAuth } from "/src/modules/platform/app/store";
import LoadingState from "/src/modules/platform/common/components/LoadingState";
import ErrorState from "/src/modules/platform/common/components/ErrorState";
import { useToast } from "/src/modules/platform/common/hooks/useToast";
import { toMediaUrl } from "/src/modules/platform/common/utils/mediaUrl";
import {
  Avatar,
  Button,
  Card,
  EmptyPanel,
  Icon,
  Modal,
  PageGrid,
  SectionHeader,
  StatusBadge,
  Tabs
} from "/src/modules/platform/common/ui/DashboardUI";

const DELIVERY_METHODS = ["Shipping", "Motorcycle delivery", "Pickup", "Other delivery method"];

const emptyProduct = {
  businessPageId: "",
  name: "",
  description: "",
  price: "",
  stock: "",
  category: "",
  imageUrl: "",
  imageFile: null,
  imagePreview: "",
  deliveryMethod: "Pickup"
};

function unwrap(response) {
  return response?.data?.data?.content || response?.data?.data || response?.data?.content || response?.data || [];
}

function unwrapOne(response) {
  return response?.data?.data || response?.data || null;
}

function safeProductImageUrl(path) {
  const value = String(path || "").trim();
  if (!value) return "";
  if (/^(data:image\/|blob:)/i.test(value)) return value;
  if (/^https?:\/\//i.test(value) || value.startsWith("/") || value.startsWith("uploads/")) {
    return toMediaUrl(value);
  }
  return "";
}

function normalizeProduct(product) {
  const rawImageUrl = product.imageUrl || product.productImageUrl || "";
  const stock = Number(product.stock || 0);
  return {
    ...product,
    id: product.id ?? product.productId,
    rawImageUrl,
    imageUrl: safeProductImageUrl(rawImageUrl),
    available: product.available !== false || stock > 0,
    deliveryMethod: product.deliveryMethod || "Pickup",
    businessName: product.businessPageName || product.businessName || "AgroLink Business",
    businessOwnerName: product.businessOwnerName || product.ownerName || "Verified seller",
    businessOwnerEmail: product.businessOwnerEmail || product.ownerEmail || product.businessEmail || ""
  };
}

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function stockLabel(product) {
  const stock = Number(product?.stock || 0);
  if (!product?.available || stock <= 0) return "Out of stock";
  if (stock <= 5) return "Low stock";
  return "In stock";
}

function stockTone(product) {
  const stock = Number(product?.stock || 0);
  if (!product?.available || stock <= 0) return "red";
  if (stock <= 5) return "orange";
  return "green";
}

function productRatingLabel(product) {
  const rating = Number(product?.averageRating ?? product?.rating ?? product?.reviewRating ?? 0);
  const count = Number(product?.reviewCount ?? product?.ratingCount ?? product?.ratingsCount ?? 0);
  if (!rating) return "No ratings yet";
  return `${rating.toFixed(1)} stars${count ? ` (${count})` : ""}`;
}

function averageRating(reviews) {
  if (!reviews.length) return 0;
  return reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length;
}

function productMatches(product, query) {
  const search = query.trim().toLowerCase();
  if (!search) return true;
  return [
    product.name,
    product.description,
    product.category,
    product.price,
    product.businessName,
    product.businessPageName,
    product.businessOwnerName,
    product.businessOwnerEmail,
    product.deliveryMethod
  ]
    .some((value) => String(value || "").toLowerCase().includes(search));
}

function ProductImage({ src, alt }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <Icon name="bag" />;
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
}

export default function MarketplacePage() {
  const { role } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const isBusiness = role === "ROLE_BUSINESS" || role === "ROLE_FARMER";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [products, setProducts] = useState([]);
  const [businessPages, setBusinessPages] = useState([]);
  const [myPages, setMyPages] = useState([]);
  const [cart, setCart] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [delivery, setDelivery] = useState("all");
  const [sort, setSort] = useState("newest");
  const [modal, setModal] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [businessProducts, setBusinessProducts] = useState([]);
  const [businessReviews, setBusinessReviews] = useState([]);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [busy, setBusy] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [productsRes, pagesRes, cartRes, myPagesRes] = await Promise.allSettled([
        marketplaceService.listProducts({ page: 0, size: 120, q: query || undefined }),
        businessService.listPages({ page: 0, size: 40, q: query || undefined }),
        isBusiness ? Promise.resolve({ data: { data: [] } }) : cartService.list(),
        isBusiness ? businessService.listMyPages({ page: 0, size: 30 }) : Promise.resolve({ data: { data: [] } })
      ]);

      if (productsRes.status === "fulfilled") setProducts(unwrap(productsRes.value).map(normalizeProduct));
      if (pagesRes.status === "fulfilled") setBusinessPages(unwrap(pagesRes.value));
      if (cartRes.status === "fulfilled") setCart(unwrap(cartRes.value));
      if (myPagesRes.status === "fulfilled") {
        const pages = unwrap(myPagesRes.value);
        setMyPages(pages);
        setProductForm((prev) => ({ ...prev, businessPageId: prev.businessPageId || pages[0]?.id || "" }));
      }
    } catch {
      setError("Failed to load marketplace data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [role]);

  const categories = useMemo(() => ["all", ...new Set(products.map((product) => product.category).filter(Boolean))], [products]);

  const visibleProducts = useMemo(() => {
    let list = products.filter((product) => productMatches(product, query));
    if (category !== "all") list = list.filter((product) => product.category === category);
    if (delivery !== "all") list = list.filter((product) => product.deliveryMethod === delivery);
    if (sort === "price-low") list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    else if (sort === "price-high") list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    else if (sort === "stock") list.sort((a, b) => Number(b.stock || 0) - Number(a.stock || 0));
    else list.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
    return list;
  }, [category, delivery, products, query, sort]);

  const visibleBusinesses = useMemo(() => {
    const search = query.trim().toLowerCase();
    return businessPages.filter((page) => !search || [page.name, page.description, page.category, page.ownerName, page.ownerEmail, page.id]
      .some((value) => String(value || "").toLowerCase().includes(search)));
  }, [businessPages, query]);

  const cartCount = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const activeShops = new Set(products.map((product) => product.businessPageId)).size;
  const inventoryValue = products.reduce((sum, product) => sum + Number(product.price || 0) * Number(product.stock || 0), 0);
  const productPreviewUrl = productForm.imagePreview || safeProductImageUrl(productForm.imageUrl);
  const searchExamples = useMemo(() => {
    const values = [
      products[0]?.category,
      products[0]?.businessOwnerEmail,
      businessPages[0]?.name,
      businessPages[0]?.ownerEmail,
      products[0]?.deliveryMethod
    ].filter(Boolean);
    return [...new Set(values)].slice(0, 5);
  }, [businessPages, products]);

  const openProduct = (product) => {
    setSelectedProduct(product);
    setModal("product");
  };

  const openProductForm = (mode, product = null) => {
    setSelectedProduct(product);
    setProductForm(product ? {
      businessPageId: product.businessPageId || myPages[0]?.id || "",
      name: product.name || "",
      description: product.description || "",
      price: product.price || "",
      stock: product.stock || "",
      category: product.category || "",
      imageUrl: product.rawImageUrl || "",
      imageFile: null,
      imagePreview: product.imageUrl || "",
      deliveryMethod: product.deliveryMethod || "Pickup"
    } : { ...emptyProduct, businessPageId: myPages[0]?.id || "" });
    setModal(mode);
  };

  const handleProductImageChange = (event) => {
    const file = event.target.files?.[0] || null;
    setProductForm((prev) => ({
      ...prev,
      imageFile: file,
      imagePreview: file ? URL.createObjectURL(file) : safeProductImageUrl(prev.imageUrl)
    }));
  };

  const openBusinessProfile = async (businessPageId) => {
    if (!businessPageId) return;
    setBusy(`business-${businessPageId}`);
    try {
      const [pageRes, productsRes, reviewsRes] = await Promise.all([
        businessService.getPage(businessPageId),
        marketplaceService.listProductsByBusiness(businessPageId, { page: 0, size: 80 }),
        reviewService.business(businessPageId)
      ]);
      setSelectedBusiness(unwrapOne(pageRes));
      setBusinessProducts(unwrap(productsRes).map(normalizeProduct));
      setBusinessReviews(unwrap(reviewsRes));
      setReviewForm({ rating: 5, comment: "" });
      setModal("business-profile");
    } catch {
      pushToast("Failed to open business profile", "error");
    } finally {
      setBusy("");
    }
  };

  const addToCart = async (product, quantity = 1) => {
    if (isBusiness) {
      pushToast("Seller accounts can manage products and orders, not buy marketplace products", "error");
      return;
    }
    setBusy(`cart-${product.id}`);
    try {
      await cartService.add({ productId: product.id, quantity });
      const cartRes = await cartService.list();
      setCart(unwrap(cartRes));
      pushToast("Product added to cart", "success");
    } catch {
      pushToast("Failed to add product to cart", "error");
    } finally {
      setBusy("");
    }
  };

  const orderNow = async (product, quantity = 1) => {
    if (isBusiness) {
      pushToast("Seller accounts can manage products and orders, not buy marketplace products", "error");
      return;
    }
    setBusy(`order-${product.id}`);
    try {
      await orderService.createOrder({
        productId: product.id,
        quantity,
        deliveryMethod: product.deliveryMethod || "Pickup"
      });
      pushToast("Order placed successfully", "success");
      navigate("/orders");
    } catch (exception) {
      pushToast(exception?.response?.data?.message || "Failed to place direct order", "error");
    } finally {
      setBusy("");
    }
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    if (!productForm.businessPageId || !productForm.name.trim()) {
      pushToast("Business page and product name are required", "error");
      return;
    }
    setBusy("product-save");
    const payload = {
      businessPageId: Number(productForm.businessPageId),
      name: productForm.name.trim(),
      description: productForm.description.trim(),
      price: Number(productForm.price || 0),
      stock: Number(productForm.stock || 0),
      category: productForm.category.trim(),
      imageUrl: productForm.imageUrl.trim(),
      imageFile: productForm.imageFile,
      deliveryMethod: productForm.deliveryMethod || "Pickup"
    };
    try {
      if (modal === "edit-product") {
        await marketplaceService.updateProduct(selectedProduct.id, payload);
        pushToast("Product updated", "success");
      } else {
        await marketplaceService.createProduct(payload);
        pushToast("Product added to marketplace", "success");
      }
      setModal("");
      await load();
    } catch {
      pushToast("Failed to save product", "error");
    } finally {
      setBusy("");
    }
  };

  const deleteProduct = async () => {
    if (!selectedProduct?.id) return;
    setBusy("delete-product");
    try {
      await marketplaceService.deleteProduct(selectedProduct.id);
      pushToast("Product removed", "success");
      setModal("");
      await load();
    } catch {
      pushToast("Failed to remove product", "error");
    } finally {
      setBusy("");
    }
  };

  const submitReview = async (event) => {
    event.preventDefault();
    if (isBusiness) {
      pushToast("Seller accounts cannot submit customer feedback", "error");
      return;
    }
    const comment = reviewForm.comment.trim();
    if (!selectedBusiness?.id || !comment) {
      pushToast("Write feedback before submitting", "error");
      return;
    }
    setBusy("review");
    try {
      await reviewService.create({
        businessPageId: selectedBusiness.id,
        comment,
        rating: Number(reviewForm.rating),
        status: "PUBLISHED"
      });
      const reviewsRes = await reviewService.business(selectedBusiness.id);
      setBusinessReviews(unwrap(reviewsRes));
      setReviewForm({ rating: 5, comment: "" });
      pushToast("Business feedback added", "success");
    } catch (exception) {
      pushToast(exception?.response?.data?.message || "Failed to add business feedback", "error");
    } finally {
      setBusy("");
    }
  };

  if (loading) return <LoadingState text="Loading marketplace..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <PageGrid className="marketplace-dashboard commerce-pro-page social-pro-page social-commerce-page">
      <section className="commerce-hero commerce-market-hero">
        <div>
          <span className="commerce-kicker">AgroLink Commerce</span>
          <h2>Professional marketplace for real business products.</h2>
          <p>Browse seller products, search by business page, owner name, email, category or delivery method, then add products to a persistent cart.</p>
          <form className="commerce-hero-search" onSubmit={(event) => { event.preventDefault(); load(); }}>
            <Icon name="search" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products, business pages, seller email, owner name, category..." />
            <Button variant="gradient" icon="search" type="submit">Search</Button>
          </form>
          <div className="commerce-search-examples">
            {(searchExamples.length ? searchExamples : ["fresh vegetables", "seller email", "business page name", "pickup", "organic"]).map((item) => (
              <button key={item} type="button" onClick={() => setQuery(item)}>{item}</button>
            ))}
          </div>
        </div>
      </section>

      <section className="commerce-market-command">
        <div>
          <span className="commerce-kicker">Smart Marketplace Search</span>
          <h3>Find products by product name, business page, seller email, owner name, category, or delivery method.</h3>
        </div>
        <div className="commerce-market-metrics">
          <span><strong>{money(inventoryValue)}</strong><small>inventory value</small></span>
          <span><strong>{products.length}</strong><small>products</small></span>
          <span><strong>{activeShops}</strong><small>businesses</small></span>
          <span><strong>{cartCount}</strong><small>cart qty</small></span>
        </div>
        <div className="commerce-market-filter-strip">
          <label><span className="commerce-filter-label"><Icon name="bag" />Category</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map((item) => <option key={item} value={item}>{item === "all" ? "All categories" : item}</option>)}
            </select>
          </label>
          <label><span className="commerce-filter-label"><Icon name="truck" />Delivery</span>
            <select value={delivery} onChange={(event) => setDelivery(event.target.value)}>
              <option value="all">All delivery methods</option>
              {DELIVERY_METHODS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label><span className="commerce-filter-label"><Icon name="analytics" />Sort</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="newest">Newest</option>
              <option value="price-low">Price low to high</option>
              <option value="price-high">Price high to low</option>
              <option value="stock">Most stock</option>
            </select>
          </label>
        </div>
      </section>

      <div className="commerce-market-layout">
        <aside className="commerce-filter-rail">
          <Card className="commerce-panel">
            <SectionHeader title="Commerce Actions" subtitle="Cart, orders, and seller tools." />
            <div className="commerce-rail-actions">
              {!isBusiness ? <Button icon="bag" variant="gradient" onClick={() => navigate("/cart")}>Open Cart</Button> : null}
              <Button icon="order" onClick={() => navigate("/orders")}>Orders</Button>
              {isBusiness ? <Button icon="plus" onClick={() => openProductForm("add-product")}>Add Product</Button> : null}
            </div>
            <div className="commerce-side-proof">
              <span><Icon name="check" />{isBusiness ? "Seller accounts manage listings only" : "Cart persists after refresh"}</span>
              <span><Icon name="check" />Orders sync status from businesses</span>
              <span><Icon name="check" />Profiles include products and reviews</span>
            </div>
          </Card>

          <Card className="commerce-panel">
            <SectionHeader title="Business Profiles" subtitle="Search and open seller pages." />
            <div className="commerce-business-list">
              {visibleBusinesses.slice(0, 8).map((page) => (
                <button key={page.id} type="button" onClick={() => openBusinessProfile(page.id)} disabled={busy === `business-${page.id}`}>
                  <Avatar name={page.name} size="sm" />
                  <span>
                    <strong>{page.name}</strong>
                    <small>{page.category || "Marketplace seller"} - {page.ownerName || "Business owner"}</small>
                    {page.ownerEmail ? <small className="commerce-email-line">{page.ownerEmail}</small> : null}
                  </span>
                  <Icon name="eye" />
                </button>
              ))}
              {!visibleBusinesses.length ? <EmptyPanel icon="business" title="No business profiles" subtitle="Try another search." /> : null}
            </div>
          </Card>
        </aside>

        <main className="commerce-products-main">
          <Card className="commerce-toolbar-card">
            <SectionHeader
              title="Marketplace Products"
              subtitle={`${visibleProducts.length} products shown. Search also matches business owner email and page details.`}
              action={isBusiness ? <Button icon="plus" variant="gradient" onClick={() => openProductForm("add-product")}>Add Product</Button> : <Button icon="bag" variant="gradient" onClick={() => navigate("/cart")}>View Cart</Button>}
            />
            <Tabs
              active={category}
              onChange={setCategory}
              tabs={categories.slice(0, 8).map((item) => ({ value: item, label: item === "all" ? "All" : item }))}
            />
          </Card>

          {visibleProducts.length ? (
            <div className="commerce-product-grid">
              {visibleProducts.map((product) => (
                <article className="commerce-product-card" key={product.id}>
                  <div className="commerce-product-media">
                    <ProductImage src={product.imageUrl} alt={product.name} />
                    <StatusBadge status={stockLabel(product)} tone={stockTone(product)} />
                  </div>
                  <div className="commerce-product-body">
                    <div className="commerce-product-topline">
                      <span>{product.category || "General"}</span>
                      <strong>{money(product.price)}</strong>
                    </div>
                    <h3>{product.name}</h3>
                    <p>{product.description || "Marketplace product from a verified AgroLink business profile."}</p>
                    <div className="commerce-product-meta">
                      <span><Icon name="business" />{product.businessName}</span>
                      <span><Icon name="mail" />{product.businessOwnerEmail || product.businessOwnerName}</span>
                      <span><Icon name="star" />{productRatingLabel(product)}</span>
                      <span><Icon name="truck" />{product.deliveryMethod}</span>
                      <span><Icon name="bag" />{Number(product.stock || 0)} stock</span>
                    </div>
                  </div>
                  <div className="commerce-product-actions">
                    <Button icon="eye" onClick={() => openProduct(product)}>View Product</Button>
                    {!isBusiness ? (
                      <>
                        <Button icon="order" variant="gradient" onClick={() => orderNow(product)} disabled={busy === `order-${product.id}` || !product.available || Number(product.stock || 0) <= 0}>Order Now</Button>
                        <Button icon="bag" onClick={() => addToCart(product)} disabled={busy === `cart-${product.id}` || !product.available || Number(product.stock || 0) <= 0}>Add to Cart</Button>
                      </>
                    ) : null}
                    <Button icon="business" onClick={() => openBusinessProfile(product.businessPageId)}>View Business Profile</Button>
                  </div>
                  {isBusiness && myPages.some((page) => String(page.id) === String(product.businessPageId)) ? (
                    <div className="commerce-seller-actions">
                      <Button icon="edit" onClick={() => openProductForm("edit-product", product)}>Update</Button>
                      <Button icon="trash" variant="danger" onClick={() => { setSelectedProduct(product); setModal("delete-product"); }}>Delete</Button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <EmptyPanel icon="bag" title="No products found" subtitle="Try another search, category, or business profile." action={<Button icon="search" onClick={load}>Reload Marketplace</Button>} />
          )}
        </main>
      </div>

      <Modal open={modal === "product"} title={selectedProduct?.name || "Product"} subtitle={selectedProduct?.businessName || "Marketplace product"} onClose={() => setModal("")} className="ui-modal-wide">
        {selectedProduct ? <ProductDetails product={selectedProduct} onAddToCart={addToCart} onOrderNow={orderNow} onBusiness={openBusinessProfile} busy={busy} canBuy={!isBusiness} /> : null}
      </Modal>

      <Modal
        open={modal === "add-product" || modal === "edit-product"}
        title={modal === "edit-product" ? "Update Product" : "Add Product"}
        subtitle="Select delivery method so buyers know exactly how the order can be fulfilled."
        onClose={() => setModal("")}
        className="ui-modal-wide"
        footer={(
          <>
            <Button onClick={() => setModal("")}>Cancel</Button>
            <Button type="submit" form="market-product-form" icon="check" variant="gradient" disabled={busy === "product-save"}>{busy === "product-save" ? "Saving..." : "Save Product"}</Button>
          </>
        )}
      >
        <form id="market-product-form" className="modal-grid two commerce-product-form" onSubmit={saveProduct}>
          <label>Business page
            <select value={productForm.businessPageId} onChange={(event) => setProductForm((prev) => ({ ...prev, businessPageId: event.target.value }))}>
              <option value="">Select business page</option>
              {myPages.map((page) => <option key={page.id} value={page.id}>{page.name}</option>)}
            </select>
          </label>
          <label>Delivery method
            <select value={productForm.deliveryMethod} onChange={(event) => setProductForm((prev) => ({ ...prev, deliveryMethod: event.target.value }))}>
              {DELIVERY_METHODS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>Product name<input value={productForm.name} onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))} /></label>
          <label>Category<input value={productForm.category} onChange={(event) => setProductForm((prev) => ({ ...prev, category: event.target.value }))} /></label>
          <label>Price<input type="number" min="0" step="0.01" value={productForm.price} onChange={(event) => setProductForm((prev) => ({ ...prev, price: event.target.value }))} /></label>
          <label>Stock<input type="number" min="0" value={productForm.stock} onChange={(event) => setProductForm((prev) => ({ ...prev, stock: event.target.value }))} /></label>
          <label className="span-two commerce-upload-field">
            <span className="commerce-field-title">Product image</span>
            <span className="commerce-upload-control">
              <span className="commerce-upload-icon"><Icon name="image" /></span>
              <span>
                <strong>{productForm.imageFile?.name || "Choose product photo"}</strong>
                <small>Upload a clear marketplace image from your device.</small>
              </span>
              <em>{productForm.imageFile ? "Selected" : productPreviewUrl ? "Current photo" : "No file chosen"}</em>
              <input type="file" accept="image/*" onChange={handleProductImageChange} />
            </span>
          </label>
          <label className="span-two">Description<textarea value={productForm.description} onChange={(event) => setProductForm((prev) => ({ ...prev, description: event.target.value }))} /></label>
          <div className="product-modal-preview span-two">
            {productPreviewUrl ? <img src={productPreviewUrl} alt="Product preview" /> : <Icon name="image" />}
            <div><strong>Product photo upload</strong><p>Select a local image. It will be saved to the backend and displayed in Marketplace automatically.</p></div>
          </div>
        </form>
      </Modal>

      <Modal
        open={modal === "delete-product"}
        title="Delete Product"
        subtitle="Existing order history is preserved. Products with existing orders are disabled instead of hard deleted."
        onClose={() => setModal("")}
        footer={(
          <>
            <Button onClick={() => setModal("")}>Cancel</Button>
            <Button icon="trash" variant="danger" onClick={deleteProduct} disabled={busy === "delete-product"}>{busy === "delete-product" ? "Deleting..." : "Delete"}</Button>
          </>
        )}
      >
        <p className="commerce-confirm-copy">Remove <strong>{selectedProduct?.name}</strong> from Marketplace?</p>
      </Modal>

      <Modal open={modal === "business-profile"} title={selectedBusiness?.name || "Business Profile"} subtitle="Marketplace business profile" onClose={() => setModal("")} className="ui-modal-wide commerce-business-modal">
        {selectedBusiness ? (
          <BusinessProfile
            business={selectedBusiness}
            products={businessProducts}
            reviews={businessReviews}
            reviewForm={reviewForm}
            setReviewForm={setReviewForm}
            submitReview={submitReview}
            addToCart={addToCart}
            orderNow={orderNow}
            openProduct={openProduct}
            busy={busy}
            canBuy={!isBusiness}
          />
        ) : null}
      </Modal>
    </PageGrid>
  );
}

function ProductDetails({ product, onAddToCart, onOrderNow, onBusiness, busy, canBuy }) {
  return (
    <div className="commerce-detail-grid">
      <div className="commerce-detail-media"><ProductImage src={product.imageUrl} alt={product.name} /></div>
      <div className="commerce-detail-copy">
        <StatusBadge status={stockLabel(product)} tone={stockTone(product)} />
        <h2>{product.name}</h2>
        <p>{product.description || "Marketplace product from an AgroLink business."}</p>
        <div className="commerce-detail-price">{money(product.price)}</div>
        <div className="commerce-product-meta detail">
          <span><Icon name="business" />{product.businessName}</span>
          <span><Icon name="mail" />{product.businessOwnerEmail || product.businessOwnerName}</span>
          <span><Icon name="star" />{productRatingLabel(product)}</span>
          <span><Icon name="truck" />{product.deliveryMethod}</span>
          <span><Icon name="bag" />{Number(product.stock || 0)} available</span>
        </div>
        <div className="inline-action-row">
          {canBuy ? <Button icon="order" variant="gradient" onClick={() => onOrderNow(product)} disabled={busy === `order-${product.id}` || !product.available || Number(product.stock || 0) <= 0}>Order Now</Button> : null}
          {canBuy ? <Button icon="bag" onClick={() => onAddToCart(product)} disabled={busy === `cart-${product.id}` || !product.available || Number(product.stock || 0) <= 0}>Add to Cart</Button> : null}
          <Button icon="business" onClick={() => onBusiness(product.businessPageId)}>View Business Profile</Button>
        </div>
      </div>
    </div>
  );
}

function BusinessProfile({ business, products, reviews, reviewForm, setReviewForm, submitReview, addToCart, orderNow, openProduct, busy, canBuy }) {
  const avg = averageRating(reviews);
  return (
    <div className="commerce-business-profile">
      <section className="commerce-business-head">
        <Avatar name={business.name} size="xl" />
        <div>
          <span className="commerce-kicker">Business Profile</span>
          <h2>{business.name}</h2>
          <p>{business.description || "This seller has not added a long description yet."}</p>
          <div className="commerce-profile-stats">
            <StatusBadge status={business.category || "Business"} tone="green" />
            {business.ownerEmail ? <StatusBadge status={business.ownerEmail} tone="blue" /> : null}
            <StatusBadge status={`${products.length} products`} tone="blue" />
            <StatusBadge status={reviews.length ? `${avg.toFixed(1)} rating` : "No ratings yet"} tone="orange" />
          </div>
        </div>
      </section>

      <div className="commerce-business-content">
        <section>
          <SectionHeader title="Products from this business" />
          <div className="commerce-business-products">
            {products.map((product) => (
              <article key={product.id}>
                <span className="commerce-business-product-media"><ProductImage src={product.imageUrl} alt={product.name} /></span>
                <div><strong>{product.name}</strong><small>{money(product.price)} - {product.deliveryMethod}</small></div>
                <Button icon="eye" onClick={() => openProduct(product)}>View</Button>
                {canBuy ? <Button icon="order" variant="gradient" onClick={() => orderNow(product)} disabled={busy === `order-${product.id}` || !product.available || Number(product.stock || 0) <= 0}>Order</Button> : null}
                {canBuy ? <Button icon="bag" onClick={() => addToCart(product)} disabled={busy === `cart-${product.id}` || !product.available || Number(product.stock || 0) <= 0}>Cart</Button> : null}
              </article>
            ))}
            {!products.length ? <EmptyPanel icon="bag" title="No products" subtitle="This business has no listed products yet." /> : null}
          </div>
        </section>

        <aside>
          <SectionHeader title="Feedback & Rating" subtitle="Users can review after ordering from this business." />
          {canBuy ? (
            <form className="commerce-review-form" onSubmit={submitReview}>
              <select value={reviewForm.rating} onChange={(event) => setReviewForm((prev) => ({ ...prev, rating: event.target.value }))}>
                {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}
              </select>
              <textarea value={reviewForm.comment} onChange={(event) => setReviewForm((prev) => ({ ...prev, comment: event.target.value }))} placeholder="Write feedback after ordering from this business..." />
              <Button type="submit" icon="star" variant="gradient" disabled={busy === "review"}>{busy === "review" ? "Saving..." : "Add Feedback"}</Button>
            </form>
          ) : (
            <EmptyPanel icon="business" title="Seller feedback is read-only" subtitle="Business accounts can sell products and manage orders. Customer feedback is submitted by buyers after ordering." />
          )}
          <div className="commerce-review-list">
            {reviews.map((review) => (
              <article key={review.id}>
                <div><strong>{review.username || "Customer"}</strong><span>{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : "Recent"}</span></div>
                <p>{review.comment}</p>
                <StatusBadge status={`${review.rating || 5} stars`} tone="orange" />
              </article>
            ))}
            {!reviews.length ? <EmptyPanel icon="star" title="No feedback yet" subtitle="Reviews appear after users order and submit feedback." /> : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
