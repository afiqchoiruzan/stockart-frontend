"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { LOW_STOCK_THRESHOLD, INITIAL_PRODUCTS } from "@/lib/mockProducts";
import {
  fetchProductsFromApi,
  fetchLowStockProductsFromApi,
  createProductInApi,
  updateProductInApi,
} from "@/lib/api";
import ApiSourceBar from "@/components/owner/ApiSourceBar";
import LowStockDropdown from "@/components/owner/LowStockDropdown";
import ProductToolbar from "@/components/owner/ProductToolbar";
import ProductCard from "@/components/owner/ProductCard";
import ProductFormDrawer from "@/components/owner/ProductFormDrawer";

export default function OwnerProdukPage() {
  const [dataSource, setDataSource] = useState("api"); // 'api' | 'mock'
  const [apiProducts, setApiProducts] = useState([]);
  const [mockProducts, setMockProducts] = useState(INITIAL_PRODUCTS);
  const [isLoadingApi, setIsLoadingApi] = useState(true);
  const [apiError, setApiError] = useState("");
  const [lowStockProductsApi, setLowStockProductsApi] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua Kategori");

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
  const loadFromBackend = useCallback(async () => {
    setIsLoadingApi(true);
    setApiError("");
    try {
      const [allProducts, lowStockItems] = await Promise.all([
        fetchProductsFromApi(),
        fetchLowStockProductsFromApi().catch(() => []),
      ]);
      setApiProducts(allProducts);
      setLowStockProductsApi(lowStockItems);
      setDataSource("api");
    } catch (err) {
      setApiError(err.message || "Server backend belum berjalan");
      setDataSource("mock");
    } finally {
      setIsLoadingApi(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      fetchProductsFromApi(),
      fetchLowStockProductsFromApi().catch(() => []),
    ])
      .then(([allProducts, lowStockItems]) => {
        if (ignore) return;
        setApiProducts(allProducts);
        setLowStockProductsApi(lowStockItems);
        setDataSource("api");
      })
      .catch((err) => {
        if (ignore) return;
        setApiError(err.message || "Server backend belum berjalan");
        setDataSource("mock");
      })
      .finally(() => {
        if (!ignore) setIsLoadingApi(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Sumber data aktif (API Backend atau Mock)
  const products = dataSource === "api" ? apiProducts : mockProducts;

  // Filter low stock products for the header dropdown
  const lowStockProducts = useMemo(() => {
    if (dataSource === "api" && lowStockProductsApi.length > 0) {
      return lowStockProductsApi;
    }
    return products.filter(
      (p) => Number(p.stok) <= Number(p.stokMinimum ?? LOW_STOCK_THRESHOLD)
    );
  }, [dataSource, lowStockProductsApi, products]);

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

  const handleOpenEdit = (product) => {
    setDrawerMode("edit");
    setActiveProduct(product);
    setIsDrawerOpen(true);
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
    try {
      if (dataSource === "api") {
        if (mode === "edit") {
          const targetId = productData.id || productData._id;
          const updated = await updateProductInApi(targetId, productData, initialData || activeProduct);
          setApiProducts((prev) =>
            prev.map((item) => (item.id === targetId ? updated : item))
          );
          showFlashMessage(`Produk "${updated.nama}" berhasil diperbarui di backend.`);
        } else {
          const created = await createProductInApi(productData);
          setApiProducts((prev) => [created, ...prev]);
          showFlashMessage(`Produk "${created.nama}" berhasil ditambahkan ke backend.`);
        }

        // Refresh low stock items dari backend
        fetchLowStockProductsFromApi()
          .then(setLowStockProductsApi)
          .catch(() => {});
      } else {
        // Mode Mock / Simulasi Lokal
        if (mode === "edit") {
          const targetId = productData.id || productData._id;
          setMockProducts((prev) =>
            prev.map((item) =>
              item.id === targetId
                ? {
                    ...item,
                    nama: productData.nama,
                    kategori: productData.kategori,
                    harga: Number(productData.harga),
                    hargaJual: Number(productData.harga),
                    stok: Number(productData.stok),
                    isLowStock: Number(productData.stok) <= Number(item.stokMinimum ?? LOW_STOCK_THRESHOLD),
                  }
                : item
            )
          );
          showFlashMessage(`[Mock] Produk "${productData.nama}" berhasil diperbarui.`);
        } else {
          const newMock = {
            id: `mock-prd-${Date.now()}`,
            kodeProduk: `PRD-MOCK-${Math.floor(100 + Math.random() * 900)}`,
            nama: productData.nama,
            kategori: productData.kategori,
            harga: Number(productData.harga),
            hargaJual: Number(productData.harga),
            hargaBeli: Math.round(Number(productData.harga) * 0.85),
            stok: Number(productData.stok),
            satuan: "pcs",
            stokMinimum: LOW_STOCK_THRESHOLD,
            isLowStock: Number(productData.stok) <= LOW_STOCK_THRESHOLD,
          };
          setMockProducts((prev) => [newMock, ...prev]);
          showFlashMessage(`[Mock] Produk "${productData.nama}" berhasil ditambahkan.`);
        }
      }

      handleCloseDrawer();
    } catch (err) {
      showFlashMessage(`! Gagal menyimpan produk: ${err.message}`);
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

      {/* Developer Source Bar: Live API Backend vs Mode Mock */}
      <ApiSourceBar
        dataSource={dataSource}
        isLoading={isLoadingApi}
        apiError={apiError}
        onRefreshApi={loadFromBackend}
        onSwitchSource={setDataSource}
        endpointPath="/products"
        mockName="mockProducts.js"
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
        totalResults={filteredProducts.length}
      />

      {/* Full-Width Lo-Fi Product Grid */}
      <section aria-label="Daftar Produk Toko">
        {filteredProducts.length === 0 ? (
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
        onClose={handleCloseDrawer}
        onSubmit={handleSaveProduct}
      />
    </div>
  );
}
