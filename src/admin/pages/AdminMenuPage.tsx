import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { AdminDeleteConfirmModal } from "@/admin/components/AdminDeleteConfirmModal";
import { AdminModal } from "@/admin/components/AdminModal";
import { AdminFormField, adminInputClass } from "@/admin/components/AdminFormField";
import { BranchSelectField } from "@/admin/components/BranchSelectField";
import { useSubmitGuard } from "@/admin/hooks/useSubmitGuard";
import { useAdminPermissions } from "@/admin/AdminPermissionsContext";
import { useAdminToken } from "@/admin/useAdminToken";
import { formatPrice } from "@/data/content";
import { DEFAULT_CURRENCY, getCurrencyLabel } from "@/lib/currencies";
import { cn } from "@/lib/utils";

type ProductForm = {
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  outOfStock: boolean;
};

const emptyProduct = (): ProductForm => ({
  name: "",
  description: "",
  price: "",
  imageUrl: "",
  outOfStock: false,
});

function branchOptionsFrom(branches: Doc<"branches">[] | undefined) {
  return branches?.map((b) => ({
    slug: b.slug,
    label:
      b.subtitle && !b.label.includes("·") ? `${b.label} · ${b.subtitle}` : b.label,
  }));
}

export function AdminMenuPage() {
  const adminToken = useAdminToken();
  const { canDelete } = useAdminPermissions();
  const branches = useQuery(api.branches.listAll, adminToken ? { adminToken } : "skip");
  const branchOptions = branchOptionsFrom(branches);

  const [branchSlug, setBranchSlug] = useState("");
  const [categoryId, setCategoryId] = useState<Id<"menuCategories"> | "">("");

  const categories = useQuery(
    api.menuCategories.listByBranch,
    adminToken && branchSlug ? { branchSlug, adminToken } : "skip",
  );

  const products = useQuery(
    api.menuItemsAdmin.listByCategory,
    adminToken && categoryId
      ? { adminToken, categoryId: categoryId as Id<"menuCategories"> }
      : "skip",
  );

  const createCategory = useMutation(api.menuCategories.create);
  const updateCategory = useMutation(api.menuCategories.update);
  const removeCategory = useMutation(api.menuCategories.remove);
  const createProduct = useMutation(api.menuItemsAdmin.create);
  const updateProduct = useMutation(api.menuItemsAdmin.update);
  const removeProduct = useMutation(api.menuItemsAdmin.remove);

  const [catModal, setCatModal] = useState<"add" | "edit" | null>(null);
  const [catModalBranch, setCatModalBranch] = useState("");
  const [catLabel, setCatLabel] = useState("");
  const [editCat, setEditCat] = useState<Doc<"menuCategories"> | null>(null);

  const [productModal, setProductModal] = useState<"add" | "edit" | "view" | null>(null);
  const [productModalBranch, setProductModalBranch] = useState("");
  const [productModalCategoryId, setProductModalCategoryId] = useState<
    Id<"menuCategories"> | ""
  >("");
  const productModalCategories = useQuery(
    api.menuCategories.listByBranch,
    adminToken && productModal === "add" && productModalBranch
      ? { branchSlug: productModalBranch, adminToken }
      : "skip",
  );

  const [productForm, setProductForm] = useState<ProductForm>(emptyProduct());
  const [editProduct, setEditProduct] = useState<Doc<"menuItems"> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const catSave = useSubmitGuard();
  const productSave = useSubmitGuard();

  const [deleteTarget, setDeleteTarget] = useState<
    | { kind: "category"; item: Doc<"menuCategories"> }
    | { kind: "product"; item: Doc<"menuItems"> }
    | null
  >(null);

  useEffect(() => {
    if (!branches?.length) return;
    if (!branchSlug || !branches.some((b) => b.slug === branchSlug)) {
      setBranchSlug(branches[0].slug);
    }
  }, [branches, branchSlug]);

  useEffect(() => {
    if (!categories?.length) {
      setCategoryId("");
      return;
    }
    if (!categoryId || !categories.some((c) => c._id === categoryId)) {
      setCategoryId(categories[0]._id);
    }
  }, [categories, categoryId]);

  useEffect(() => {
    if (productModal !== "add" || !productModalCategories?.length) return;
    if (
      !productModalCategoryId ||
      !productModalCategories.some((c) => c._id === productModalCategoryId)
    ) {
      setProductModalCategoryId(productModalCategories[0]._id);
    }
  }, [productModal, productModalCategories, productModalCategoryId]);

  const selectedCategory = categories?.find((c) => c._id === categoryId);

  const listBranchCurrency = useMemo(() => {
    const branch = branches?.find((b) => b.slug === branchSlug);
    return (branch?.currency ?? DEFAULT_CURRENCY).toUpperCase();
  }, [branches, branchSlug]);

  const menuBranchCurrency = useMemo(() => {
    const slug =
      productModal === "add"
        ? productModalBranch
        : (editProduct?.branchSlug ?? branchSlug);
    const branch = branches?.find((b) => b.slug === slug);
    return (branch?.currency ?? DEFAULT_CURRENCY).toUpperCase();
  }, [productModal, productModalBranch, editProduct, branchSlug, branches]);

  function closeCatModal() {
    setCatModal(null);
    setEditCat(null);
    setError(null);
  }

  function openAddCategory() {
    setCatModalBranch(branchSlug || branches?.[0]?.slug || "");
    setCatLabel("");
    setEditCat(null);
    setError(null);
    setCatModal("add");
  }

  function openEditCategory(cat: Doc<"menuCategories">) {
    setEditCat(cat);
    setCatLabel(cat.label);
    setCatModalBranch(cat.branchSlug);
    setError(null);
    setCatModal("edit");
  }

  function closeProductModal() {
    setProductModal(null);
    setEditProduct(null);
    setError(null);
  }

  function openAddProduct() {
    setProductModalBranch(branchSlug || branches?.[0]?.slug || "");
    setProductModalCategoryId(categoryId || "");
    setProductForm(emptyProduct());
    setEditProduct(null);
    setError(null);
    setProductModal("add");
  }

  async function handleSaveCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!adminToken || !catModalBranch || !catLabel.trim() || catSave.isLocked()) return;
    setError(null);
    try {
      const ok = await catSave.run(async () => {
        if (catModal === "add") {
          const id = await createCategory({
            adminToken,
            branchSlug: catModalBranch,
            label: catLabel.trim(),
          });
          setBranchSlug(catModalBranch);
          setCategoryId(id);
        } else if (catModal === "edit" && editCat) {
          await updateCategory({
            adminToken,
            id: editCat._id,
            label: catLabel.trim(),
            sortOrder: editCat.sortOrder,
            active: editCat.active,
          });
        }
        closeCatModal();
      });
      if (!ok) return;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save category.");
    }
  }

  function openEditProduct(p: Doc<"menuItems">) {
    setEditProduct(p);
    setProductForm({
      name: p.name,
      description: p.description ?? "",
      price: String(p.price),
      imageUrl: p.imageUrl ?? "",
      outOfStock: p.outOfStock ?? false,
    });
    setError(null);
    setProductModal("edit");
  }

  function openViewProduct(p: Doc<"menuItems">) {
    setEditProduct(p);
    setProductForm({
      name: p.name,
      description: p.description ?? "",
      price: String(p.price),
      imageUrl: p.imageUrl ?? "",
      outOfStock: p.outOfStock ?? false,
    });
    setProductModal("view");
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    const price = parseFloat(productForm.price);
    if (Number.isNaN(price) || price < 0) {
      setError("Enter a valid price.");
      return;
    }

    if (productModal === "add") {
      if (!adminToken || !productModalBranch || !productModalCategoryId) {
        setError("Select a branch and category.");
        return;
      }
    } else if (!adminToken || !editProduct) {
      return;
    }

    if (productSave.isLocked()) return;
    setError(null);
    try {
      const ok = await productSave.run(async () => {
        if (productModal === "add") {
          await createProduct({
            adminToken,
            branchSlug: productModalBranch,
            categoryId: productModalCategoryId as Id<"menuCategories">,
            name: productForm.name.trim(),
            description: productForm.description.trim() || undefined,
            price,
            imageUrl: productForm.imageUrl.trim() || undefined,
            outOfStock: productForm.outOfStock,
          });
          setBranchSlug(productModalBranch);
          setCategoryId(productModalCategoryId);
        } else if (productModal === "edit" && editProduct) {
          await updateProduct({
            adminToken,
            id: editProduct._id,
            name: productForm.name.trim(),
            description: productForm.description.trim() || undefined,
            price,
            imageUrl: productForm.imageUrl.trim() || undefined,
            sortOrder: editProduct.sortOrder,
            featured: editProduct.featured,
            outOfStock: productForm.outOfStock,
          });
        }
        closeProductModal();
      });
      if (!ok) return;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save menu item.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-lg text-coffee-dark">Menu</h1>
        <p className="mt-1 text-sm text-muted">
          Select a branch to manage its menu. Add categories, then add products under each
          category.
        </p>
      </div>

      <div className="rounded-2xl border border-outline/40 bg-white/70 p-4 shadow-card">
        <BranchSelectField
          label="Select branch"
          value={branchSlug}
          onChange={setBranchSlug}
          branches={branchOptions}
        />
      </div>

      {!branches?.length ? (
        <p className="text-sm text-muted">
          Add a branch first under{" "}
          <a href="/admin/branches" className="font-medium text-primary underline">
            Branches
          </a>
          , then return here to build the menu.
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="rounded-2xl border border-outline/40 bg-white/70 p-4 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-coffee-dark">Categories</h2>
              <button
                type="button"
                onClick={openAddCategory}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white"
                title="Add category"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <ul className="space-y-1">
              {!categories ? (
                <li className="text-xs text-muted">Loading…</li>
              ) : categories.length === 0 ? (
                <li className="text-xs text-muted">No categories — add one.</li>
              ) : (
                categories.map((cat) => (
                  <li key={cat._id} className="group flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setCategoryId(cat._id)}
                      className={cn(
                        "min-w-0 flex-1 rounded-xl px-3 py-2 text-left text-sm transition",
                        categoryId === cat._id
                          ? "bg-primary/12 font-medium text-primary"
                          : "hover:bg-cream",
                      )}
                    >
                      {cat.label}
                      {!cat.active && (
                        <span className="ml-1 text-xs text-muted">(hidden)</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditCategory(cat)}
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 hover:bg-cream"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({ kind: "category", item: cat })}
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-red-600 opacity-0 group-hover:opacity-100 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-outline/40 bg-white/70 p-4 shadow-card">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-coffee-dark">
                  {selectedCategory?.label ?? "Products"}
                </h2>
                <p className="text-xs text-muted">
                  Add a product: choose branch and category, then save.
                </p>
              </div>
              <button
                type="button"
                disabled={!branches?.length}
                onClick={openAddProduct}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Add menu item
              </button>
            </div>

            {!categoryId ? (
              <p className="text-sm text-muted">Select or create a category first.</p>
            ) : !products ? (
              <p className="text-sm text-muted">Loading products…</p>
            ) : products.length === 0 ? (
              <p className="text-sm text-muted">No items in this category yet.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {products.map((p) => (
                  <article
                    key={p._id}
                    className="flex gap-3 rounded-xl border border-outline/40 bg-white p-3"
                  >
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-cream">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-muted">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-coffee-dark">{p.name}</p>
                      <p className="text-sm font-semibold text-primary">
                        {formatPrice(p.price, listBranchCurrency)}
                      </p>
                      {p.outOfStock && (
                        <span className="text-xs font-medium text-red-600">Out of stock</span>
                      )}
                      <div className="mt-2 flex gap-1">
                        <button
                          type="button"
                          onClick={() => openViewProduct(p)}
                          className="rounded-lg border border-outline/40 p-1.5"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditProduct(p)}
                          className="rounded-lg border border-outline/40 p-1.5"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget({ kind: "product", item: p })}
                            className="rounded-lg border border-red-200 p-1.5 text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <AdminDeleteConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        itemName={
          deleteTarget?.kind === "category"
            ? deleteTarget.item.label
            : deleteTarget?.kind === "product"
              ? deleteTarget.item.name
              : ""
        }
        entityLabel={deleteTarget?.kind === "category" ? "category" : "menu item"}
        warning={
          deleteTarget?.kind === "category"
            ? "All products in this category will be removed."
            : undefined
        }
        onConfirm={async () => {
          if (!adminToken || !deleteTarget) return;
          if (deleteTarget.kind === "category") {
            await removeCategory({ adminToken, id: deleteTarget.item._id });
          } else {
            await removeProduct({ adminToken, id: deleteTarget.item._id });
          }
        }}
      />

      <AdminModal
        open={catModal !== null}
        onClose={closeCatModal}
        title={catModal === "add" ? "Add category" : "Edit category"}
        subtitle={catModal === "edit" && editCat ? `Editing ${editCat.label}` : undefined}
      >
        <form
          key={catModal === "edit" && editCat ? `cat-edit-${editCat._id}` : "cat-add"}
          onSubmit={handleSaveCategory}
          className="space-y-4"
          aria-busy={catSave.busy}
        >
          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          {catModal === "add" && (
            <BranchSelectField
              value={catModalBranch}
              onChange={setCatModalBranch}
              branches={branchOptions}
            />
          )}
          <AdminFormField label="Category name *">
            <input
              required
              value={catLabel}
              onChange={(e) => setCatLabel(e.target.value)}
              placeholder="e.g. Hot Café"
              className={adminInputClass}
            />
          </AdminFormField>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeCatModal}
              className="rounded-full px-4 py-2 text-sm text-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={catSave.busy || (catModal === "add" && !catModalBranch)}
              className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {catSave.busy ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        open={productModal === "view"}
        onClose={closeProductModal}
        title={productForm.name || "Menu item"}
        subtitle={selectedCategory?.label}
        wide
      >
        {productForm.imageUrl && (
          <img
            src={productForm.imageUrl}
            alt=""
            className="mb-4 h-48 w-full rounded-xl object-cover"
          />
        )}
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-muted">Description</dt>
            <dd>{productForm.description || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">Price</dt>
            <dd>
              {formatPrice(parseFloat(productForm.price) || 0, menuBranchCurrency)}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Stock</dt>
            <dd>{productForm.outOfStock ? "Out of stock" : "Available"}</dd>
          </div>
        </dl>
      </AdminModal>

      <AdminModal
        open={productModal === "add" || productModal === "edit"}
        onClose={closeProductModal}
        title={productModal === "add" ? "Add menu item" : "Edit menu item"}
        subtitle={
          productModal === "edit" && editProduct ? `Editing ${editProduct.name}` : undefined
        }
        wide
      >
        <form
          key={
            productModal === "edit" && editProduct
              ? `product-edit-${editProduct._id}`
              : "product-add"
          }
          onSubmit={handleSaveProduct}
          className="space-y-4"
          aria-busy={productSave.busy}
        >
          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          {productModal === "add" && (
            <>
              <BranchSelectField
                value={productModalBranch}
                onChange={(slug) => {
                  setProductModalBranch(slug);
                  setProductModalCategoryId("");
                }}
                branches={branchOptions}
              />
              <AdminFormField label="Select category *">
                <select
                  required
                  value={productModalCategoryId}
                  disabled={!productModalCategories?.length}
                  onChange={(e) =>
                    setProductModalCategoryId(e.target.value as Id<"menuCategories">)
                  }
                  className={adminInputClass}
                >
                  {!productModalCategories?.length && (
                    <option value="">No categories — add one first</option>
                  )}
                  {productModalCategories?.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </AdminFormField>
            </>
          )}

          <AdminFormField label="Item name *">
            <input
              required
              value={productForm.name}
              onChange={(e) => setProductForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Espresso"
              className={adminInputClass}
            />
          </AdminFormField>
          <AdminFormField label="Description">
            <textarea
              rows={3}
              value={productForm.description}
              onChange={(e) => setProductForm((f) => ({ ...f, description: e.target.value }))}
              className={cn(adminInputClass, "resize-none")}
            />
          </AdminFormField>
          <AdminFormField label={`Price (${getCurrencyLabel(menuBranchCurrency)}) *`}>
            <input
              required
              type="number"
              min={0}
              step={0.01}
              value={productForm.price}
              onChange={(e) => setProductForm((f) => ({ ...f, price: e.target.value }))}
              className={adminInputClass}
            />
            <p className="text-xs text-muted">
              Currency is set on the branch (Admin → Branches), not per menu item.
            </p>
          </AdminFormField>
          <AdminFormField label="Image URL">
            <input
              value={productForm.imageUrl}
              onChange={(e) => setProductForm((f) => ({ ...f, imageUrl: e.target.value }))}
              placeholder="https://…"
              className={adminInputClass}
            />
          </AdminFormField>
          {productForm.imageUrl && (
            <img
              src={productForm.imageUrl}
              alt=""
              className="h-32 w-full rounded-xl object-cover"
            />
          )}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={productForm.outOfStock}
              onChange={(e) =>
                setProductForm((f) => ({ ...f, outOfStock: e.target.checked }))
              }
            />
            Out of stock
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeProductModal}
              className="rounded-full px-4 py-2 text-sm text-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                productSave.busy ||
                (productModal === "add" &&
                  (!productModalBranch || !productModalCategoryId))
              }
              className="rounded-full bg-primary px-6 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {productSave.busy ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
