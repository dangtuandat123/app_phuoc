'use client';

import { useState, useEffect } from 'react';
import BarcodeScanner from './components/BarcodeScanner';
import ProductCard from './components/ProductCard';
import ProductForm from './components/ProductForm';

interface Product {
  barcode: string;
  name: string;
  price: number;
}

type AppState = 'idle' | 'scanning' | 'loading' | 'found' | 'not-found' | 'error' | 'editing';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('scanning'); // Default to scanning
  const [isScanning, setIsScanning] = useState(true); // Default to true
  const [product, setProduct] = useState<Product | null>(null);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ensuring scan starts on mount (if permission allows)
  useEffect(() => {
    setIsScanning(true);
    setAppState('scanning');
  }, []);

  const handleScanSuccess = async (barcode: string) => {
    setScannedBarcode(barcode);
    setAppState('loading');

    try {
      const response = await fetch(`/api/product?barcode=${encodeURIComponent(barcode)}`);
      const data = await response.json();

      if (data.found) {
        setProduct(data.product);
        setAppState('found');
      } else {
        setAppState('not-found');
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      setError('Lỗi kết nối server!');
      setAppState('error');
    }
  };

  const handleScanError = (errorMessage: string) => {
    // Only show error if we really can't start the camera
    console.warn("Scanner warning:", errorMessage);
    // Don't stop scanning on minor errors, but if permission denied:
    if (errorMessage.includes("quyền")) {
      setError(errorMessage);
      setAppState('error');
    }
  };

  const handleAddProduct = async (newProduct: Product) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });
      const data = await response.json();
      if (data.success) {
        setProduct(newProduct);
        setAppState('found');
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error(err);
      setError('Không thể thêm sản phẩm.');
      setAppState('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/product', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct),
      });
      const data = await response.json();
      if (data.success) {
        setProduct(updatedProduct);
        setAppState('found');
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error(err);
      setError('Không thể cập nhật sản phẩm.');
      setAppState('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = () => setAppState('editing');

  const resetApp = () => {
    setProduct(null);
    setScannedBarcode('');
    setError('');
    // Auto restart scanning
    setIsScanning(true);
    setAppState('scanning');
  };

  const cancelEdit = () => {
    product ? setAppState('found') : resetApp();
  };

  return (
    <main className="app-container">
      <header className="app-header">
        <h1>BARCODE SCANNER</h1>
      </header>

      <div className="app-content">
        {appState === 'loading' && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Đang tìm sản phẩm...</p>
          </div>
        )}

        {appState === 'error' && (
          <div className="error-card">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
            <button className="btn-retry" onClick={resetApp}>Quét lại</button>
          </div>
        )}

        {appState === 'found' && product && (
          <ProductCard
            product={product}
            onClose={resetApp}
            onEdit={handleEditClick}
          />
        )}

        {appState === 'not-found' && (
          <ProductForm
            barcode={scannedBarcode}
            onSubmit={handleAddProduct}
            onCancel={resetApp}
            isLoading={isSubmitting}
          />
        )}

        {appState === 'editing' && product && (
          <ProductForm
            barcode={product.barcode}
            initialData={{ name: product.name, price: product.price }}
            onSubmit={handleUpdateProduct}
            onCancel={cancelEdit}
            isLoading={isSubmitting}
          />
        )}

        {(appState === 'idle' || appState === 'scanning') && (
          <div className="scanner-wrapper" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <BarcodeScanner
              onScanSuccess={handleScanSuccess}
              onScanError={handleScanError}
              isScanning={isScanning}
              setIsScanning={(scanning) => {
                setIsScanning(scanning);
                if (!scanning && appState === 'scanning') {
                  // If scanner stopped itself (e.g. error), keep state sync?
                  // Actually BarcodeScanner component handles button click to stop.
                  // Here we just want it to be always valid.
                }
              }}
            />
            {/* Hide Manual Start Button if Scanning */}
            {!isScanning && (
              <button className="scan-button" onClick={() => { setIsScanning(true); setAppState('scanning'); }}>
                BẮT ĐẦU QUÉT
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
