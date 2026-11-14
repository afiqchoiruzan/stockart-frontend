"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { CATEGORIES, LOW_STOCK_THRESHOLD } from "@/lib/mockProducts";
import {
  fetchProductsFromApi,
  fetchProductByIdFromApi,
  fetchLowStockProductsFromApi,
  createProductInApi,
  updateProductInApi,
  restockProductInApi,
  deleteProductInApi,
  restoreProductInApi,
  notifyLowStockInApi,
} from "@/lib/api";
import ApiSourceBar from "@/components/owner/ApiSourceBar";
import LowStockDropdown from "@/components/owner/LowStockDropdown";
import ProductToolbar from "@/components/owner/ProductToolbar";
import ProductCard from "@/components/owner/ProductCard";
import ProductFormDrawer from "@/components/owner/ProductFormDrawer";

function matchesStatusFilter(product, filter) {
  if (filter === "all") return true;
  if (filter === "false") return product?.aktif === false;
  return product?.aktif !== false;
}

function hasProductDetailChanged(nextData, prevData) {
  if (!prevData) return true;
  return (
    String(nextData.nama || "").trim() !== String(prevData.nama || "").trim() ||
    String(nextData.kodeProduk || "").trim().toUpperCase() !==
      String(prevData.kodeProduk || "").trim().toUpperCase() ||
    String(nextData.kategori || "").trim() !== String(prevData.kategori || "").trim() ||
    String(nextData.satuan || "pcs").trim() !== String(prevData.satuan || "pcs").trim() ||
    Number(nextData.hargaBeli) !== Number(prevData.hargaBeli) ||
    Number(nextData.hargaJual) !== Number(prevData.hargaJual) ||
    Number(nextData.stokMinimum) !== Number(prevData.stokMinimum) ||
    String(nextData.deskripsi || "").trim() !== String(prevData.deskripsi || "").trim()
  );
}

