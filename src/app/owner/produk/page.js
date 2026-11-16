"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { CATEGORIES, LOW_STOCK_THRESHOLD, formatRupiah } from "@/lib/mockProducts";
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
import LowStockDropdown from "@/components/owner/LowStockDropdown";
import LowStockAlertSettingsModal from "@/components/owner/LowStockAlertSettingsModal";
import ProductToolbar from "@/components/owner/ProductToolbar";
import ProductFormDrawer from "@/components/owner/ProductFormDrawer";

const BarcodeScanner = dynamic(() => import("@/components/BarcodeScanner"), {
  ssr: false,
});

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
    String(nextData.barcode || "").trim() !== String(prevData.barcode || "").trim() ||
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

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState("add"); // 'add' | 'edit'
  const [activeProduct, setActiveProduct] = useState(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  const [statusMessage, setStatusMessage] = useState("");

  const showFlashMessage = useCallback((msg) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage("");
    }, 4500);
  }, []);

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
          showFlashMessage(
            `Berhasil menyinkronkan ${allProducts.length} produk dari backend.`
          );
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

  const handleNotifyLowStockEmail = async (email = "") => {
    setIsNotifyingEmail(true);
    try {
      const targetEmail = String(email || "").trim() || undefined;
      const result = await notifyLowStockInApi(targetEmail);
      showFlashMessage(
        result.message || "Notifikasi email low stock berhasil diproses."
      );
      return true;
    } catch (err) {
      showFlashMessage(`! Gagal mengirim email low stock: ${err.message}`);
      return false;
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

  // Shortcut F2 untuk fokus ke kotak pencarian
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "F2" && !isDrawerOpen && !isScheduleModalOpen && !scannerOpen) {
        e.preventDefault();
        document.getElementById("product-search")?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen, isScheduleModalOpen, scannerOpen]);

  const lowStockProducts = useMemo(() => {
    if (lowStockProductsApi.length > 0) {
      return lowStockProductsApi;
    }
    return products.filter(
      (p) =>
        p.aktif !== false &&
        Number(p.stok) <= Number(p.stokMinimum ?? LOW_STOCK_THRESHOLD)
    );
  }, [lowStockProductsApi, products]);

  const availableCategories = useMemo(() => {
    const set = new Set(CATEGORIES);
    products.forEach((p) => {
      if (p.kategori) set.add(p.kategori);
    });
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchCategory =
        selectedCategory === "Semua Kategori" || p.kategori === selectedCategory;
      const matchSearch =
        q === "" ||
        p.nama.toLowerCase().includes(q) ||
        p.kategori.toLowerCase().includes(q) ||
        (p.kodeProduk && p.kodeProduk.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q));
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
        const prevStok = Math.max(0, Math.round(Number(baseInitial?.stok ?? 0)));
        const nextStok = Math.max(
          0,
          Math.round(Number(productData.stok ?? prevStok))
        );
        const restockDelta = nextStok - prevStok;
        const detailChanged = hasProductDetailChanged(productData, baseInitial);

        let updated;
        if (restockDelta > 0) {
          if (detailChanged) {
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
          updated = await restockProductInApi(targetId, restockDelta);
        } else {
          updated = await updateProductInApi(
            targetId,
            productData,
            baseInitial
          );
        }

        setProducts((prev) =>
          prev
            .map((item) => (item.id === targetId ? updated : item))
            .filter((item) => matchesStatusFilter(item, statusFilter))
        );
        const restockSuffix =
          restockDelta > 0
            ? ` (+${restockDelta} ${updated.satuan || "pcs"})`
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
      // Error barcode (duplikat / format) dilempar ke drawer agar tampil di
      // bawah field Barcode; drawer tetap terbuka.
      if (err?.status === 400 && /barcode/i.test(err?.message || "")) {
        throw err;
      }
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
        "Produk dinonaktifkan. Pilih filter 'Produk Nonaktif' jika ingin mengaktifkannya kembali."
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

  const outOfStockItems = lowStockProducts.filter((p) => Number(p.stok) <= 0);
  const runningLowItems = lowStockProducts.filter((p) => Number(p.stok) > 0);

  return (
    <div className="flex flex-col gap-4 max-w-7xl mx-auto">
      {/* Alert Banner Perlu Restock (Sesuai Hi-Fi stockart-pos.html) */}
      {lowStockProducts.length > 0 && (
        <div
          role="status"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3 sm:px-4 py-3 border border-[#D9A441] rounded-md bg-[#FBF1DC] text-sm text-[#1F2A27]"
        >
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <svg
              aria-hidden="true"
              className="w-4 h-4 stroke-current text-[#7a5612] shrink-0 mt-0.5"
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
            <div className="min-w-0">
              <strong>Perlu restock:</strong>{" "}
              {[
                ...outOfStockItems.map((p) => `${p.nama} (habis)`),
                ...runningLowItems.map((p) => `${p.nama} (${p.stok})`),
              ].join(", ")}
              . Rekap stok menipis dikirim sesuai jadwal ke email owner.
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto sm:shrink-0">
            <LowStockDropdown
              items={lowStockProducts}
              onSelectProduct={handleOpenEdit}
              onOpenScheduleSettings={() => setIsScheduleModalOpen(true)}
            />
          </div>
        </div>
      )}

      {/* Status Alert Banner when changes are saved */}
      {statusMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`px-3 sm:px-4 py-2.5 border rounded-md flex items-center justify-between gap-3 text-sm ${
            statusMessage.startsWith("!")
              ? "border-[#C4574F] bg-[#F8E8E6] text-[#8c322b]"
              : "border-[#3E8E6A] bg-[#E6F2EC] text-[#245942]"
          }`}
        >
          <span className="min-w-0">{statusMessage}</span>
          <button
            type="button"
            onClick={() => setStatusMessage("")}
            className="shrink-0 inline-flex items-center min-h-11 -my-2.5 lg:min-h-0 lg:my-0 text-xs font-semibold hover:underline cursor-pointer"
            aria-label="Tutup pesan status"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Product Search, Filter, & Add Button Toolbar (Sesuai Hi-Fi stockart-pos.html) */}
      <ProductToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onScanBarcode={() => setScannerOpen(true)}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        categories={availableCategories}
        totalResults={filteredProducts.length}
        onAddProduct={handleOpenAdd}
        onOpenScheduleSettings={() => setIsScheduleModalOpen(true)}
      />

      {/* Tabel Produk Hi-Fi (Sesuai screenshot 4 & stockart-pos.html) */}
      <section
        aria-label="Daftar Produk Toko"
        className="bg-white border border-[#E1E4E0] rounded-lg overflow-hidden"
      >
        {isLoadingApi && products.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#6B7773]">
            Memuat katalog produk…
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center justify-center gap-2 text-[#6B7773]">
            <strong className="text-sm font-semibold text-[#1F2A27]">
              {apiError && products.length === 0
                ? "Gagal terhubung ke server backend"
                : "Barang tidak ditemukan"}
            </strong>
            <p className="text-xs max-w-sm">
              {apiError && products.length === 0
                ? apiError
                : "Tidak ada produk yang cocok dengan filter pencarian atau kategori ini."}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("Semua Kategori");
              }}
              className="mt-2 min-h-11 lg:min-h-[40px] px-4 border border-[#E1E4E0] rounded-md text-xs font-semibold bg-white hover:bg-[#F5F6F4] text-[#1F2A27] transition-colors cursor-pointer"
            >
              Hapus pencarian
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-[#F5F6F4] border-b border-[#E1E4E0] text-xs font-medium text-[#6B7773]">
                  <th className="py-2.5 px-3 sm:px-4">Produk</th>
                  <th className="py-2.5 px-3 sm:px-4 hidden md:table-cell">Kategori</th>
                  <th className="py-2.5 px-3 sm:px-4 text-right hidden sm:table-cell">Harga</th>
                  <th className="py-2.5 px-3 sm:px-4 text-right">Stok</th>
                  <th className="py-2.5 px-3 sm:px-4 text-right">
                    <span className="sr-only">Aksi</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1E4E0]">
                {filteredProducts.map((product) => {
                  const isInactive = product.aktif === false;
                  const stokNum = Number(product.stok || 0);
                  const isOut = !isInactive && stokNum <= 0;
                  const isLow =
                    !isInactive &&
                    !isOut &&
                    (product.isLowStock !== undefined
                      ? Boolean(product.isLowStock)
                      : stokNum <=
                        Number(product.stokMinimum ?? LOW_STOCK_THRESHOLD));

                  return (
                    <tr
                      key={product.id}
                      className={
                        isInactive
                          ? "opacity-60 bg-[#fafbfa]"
                          : "hover:bg-[#F5F6F4]/60"
                      }
                    >
                      <td className="py-2.5 px-3 sm:px-4 min-w-0">
                        <div className="font-semibold text-[#1F2A27] wrap-break-word">
                          {product.nama}
                        </div>
                        {/* Harga & kategori ditampilkan di sini pada layar kecil (kolomnya disembunyikan) */}
                        <div className="sm:hidden text-xs text-[#1F2A27] tabular-nums">
                          {formatRupiah(product.harga)}
                          <span className="text-[#6B7773]"> &middot; {product.kategori}</span>
                        </div>
                        <div className="hidden sm:block md:hidden text-xs text-[#6B7773]">
                          {product.kategori}
                        </div>
                        <div className="text-xs text-[#6B7773] font-mono">
                          {product.kodeProduk || "-"}
                        </div>
                        {product.barcode && (
                          <div
                            className="text-[11px] text-[#6B7773] font-mono"
                            title={`Barcode ${product.barcode}`}
                          >
                            <svg aria-hidden="true" className="inline-block w-3 h-3 mr-1 -mt-px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M4 6v12M8 6v12M12 6v12M15 6v12M20 6v12" /></svg>
                            {product.barcode}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 sm:px-4 hidden md:table-cell text-[#1F2A27]">
                        {product.kategori}
                      </td>
                      <td className="py-2.5 px-3 sm:px-4 text-right tabular-nums whitespace-nowrap text-[#1F2A27] hidden sm:table-cell">
                        {formatRupiah(product.harga)}
                      </td>
                      <td className="py-2.5 px-3 sm:px-4 text-right tabular-nums whitespace-nowrap">
                        <div className="inline-flex flex-col-reverse sm:flex-row items-end sm:items-center justify-end gap-1 sm:gap-2">
                          {isInactive ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F5F6F4] text-[#6B7773]">
                              Nonaktif
                            </span>
                          ) : isOut ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F8E8E6] text-[#C4574F]">
                              Habis
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FBF1DC] text-[#D9A441]">
                              Menipis
                            </span>
                          ) : null}
                          <strong className="font-semibold text-[#1F2A27]">
                            {stokNum}
                          </strong>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 sm:px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(product)}
                          aria-label={`Edit ${product.nama}`}
                          className="min-h-11 min-w-11 justify-center lg:min-h-[38px] px-2.5 sm:px-3.5 border border-[#E1E4E0] rounded-md bg-white hover:bg-[#F5F6F4] text-sm font-semibold text-[#1F2A27] inline-flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <svg
                            aria-hidden="true"
                            className="w-4 h-4 stroke-current"
                            fill="none"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            viewBox="0 0 24 24"
                          >
                            <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                            <path d="m15 5 4 4" />
                          </svg>
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal Form Add & Edit Product */}
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

      {/* Modal Pengaturan Jadwal Alert Low Stock */}
      <LowStockAlertSettingsModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onNotifyNow={handleNotifyLowStockEmail}
        isNotifying={isNotifyingEmail}
        lowStockCount={lowStockProducts.length}
        onSaved={() => {
          showFlashMessage("Jadwal alert low stock berhasil diperbarui.");
        }}
      />

      {/* Scanner Barcode opsional untuk cari / cek stok / restock produk */}
      <BarcodeScanner
        open={scannerOpen}
        continuous={false}
        onDetected={(code) => {
          const scanned = String(code || "").trim();
          if (!scanned) return;
          setSelectedCategory("Semua Kategori");
          setSearchQuery(scanned);
        }}
        onClose={() => setScannerOpen(false)}
      />
    </div>
  );
}
