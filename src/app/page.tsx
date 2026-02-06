'use client';

import { useState } from 'react';
import BarcodeScanner from './components/BarcodeScanner';
import ProductCard from './components/ProductCard';
import ProductForm from './components/ProductForm';

interface Product {
  barcode: string;
  name: string;
  price: number;
}

type AppState = 'idle' | 'scanning' | 'loading' | 'found' | 'not-found' | 'error';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [isScanning, setIsScanning] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setError('Không thể kết nối đến server. Vui lòng thử lại.');
      setAppState('error');
    }
  };

  const handleScanError = (errorMessage: string) => {
    setError(errorMessage);
    setAppState('error');
  };

  const handleAddProduct = async (newProduct: Product) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProduct),
      });

      const data = await response.json();

      if (data.success) {
        setProduct(newProduct);
        setAppState('found');
      } else {
        setError('Không thể lưu sản phẩm. Vui lòng thử lại.');
        setAppState('error');
      }
    } catch (err) {
      console.error('Error adding product:', err);
      setError('Không thể kết nối đến server. Vui lòng thử lại.');
      setAppState('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetApp = () => {
    setAppState('idle');
    setProduct(null);
    setScannedBarcode('');
    setError('');
    setIsScanning(false);
  };

  return (
    <main className="app-container">
      <header className="app-header">
        <h1>📦 Barcode Scanner</h1>
        <p>Quét mã vạch để tra cứu sản phẩm</p>
      </header>

      <div className="app-content">
        {appState === 'loading' && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Đang tìm kiếm sản phẩm...</p>
          </div>
        )}

        {appState === 'error' && (
          <div className="error-card">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
            <button className="btn-retry" onClick={resetApp}>
              Thử lại
            </button>
          </div>
        )}

        {appState === 'found' && product && (
          <ProductCard product={product} onClose={resetApp} />
        )}

        {appState === 'not-found' && (
          <ProductForm
            barcode={scannedBarcode}
            onSubmit={handleAddProduct}
            onCancel={resetApp}
            isLoading={isSubmitting}
          />
        )}

        {(appState === 'idle' || appState === 'scanning') && (
          <BarcodeScanner
            onScanSuccess={handleScanSuccess}
            onScanError={handleScanError}
            isScanning={isScanning}
            setIsScanning={(scanning) => {
              setIsScanning(scanning);
              setAppState(scanning ? 'scanning' : 'idle');
            }}
          />
        )}
      </div>

      <footer className="app-footer">
        <p>Sử dụng camera để quét mã vạch sản phẩm</p>
      </footer>
    </main>
  );
}
