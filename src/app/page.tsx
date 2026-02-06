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
  // Always start with scanning state
  const [appState, setAppState] = useState<AppState>('scanning');
  const [isScanning, setIsScanning] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // When app mounts, ensure scanning is active
  useEffect(() => {
    setIsScanning(true);
    setAppState('scanning');
  }, []);

  const handleScanSuccess = async (barcode: string) => {
    // Stop scanning immediately on success
    setIsScanning(false);
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
    setError(errorMessage);
    setAppState('error');
    setIsScanning(false);
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
      setError('Lỗi khi lưu sản phẩm.');
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
      setError('Lỗi khi cập nhật sản phẩm.');
      setAppState('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetApp = () => {
    setProduct(null);
    setScannedBarcode('');
    setError('');
    setIsScanning(true);
    setAppState('scanning');
  };

  return (
    <main className="app-container">
      <header className="app-header">
        <h1>BÁO GIÁ SẢN PHẨM</h1>
      </header>

      <div className="app-content">
        {appState === 'loading' && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Đang tìm...</p>
          </div>
        )}

        {appState === 'error' && (
          <div className="error-card">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
            <button className="btn-retry" onClick={resetApp}>QUÉT LẠI</button>
          </div>
        )}

        {appState === 'found' && product && (
          <ProductCard
            product={product}
            onClose={resetApp}
            onEdit={() => setAppState('editing')}
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
            onCancel={() => setAppState('found')}
            isLoading={isSubmitting}
          />
        )}

        {(appState === 'scanning') && (
          <div style={{ width: '100%' }}>
            <BarcodeScanner
              onScanSuccess={handleScanSuccess}
              onScanError={handleScanError}
              isScanning={isScanning}
              setIsScanning={setIsScanning}
            />

            {!isScanning && (
              <button className="scan-button" style={{ marginTop: '2rem' }} onClick={resetApp}>
                BẬT CAMERA QUÉT
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
