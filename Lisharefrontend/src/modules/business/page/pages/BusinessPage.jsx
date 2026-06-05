import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { businessService } from "../services/businessService";
import { marketplaceService } from "/src/modules/business/product/services/marketplaceService";
import { orderService } from "/src/modules/business/order/services/orderService";
import { useToast } from "/src/modules/platform/common/hooks/useToast";
import LoadingState from "/src/modules/platform/common/components/LoadingState";
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

const initialPageForm = { name: "", description: "", category: "" };
const initialProductForm = {
  businessPageId: "",
  name: "",
  description: "",
  price: "",
  stock: "",
  category: "",
  imageUrl: ""
};

function unwrapList(response) {
  const payload = response?.data?.data ?? response?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
}

function orderTotal(order) {
  return Number(order?.totalPrice ?? order?.total ?? (Number(order?.unitPrice || 0) * Number(order?.quantity || 1)) ?? 0);
}

function statusLabel(status = "") {
  return String(status || "Processing").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function productPayload(form) {
  return {
    businessPageId: Number(form.businessPageId),
    name: form.name.trim(),
    description: form.description.trim(),
    price: Number(form.price),
    stock: Number(form.stock),
    category: form.category.trim(),
    imageUrl: form.imageUrl.trim()
  };
}

export default function BusinessPage() {
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState("");
  const [pageForm, setPageForm] = useState(initialPageForm);
  const [productForm, setProductForm] = useState(initialProductForm);
  const [modal, setModal] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);
  const [busy, setBusy] = useState("");

  const activePage = useMemo(
    () => pages.find((item) => String(item.id) === String(selectedPageId)) || null,
    [pages, selectedPageId]
  );

  const inventoryValue = useMemo(
    () => products.reduce((total, item) => total + Number(item.price || 0) * Number(item.stock || 0), 0),
    [products]
  );

  const stockUnits = products.reduce((sum, item) => sum + Number(item.stock || 0), 0);
  const activeProducts = products.filter((item) => Number(item.stock || 0) > 0).length;
  const lowStock = products.filter((item) => Number(item.stock || 0) > 0 && Number(item.stock || 0) <= 5).length;
  const totalEarnings = orders.reduce((sum, order) => sum + orderTotal(order), 0);

  const loadPages = async () => {
    setLoading(true);
    try {
      const [pagesResponse, ordersResponse] = await Promise.allSettled([
        businessService.listMyPages({ page: 0, size: 50 }),
        orderService.businessOrders({ page: 0, size: 20 })
      ]);
      const content = pagesResponse.status === "fulfilled" ? unwrapList(pagesResponse.value) : [];
      setPages(content);
      setOrders(ordersResponse.status === "fulfilled" ? unwrapList(ordersResponse.value) : []);
      const firstPageId = selectedPageId || content[0]?.id || "";
      setSelectedPageId(firstPageId);
      setProductForm((prev) => ({ ...prev, businessPageId: firstPageId }));
    } catch {
      pushToast("Failed to load business dashboard", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async (pageId) => {
    if (!pageId) {
      setProducts([]);
      return;
    }
    try {
      const response = await marketplaceService.listProductsByBusiness(pageId, { page: 0, size: 80 });
      setProducts(unwrapList(response));
    } catch {
      pushToast("Failed to load products", "error");
    }
  };

  useEffect(() => {
    loadPages();
  }, []);

  useEffect(() => {
    loadProducts(selectedPageId);
  }, [selectedPageId]);

  const openPageModal = (mode, page = null) => {
    setSelectedPage(page);
    setPageForm(page ? {
      name: page.name || "",
      description: page.description || "",
      category: page.category || ""
    } : initialPageForm);
    setModal(mode);
  };

  const openProductModal = (mode, product = null) => {
    setSelectedProduct(product);
    setProductForm(product ? {
      businessPageId: product.businessPageId || selectedPageId || "",
      name: product.name || "",
      description: product.description || "",
      price: product.price || "",
      stock: product.stock || "",
      category: product.category || "",
      imageUrl: product.imageUrl || ""
    } : { ...initialProductForm, businessPageId: selectedPageId || "" });
    setModal(mode);
  };

  const savePage = async (event) => {
    event.preventDefault();
    if (!pageForm.name.trim() || !pageForm.category.trim()) {
      pushToast("Page name and category are required", "error");
      return;
    }
    setBusy("page");
    try {
      if (modal === "edit-page" && selectedPage?.id) {
        await businessService.updatePage(selectedPage.id, pageForm);
        pushToast("Business page updated", "success");
      } else {
        await businessService.createPage(pageForm);
        pushToast("Business page created", "success");
      }
      setModal("");
      setPageForm(initialPageForm);
      await loadPages();
    } catch {
      pushToast(modal === "edit-page" ? "Failed to update business page" : "Failed to create business page", "error");
    } finally {
      setBusy("");
    }
  };

  const deactivatePage = async () => {
    if (!selectedPage?.id) return;
    setBusy("delete-page");
    try {
      await businessService.deactivatePage(selectedPage.id);
      pushToast("Business page removed", "success");
      setModal("");
      await loadPages();
    } catch {
      pushToast("Failed to remove business page", "error");
    } finally {
      setBusy("");
    }
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    if (!productForm.businessPageId || !productForm.name.trim() || productForm.price === "" || productForm.stock === "") {
      pushToast("Business page, product name, price, and stock are required", "error");
      return;
    }
    setBusy("product");
    try {
      if (modal === "edit-product" && selectedProduct?.id) {
        await marketplaceService.updateProduct(selectedProduct.id, productPayload(productForm));
        pushToast("Product updated", "success");
      } else {
        await marketplaceService.createProduct(productPayload(productForm));
        pushToast("Product added", "success");
      }
      setModal("");
      await loadProducts(selectedPageId);
    } catch {
      pushToast(modal === "edit-product" ? "Failed to update product" : "Failed to add product", "error");
    } finally {
      setBusy("");
    }
  };

  const removeProduct = async () => {
    if (!selectedProduct?.id) return;
    setBusy("delete-product");
    try {
      await marketplaceService.deleteProduct(selectedProduct.id);
      pushToast("Product removed", "success");
      setModal("");
      await loadProducts(selectedPageId);
    } catch {
      pushToast("Failed to remove product", "error");
    } finally {
      setBusy("");
    }
  };

  if (loading) return <LoadingState text="Loading business dashboard..." />;

  return (
    <PageGrid className="business-dashboard">
      <OverviewHero
        icon="bag"
        eyebrow="Business Studio"
        title="Manage your business and grow your products."
        subtitle="Create business pages, manage product listings, track orders, and keep your seller workspace clean."
        stats={[
          { label: "Business Pages", value: pages.length, trend: "Active" },
          { label: "Products", value: products.length, trend: "Listed" },
          { label: "Orders", value: orders.length, trend: "Received" },
          { label: "Earnings", value: `$${totalEarnings.toFixed(0)}`, trend: "Loaded orders" }
        ]}
      />

      <div className="business-layout">
        <main className="business-main">
          <Card className="business-control-card">
            <SectionHeader
              title={activePage ? activePage.name : "Business Profile"}
              subtitle={activePage ? activePage.description || "Manage products for the selected seller page." : "Create a business page before publishing products."}
              action={(
                <div className="inline-action-row">
                  <Button icon="plus" variant="gradient" onClick={() => openPageModal("add-page")}>Add Business Page</Button>
                  <Button icon="plus" onClick={() => openProductModal("add-product")} disabled={!selectedPageId}>Add Product</Button>
                </div>
              )}
            />
            <div className="business-page-selector">
              <label>
                <Icon name="bag" />
                <select
                  value={selectedPageId}
                  onChange={(event) => {
                    setSelectedPageId(event.target.value);
                    setProductForm((prev) => ({ ...prev, businessPageId: event.target.value }));
                  }}
                >
                  <option value="">Select business page</option>
                  {pages.map((page) => <option key={page.id} value={page.id}>{page.name}</option>)}
                </select>
              </label>
              <Button icon="edit" onClick={() => openPageModal("edit-page", activePage)} disabled={!activePage}>Edit Business</Button>
              <Button icon="trash" variant="danger" onClick={() => { setSelectedPage(activePage); setModal("delete-page"); }} disabled={!activePage}>Remove Business</Button>
              <Button icon="eye" onClick={() => navigate("/marketplace")}>Open Marketplace</Button>
            </div>
          </Card>

          <div className="business-kpi-grid">
            <StatCard icon="bag" label="Active Products" value={activeProducts} trend="In stock" tone="green" />
            <StatCard icon="order" label="Recent Orders" value={orders.length} trend="Business orders" tone="blue" />
            <StatCard icon="analytics" label="Inventory Value" value={`$${inventoryValue.toFixed(0)}`} trend={`${stockUnits} stock units`} tone="purple" />
            <StatCard icon="bell" label="Low Stock" value={lowStock} trend="Needs attention" tone="orange" />
          </div>

          <Card className="business-table-card">
            <SectionHeader title="My Products" subtitle="Manage and monitor all listed products." action={<Button icon="plus" variant="gradient" onClick={() => openProductModal("add-product")} disabled={!selectedPageId}>Add Product</Button>} />
            <div className="dashboard-table-wrap">
              <table className="dashboard-table business-products-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="table-product">
                          {product.imageUrl ? <img src={toMediaUrl(product.imageUrl)} alt={product.name} /> : <span className="placeholder"><Icon name="bag" /></span>}
                          <div><strong>{product.name}</strong><span>{product.description || "Marketplace listing"}</span></div>
                        </div>
                      </td>
                      <td><StatusBadge status={product.category || "General"} tone="green" /></td>
                      <td>${Number(product.price || 0).toFixed(2)}</td>
                      <td>{Number(product.stock || 0)} units</td>
                      <td><StatusBadge status={Number(product.stock || 0) > 0 ? "Active" : "Out of stock"} tone={Number(product.stock || 0) > 0 ? "green" : "red"} /></td>
                      <td>
                        <div className="table-action-row">
                          <Button icon="eye" onClick={() => openProductModal("view-product", product)}>View</Button>
                          <Button icon="edit" onClick={() => openProductModal("edit-product", product)}>Edit</Button>
                          <Button icon="trash" variant="danger" onClick={() => openProductModal("delete-product", product)}>Delete</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!products.length ? <EmptyPanel icon="bag" title="No products listed" subtitle="Add a product to publish your seller catalog." action={<Button variant="gradient" icon="plus" onClick={() => openProductModal("add-product")} disabled={!selectedPageId}>Add Product</Button>} /> : null}
          </Card>

          <Card className="business-table-card">
            <SectionHeader title="Recent Orders" subtitle="Track customer orders and fulfillment status." action={<Button icon="order" onClick={() => navigate("/orders")}>View All Orders</Button>} />
            <div className="dashboard-table-wrap">
              <table className="dashboard-table business-orders-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Product</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 6).map((order) => (
                    <tr key={order.id}>
                      <td>ORD-{String(order.id || "").padStart(4, "0")}</td>
                      <td>{order.productName || "Product"}</td>
                      <td>{order.customerName || order.buyerName || "Customer"}</td>
                      <td>${orderTotal(order).toFixed(2)}</td>
                      <td><StatusBadge status={statusLabel(order.status)} /></td>
                      <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "Recent"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!orders.length ? <EmptyPanel icon="order" title="No recent orders" subtitle="Business order activity will appear here." /> : null}
          </Card>
        </main>

        <aside className="side-stack business-side">
          <Card>
            <SectionHeader title="Quick Actions" />
            <ul className="panel-list">
              {[
                ["View My Products", "Manage and edit your products", () => openProductModal("add-product")],
                ["View Orders", "Track and manage orders", () => navigate("/orders")],
                ["Earnings & Payouts", "Review loaded order earnings", () => navigate("/analytics")],
                ["Business Profile", "Update business information", () => openPageModal("edit-page", activePage)],
                ["Product Analytics", "View performance charts", () => navigate("/analytics")]
              ].map(([title, subtitle, action]) => (
                <li className="panel-row business-action-row" key={title}>
                  <button type="button" onClick={action} disabled={title === "Business Profile" && !activePage}>
                    <span><Icon name={title.includes("Order") ? "order" : title.includes("Earnings") || title.includes("Analytics") ? "analytics" : "bag"} /></span>
                    <div><strong>{title}</strong><small>{subtitle}</small></div>
                    <Icon name="more" />
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="business-profile-card">
            <SectionHeader title="Business Profile" action={<StatusBadge status={activePage ? "Active" : "Not created"} tone={activePage ? "green" : "orange"} />} />
            <div className="business-profile-summary">
              <span><Icon name="bag" /></span>
              <div>
                <strong>{activePage?.name || "No business page selected"}</strong>
                <p>{activePage?.category || "Create a page to start selling."}</p>
              </div>
            </div>
            <p className="muted">{activePage?.description || "Business pages connect product catalogs, seller identity, orders, and analytics."}</p>
          </Card>

          <Card>
            <SectionHeader title="Inventory Snapshot" />
            <ul className="panel-list">
              <li className="panel-row"><div><strong>{stockUnits}</strong><span>Total stock units</span></div><Icon name="bag" /></li>
              <li className="panel-row"><div><strong>${inventoryValue.toFixed(2)}</strong><span>Inventory value</span></div><Icon name="analytics" /></li>
              <li className="panel-row"><div><strong>{activePage?.category || "-"}</strong><span>Page category</span></div><Icon name="spark" /></li>
            </ul>
          </Card>
        </aside>
      </div>

      <Modal
        open={modal === "add-page" || modal === "edit-page"}
        title={modal === "edit-page" ? "Edit Business Page" : "Add Business Page"}
        subtitle="Keep seller identity, category, and description aligned with the marketplace."
        onClose={() => setModal("")}
        footer={(
          <>
            <Button onClick={() => setModal("")}>Cancel</Button>
            <Button variant="gradient" icon="check" type="submit" form="business-page-form" disabled={busy === "page"}>
              {busy === "page" ? "Saving..." : "Save Business"}
            </Button>
          </>
        )}
      >
        <form id="business-page-form" className="modal-grid" onSubmit={savePage}>
          <label>Business name<input value={pageForm.name} onChange={(event) => setPageForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Lishare QA Business Page" /></label>
          <label>Category<input value={pageForm.category} onChange={(event) => setPageForm((prev) => ({ ...prev, category: event.target.value }))} placeholder="Agriculture, Business, Creator..." /></label>
          <label>Description<textarea value={pageForm.description} onChange={(event) => setPageForm((prev) => ({ ...prev, description: event.target.value }))} placeholder="Describe products, business purpose, delivery area, and seller promise." /></label>
        </form>
      </Modal>

      <Modal
        open={modal === "add-product" || modal === "edit-product"}
        title={modal === "edit-product" ? "Edit Product" : "Add Product"}
        subtitle="Product forms use the same rounded fields, preview state, validation, and seller workflow."
        onClose={() => setModal("")}
        footer={(
          <>
            <Button onClick={() => setModal("")}>Cancel</Button>
            <Button variant="gradient" icon="check" type="submit" form="business-product-form" disabled={busy === "product"}>
              {busy === "product" ? "Saving..." : "Save Product"}
            </Button>
          </>
        )}
        className="ui-modal-wide"
      >
        <form id="business-product-form" className="modal-grid two" onSubmit={saveProduct}>
          <label>Business page
            <select value={productForm.businessPageId} onChange={(event) => setProductForm((prev) => ({ ...prev, businessPageId: event.target.value }))}>
              <option value="">Select business page</option>
              {pages.map((page) => <option key={page.id} value={page.id}>{page.name}</option>)}
            </select>
          </label>
          <label>Category<input value={productForm.category} onChange={(event) => setProductForm((prev) => ({ ...prev, category: event.target.value }))} placeholder="Vegetables, Honey, Services..." /></label>
          <label>Product name<input value={productForm.name} onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))} /></label>
          <label>Price<input type="number" min="0" step="0.01" value={productForm.price} onChange={(event) => setProductForm((prev) => ({ ...prev, price: event.target.value }))} /></label>
          <label>Stock<input type="number" min="0" value={productForm.stock} onChange={(event) => setProductForm((prev) => ({ ...prev, stock: event.target.value }))} /></label>
          <label>Image URL<input value={productForm.imageUrl} onChange={(event) => setProductForm((prev) => ({ ...prev, imageUrl: event.target.value }))} /></label>
          <label className="span-two">Description<textarea value={productForm.description} onChange={(event) => setProductForm((prev) => ({ ...prev, description: event.target.value }))} /></label>
          <div className="product-modal-preview span-two">
            {productForm.imageUrl ? <img src={toMediaUrl(productForm.imageUrl)} alt="Product preview" /> : <Icon name="image" />}
            <div><strong>Upload-ready product area</strong><p>Paste an image URL for now. The styling is ready for a backend product media upload endpoint.</p></div>
          </div>
        </form>
      </Modal>

      <Modal open={modal === "view-product"} title={selectedProduct?.name || "Product Details"} subtitle={activePage?.name || "Business product"} onClose={() => setModal("")} className="ui-modal-wide">
        {selectedProduct ? (
          <div className="product-detail-grid">
            <div className="product-detail-media">{selectedProduct.imageUrl ? <img src={toMediaUrl(selectedProduct.imageUrl)} alt={selectedProduct.name} /> : <Icon name="bag" />}</div>
            <div className="product-detail-copy">
              <StatusBadge status={Number(selectedProduct.stock || 0) > 0 ? "Active" : "Out of stock"} tone={Number(selectedProduct.stock || 0) > 0 ? "green" : "red"} />
              <h2>{selectedProduct.name}</h2>
              <p>{selectedProduct.description || "No product description provided."}</p>
              <strong>${Number(selectedProduct.price || 0).toFixed(2)}</strong>
              <div className="inline-action-row">
                <Button icon="edit" variant="gradient" onClick={() => openProductModal("edit-product", selectedProduct)}>Edit Product</Button>
                <Button icon="trash" variant="danger" onClick={() => openProductModal("delete-product", selectedProduct)}>Delete Product</Button>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={modal === "delete-product"}
        title="Delete Product"
        subtitle="This removes the listing but does not delete existing order history."
        onClose={() => setModal("")}
        footer={(
          <>
            <Button onClick={() => setModal("")}>Cancel</Button>
            <Button icon="trash" variant="danger" onClick={removeProduct} disabled={busy === "delete-product"}>
              {busy === "delete-product" ? "Deleting..." : "Delete Product"}
            </Button>
          </>
        )}
      >
        <p className="business-confirm-copy">Delete <strong>{selectedProduct?.name}</strong> from this business catalog?</p>
      </Modal>

      <Modal
        open={modal === "delete-page"}
        title="Remove Business Page"
        subtitle="Use this only when the seller page should no longer be available."
        onClose={() => setModal("")}
        footer={(
          <>
            <Button onClick={() => setModal("")}>Cancel</Button>
            <Button icon="trash" variant="danger" onClick={deactivatePage} disabled={busy === "delete-page"}>
              {busy === "delete-page" ? "Removing..." : "Remove Business"}
            </Button>
          </>
        )}
      >
        <p className="business-confirm-copy">Remove <strong>{selectedPage?.name}</strong>? Products attached to this business may stop showing for customers.</p>
      </Modal>
    </PageGrid>
  );
}
