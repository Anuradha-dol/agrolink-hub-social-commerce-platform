import { useEffect, useMemo, useState } from "react";
import { businessService } from "../services/businessService";
import { marketplaceService } from "/src/modules/business/product/services/marketplaceService";
import { useToast } from "/src/modules/platform/common/hooks/useToast";
import LoadingState from "/src/modules/platform/common/components/LoadingState";
import { toMediaUrl } from "/src/modules/platform/common/utils/mediaUrl";

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

export default function BusinessPage() {
  const { pushToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState("");
  const [pageForm, setPageForm] = useState(initialPageForm);
  const [productForm, setProductForm] = useState(initialProductForm);

  const selectedPage = useMemo(
    () => pages.find((item) => String(item.id) === String(selectedPageId)) || null,
    [pages, selectedPageId]
  );

  const inventoryValue = useMemo(
    () =>
      products.reduce(
        (total, item) => total + Number(item.price || 0) * Number(item.stock || 0),
        0
      ),
    [products]
  );

  const loadPages = async () => {
    setLoading(true);
    try {
      const response = await businessService.listMyPages({ page: 0, size: 50 });
      const content = response?.data?.data?.content || [];
      setPages(content);
      const firstPageId = content[0]?.id || "";
      setSelectedPageId(firstPageId);
      setProductForm((prev) => ({ ...prev, businessPageId: firstPageId }));
    } catch {
      pushToast("Failed to load business pages", "error");
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
      const response = await marketplaceService.listProductsByBusiness(pageId, { page: 0, size: 50 });
      setProducts(response?.data?.data?.content || []);
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

  const createPage = async (event) => {
    event.preventDefault();
    try {
      await businessService.createPage(pageForm);
      pushToast("Business page created", "success");
      setPageForm(initialPageForm);
      await loadPages();
    } catch {
      pushToast("Failed to create business page", "error");
    }
  };

  const createProduct = async (event) => {
    event.preventDefault();
    try {
      await marketplaceService.createProduct({
        ...productForm,
        price: Number(productForm.price),
        stock: Number(productForm.stock),
        businessPageId: Number(productForm.businessPageId)
      });
      pushToast("Product created", "success");
      setProductForm((prev) => ({ ...initialProductForm, businessPageId: prev.businessPageId }));
      await loadProducts(selectedPageId);
    } catch {
      pushToast("Failed to create product", "error");
    }
  };

  const removeProduct = async (productId) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await marketplaceService.deleteProduct(productId);
      pushToast("Product removed", "success");
      await loadProducts(selectedPageId);
    } catch {
      pushToast("Failed to remove product", "error");
    }
  };

  if (loading) return <LoadingState text="Loading business dashboard..." />;

  return (
    <div className="business-page">
      <section className="page-hero">
        <div>
          <h2>Business Studio</h2>
          <p>Create business pages and publish product catalogs from a central workspace.</p>
        </div>
        <div className="hero-stats">
          <article>
            <strong>{pages.length}</strong>
            <span>Business Pages</span>
          </article>
          <article>
            <strong>{products.length}</strong>
            <span>Products</span>
          </article>
          <article>
            <strong>{selectedPage?.name || "No Page"}</strong>
            <span>Selected Page</span>
          </article>
        </div>
      </section>

      <section className="business-stat-grid">
        <article className="business-stat-card">
          <strong>{products.reduce((sum, item) => sum + Number(item.stock || 0), 0)}</strong>
          <span>Total Stock Units</span>
        </article>
        <article className="business-stat-card">
          <strong>${inventoryValue.toFixed(2)}</strong>
          <span>Inventory Value</span>
        </article>
        <article className="business-stat-card">
          <strong>{selectedPage?.category || "-"}</strong>
          <span>Page Category</span>
        </article>
      </section>

      <section className="card">
        <h2>Create Business Page</h2>
        <form onSubmit={createPage} className="grid-form">
          <input
            placeholder="Page name"
            value={pageForm.name}
            onChange={(e) => setPageForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <input
            placeholder="Category"
            value={pageForm.category}
            onChange={(e) => setPageForm((prev) => ({ ...prev, category: e.target.value }))}
          />
          <textarea
            placeholder="Description"
            value={pageForm.description}
            onChange={(e) => setPageForm((prev) => ({ ...prev, description: e.target.value }))}
          />
          <button className="btn btn-primary" type="submit">
            Create Page
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Manage Products</h2>
        <select
          value={selectedPageId}
          onChange={(e) => {
            setSelectedPageId(e.target.value);
            setProductForm((prev) => ({ ...prev, businessPageId: e.target.value }));
          }}
        >
          <option value="">Select business page</option>
          {pages.map((page) => (
            <option key={page.id} value={page.id}>
              {page.name}
            </option>
          ))}
        </select>

        <form onSubmit={createProduct} className="grid-form">
          <input
            placeholder="Product name"
            value={productForm.name}
            onChange={(e) => setProductForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <input
            type="number"
            placeholder="Price"
            value={productForm.price}
            onChange={(e) => setProductForm((prev) => ({ ...prev, price: e.target.value }))}
          />
          <input
            type="number"
            placeholder="Stock"
            value={productForm.stock}
            onChange={(e) => setProductForm((prev) => ({ ...prev, stock: e.target.value }))}
          />
          <input
            placeholder="Category"
            value={productForm.category}
            onChange={(e) => setProductForm((prev) => ({ ...prev, category: e.target.value }))}
          />
          <input
            placeholder="Image URL"
            value={productForm.imageUrl}
            onChange={(e) => setProductForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
          />
          <textarea
            placeholder="Description"
            value={productForm.description}
            onChange={(e) => setProductForm((prev) => ({ ...prev, description: e.target.value }))}
          />
          <button className="btn btn-primary" type="submit">
            Add Product
          </button>
        </form>
      </section>

      <section className="product-grid">
        {products.map((product) => (
          <article key={product.id} className="card product-card">
            {product.imageUrl ? <img src={toMediaUrl(product.imageUrl)} alt={product.name} className="product-image" /> : null}
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <div className="reaction-row">
              {product.category ? <span className="chip">{product.category}</span> : null}
              {selectedPage?.name ? <span className="chip">{selectedPage.name}</span> : null}
            </div>
            <p className="price">${product.price}</p>
            <p className="muted">Stock: {product.stock}</p>
            <div className="row-actions">
              <button className="btn btn-secondary" type="button" onClick={() => removeProduct(product.id)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