export default function OwnerProdukPage() {
  const [products, setProducts] = useState([]);
  const [isLoadingApi, setIsLoadingApi] = useState(true);
  const [apiError, setApiError] = useState("");
  const [lowStockProductsApi, setLowStockProductsApi] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua Kategori");
  const [statusFilter, setStatusFilter] = useState("true"); // 'true' | 'false' | 'all'
  const [isNotifyingEmail, setIsNotifyingEmail] = useState(false);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState("add"); // 'add' | 'edit'
  const [activeProduct, setActiveProduct] = useState(null);

  // Success flash message
  const [statusMessage, setStatusMessage] = useState("");

  const showFlashMessage = useCallback((msg) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage("");
    }, 4500);
  }, []);

  // Memuat data produk dan low stock dari backend API
  const loadFromBackend = useCallback(
    async (aktifOverride = statusFilter, silent = false) => {
      setIsLoadingApi(true);
      setApiError("");
      try {
        const [allProducts, lowStockItems] = await Promise.all([
          fetchProductsFromApi({ aktif: aktifOverride }),
          fetchLowStockProductsFromApi().catch(() => []),
        ]);
        setProducts(allProducts);
        setLowStockProductsApi(lowStockItems);
        if (!silent) {
          showFlashMessage(`Berhasil menyinkronkan ${allProducts.length} produk dari backend.`);
        }
      } catch (err) {
        const errMsg = err.message || "Server backend belum berjalan";
        setApiError(errMsg);
        showFlashMessage(`! Gagal sinkron API: ${errMsg}`);
      } finally {
        setIsLoadingApi(false);
      }
    },
    [showFlashMessage, statusFilter]
  );

  const handleStatusFilterChange = (nextStatus) => {
    setStatusFilter(nextStatus);
    loadFromBackend(nextStatus, true);
  };

  const handleNotifyLowStockEmail = async () => {
    setIsNotifyingEmail(true);
    try {
      const result = await notifyLowStockInApi();
      showFlashMessage(
        result.message || "Notifikasi email low stock berhasil diproses."
      );
    } catch (err) {
      showFlashMessage(`! Gagal mengirim email low stock: ${err.message}`);
    } finally {
      setIsNotifyingEmail(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    Promise.all([
      fetchProductsFromApi(),
      fetchLowStockProductsFromApi().catch(() => []),
    ])
      .then(([allProducts, lowStockItems]) => {
        if (ignore) return;
        setProducts(allProducts);
        setLowStockProductsApi(lowStockItems);
      })
      .catch((err) => {
        if (ignore) return;
        const errMsg = err.message || "Server backend belum berjalan";
        setApiError(errMsg);
      })
      .finally(() => {
        if (!ignore) setIsLoadingApi(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Filter low stock products for the header dropdown
  const lowStockProducts = useMemo(() => {
    if (lowStockProductsApi.length > 0) {
      return lowStockProductsApi;
    }
    return products.filter(
      (p) => p.aktif !== false && Number(p.stok) <= Number(p.stokMinimum ?? LOW_STOCK_THRESHOLD)
    );
  }, [lowStockProductsApi, products]);

  // Kategori dinamis (gabungan preset + kategori unik dari database)
  const availableCategories = useMemo(() => {
    const set = new Set(CATEGORIES);
    products.forEach((p) => {
      if (p.kategori) set.add(p.kategori);
    });
    return Array.from(set);
  }, [products]);

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchCategory =
        selectedCategory === "Semua Kategori" || p.kategori === selectedCategory;
      const matchSearch =
        q === "" ||
        p.nama.toLowerCase().includes(q) ||
        p.kategori.toLowerCase().includes(q) ||
        (p.kodeProduk && p.kodeProduk.toLowerCase().includes(q));
      return matchCategory && matchSearch;
    });
  }, [products, searchQuery, selectedCategory]);

  const refreshLowStock = useCallback(() => {
    fetchLowStockProductsFromApi()
      .then(setLowStockProductsApi)
      .catch(() => {});
  }, []);

  const handleOpenEdit = (product) => {
    setDrawerMode("edit");
    setActiveProduct(product);
    setIsDrawerOpen(true);

    // Sinkronkan detail terbaru produk dari GET /api/products/:id
    if (product?.id) {
      fetchProductByIdFromApi(product.id)
        .then((fresh) => {
          setActiveProduct((prev) =>
            prev && prev.id === fresh.id ? fresh : prev
          );
          setProducts((prev) =>
            prev.map((item) => (item.id === fresh.id ? fresh : item))
          );
        })
        .catch(() => {});
    }
  };

  const handleOpenAdd = () => {
    setDrawerMode("add");
    setActiveProduct(null);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setActiveProduct(null);
  };

  const handleSaveProduct = async (productData, mode, initialData = null) => {
    setIsSubmittingAction(true);
    try {
      if (mode === "edit") {
        const targetId = productData.id || productData._id;
        const baseInitial = initialData || activeProduct;
        const { stockAction } = productData;

        let updated;
        if (stockAction?.mode === "restock") {
          const restockQty = Math.max(
            0,
            Math.round(Number(stockAction.restockJumlah || 0))
          );
          const detailChanged = hasProductDetailChanged(productData, baseInitial);

          if (detailChanged || restockQty === 0) {
            updated = await updateProductInApi(
              targetId,
              { ...productData, omitStok: true },
              baseInitial
            );
            setProducts((prev) =>
              prev
                .map((item) => (item.id === targetId ? updated : item))
                .filter((item) => matchesStatusFilter(item, statusFilter))
            );
          }

          if (restockQty > 0) {
            updated = await restockProductInApi(targetId, restockQty);
          }
        } else {
          updated = await updateProductInApi(targetId, productData, baseInitial);
        }

        setProducts((prev) =>
          prev
            .map((item) => (item.id === targetId ? updated : item))
            .filter((item) => matchesStatusFilter(item, statusFilter))
        );
        const restockSuffix =
          stockAction?.mode === "restock" && Number(stockAction.restockJumlah) > 0
            ? ` (+${Math.round(Number(stockAction.restockJumlah))} ${updated.satuan || "pcs"})`
            : "";
        showFlashMessage(
          `Produk "${updated.nama}" berhasil diperbarui${restockSuffix}.`
        );
      } else {
        const created = await createProductInApi(productData);
        if (matchesStatusFilter(created, statusFilter)) {
          setProducts((prev) => [created, ...prev]);
        }
        showFlashMessage(`Produk "${created.nama}" berhasil ditambahkan.`);
      }

      refreshLowStock();
      handleCloseDrawer();
    } catch (err) {
      showFlashMessage(`! Gagal menyimpan produk: ${err.message}`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleDeactivateProduct = async (productId) => {
    setIsSubmittingAction(true);
    try {
      await deleteProductInApi(productId, false);
      setProducts((prev) =>
        prev
          .map((item) =>
            item.id === productId ? { ...item, aktif: false } : item
          )
          .filter((item) => matchesStatusFilter(item, statusFilter))
      );
      refreshLowStock();
      handleCloseDrawer();
      showFlashMessage(
        "Produk dinonaktifkan. Pilih filter 'Nonaktif' jika ingin mengaktifkannya kembali."
      );
    } catch (err) {
      showFlashMessage(`! Gagal menonaktifkan produk: ${err.message}`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleRestoreProduct = async (productId) => {
    setIsSubmittingAction(true);
    try {
      const restored = await restoreProductInApi(productId);
      setProducts((prev) =>
        prev
          .map((item) => (item.id === productId ? restored : item))
          .filter((item) => matchesStatusFilter(item, statusFilter))
      );
      refreshLowStock();
      handleCloseDrawer();
      showFlashMessage(`Produk "${restored.nama}" berhasil diaktifkan kembali.`);
    } catch (err) {
      showFlashMessage(`! Gagal mengaktifkan produk: ${err.message}`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handlePermanentDeleteProduct = async (productId) => {
    setIsSubmittingAction(true);
    try {
      await deleteProductInApi(productId, true);
      setProducts((prev) => prev.filter((item) => item.id !== productId));
      refreshLowStock();
      handleCloseDrawer();
      showFlashMessage("Produk berhasil dihapus permanen.");
    } catch (err) {
      showFlashMessage(`! Gagal menghapus produk: ${err.message}`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Top Header Section */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b-2 border-black">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-black">
            Menu Produk
          </h1>
        </div>

        {/* Action Group: Low Stock Dropdown + Tambah Produk */}
        <div className="flex items-center gap-3">
          <LowStockDropdown
            items={lowStockProducts}
            onSelectProduct={handleOpenEdit}
            onNotifyEmail={handleNotifyLowStockEmail}
            isNotifying={isNotifyingEmail}
          />

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 min-h-[44px] border-2 border-black rounded text-sm font-bold bg-white hover:bg-neutral-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <span>+</span>
            <span>Tambah Produk</span>
          </button>
        </div>
      </header>

      {/* Live API Backend Source Bar */}
      <ApiSourceBar
        dataSource="api"
        isLoading={isLoadingApi}
        apiError={apiError}
        onRefreshApi={() => loadFromBackend(statusFilter)}
        endpointPath="/products"
      />

      {/* Status Alert Banner when changes are saved */}
      {statusMessage && (
        <div
          role="status"
          aria-live="polite"
          className="p-3 border-2 border-black rounded bg-neutral-100 flex items-center justify-between text-sm font-medium text-black"
        >
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold">
              {statusMessage.startsWith("!") ? "[!]" : "[OK]"}
            </span>
            <span>{statusMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage("")}
            className="text-xs font-mono font-bold hover:underline"
            aria-label="Tutup pesan status"
          >
            [Tutup]
          </button>
        </div>
      )}

      {/* Product Search & Filter Toolbar */}
      <ProductToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        categories={availableCategories}
        totalResults={filteredProducts.length}
      />

      {/* Full-Width Lo-Fi Product Grid */}
      <section aria-label="Daftar Produk Toko">
        {filteredProducts.length === 0 ? (
          apiError && products.length === 0 ? (
            <div className="p-10 border-2 border-dashed border-black/50 rounded text-center flex flex-col items-center justify-center gap-3 bg-neutral-100">
              <span className="px-2.5 py-0.5 border border-black rounded font-mono font-bold text-xs bg-white text-black">
                [SERVER BACKEND BELUM TERHUBUNG]
              </span>
              <p className="font-bold text-base text-black">
                Gagal Terhubung ke Backend API
              </p>
              <p className="text-xs text-neutral-700 max-w-md leading-relaxed">
                {apiError}
              </p>
              <div className="p-3 bg-white border border-black rounded text-left font-mono text-xs w-full max-w-md flex flex-col gap-1">
                <p className="text-neutral-600 font-bold">Langkah menyalakan backend:</p>
                <p className="text-black">1. Buka terminal baru (PowerShell / Command Prompt)</p>
                <p className="text-black">2. Masuk ke folder backend: <span className="font-bold">cd stockart-backend</span></p>
                <p className="text-black">3. Jalankan server: <span className="font-bold bg-neutral-200 px-1 py-0.5 rounded">npm run dev</span></p>
                <p className="text-black">4. Klik tombol <strong>[ Sinkron Ulang API ]</strong> di bawah</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={loadFromBackend}
                  disabled={isLoadingApi}
                  className="px-4 py-2 min-h-[40px] border-2 border-black rounded text-xs font-bold bg-black text-white hover:bg-neutral-800 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
                >
                  {isLoadingApi ? "Memeriksa Koneksi..." : "[ Sinkron Ulang API ]"}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 border-2 border-dashed border-black/50 rounded text-center flex flex-col items-center justify-center gap-3 bg-neutral-50">
              <p className="font-bold text-base text-black">
                Tidak ada produk yang cocok
              </p>
              <p className="text-xs text-neutral-600 max-w-sm">
                Coba gunakan kata kunci pencarian lain atau pilih kategori &quot;Semua Kategori&quot;.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("Semua Kategori");
                }}
                className="mt-2 px-4 py-2 min-h-[40px] border border-black rounded text-xs font-bold bg-white hover:bg-neutral-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
              >
                Reset Filter Pencarian
              </button>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={handleOpenEdit}
              />
            ))}
          </div>
        )}
      </section>

      {/* Slide-Over Drawer for Add & Edit Product */}
      <ProductFormDrawer
        isOpen={isDrawerOpen}
        mode={drawerMode}
        initialData={activeProduct}
        categories={availableCategories.filter((c) => c !== "Semua Kategori")}
        isSubmitting={isSubmittingAction}
        onClose={handleCloseDrawer}
        onSubmit={handleSaveProduct}
        onDeactivate={handleDeactivateProduct}
        onRestore={handleRestoreProduct}
        onPermanentDelete={handlePermanentDeleteProduct}
      />
    </div>
  );
}
