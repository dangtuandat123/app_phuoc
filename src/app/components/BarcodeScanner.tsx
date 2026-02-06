'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface BarcodeScannerProps {
    onScanSuccess: (barcode: string) => void;
    onScanError?: (error: string) => void;
    isScanning: boolean;
    setIsScanning: (scanning: boolean) => void;
}

export default function BarcodeScanner({
    onScanSuccess,
    onScanError,
    isScanning,
    setIsScanning,
}: BarcodeScannerProps) {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [isInitializing, setIsInitializing] = useState(false);

    useEffect(() => {
        // Initial start if isScanning is true
        if (isScanning) {
            const timer = setTimeout(startScanner, 600); // Increased delay for stability
            return () => {
                clearTimeout(timer);
                stopScanner();
            };
        }
        return () => stopScanner();
    }, []);

    // Update scanner when isScanning changes
    useEffect(() => {
        if (isScanning) {
            startScanner();
        } else {
            stopScanner();
        }
    }, [isScanning]);

    const startScanner = async () => {
        if (isInitializing) return;

        // If scanner is already active, don't re-initialize
        if (scannerRef.current && scannerRef.current.isScanning) {
            return;
        }

        setIsInitializing(true);

        try {
            // Always create a fresh instance to avoid state pollution
            if (scannerRef.current) {
                try {
                    if (scannerRef.current.isScanning) await scannerRef.current.stop();
                } catch (e) { }
            }

            // Clear the container to be safe
            const container = document.getElementById('barcode-reader');
            if (container) container.innerHTML = "";

            scannerRef.current = new Html5Qrcode('barcode-reader');

            const config = {
                fps: 20,
                qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
                    const width = viewfinderWidth * 0.9;
                    const height = Math.min(viewfinderHeight * 0.5, 250);
                    return { width, height };
                },
                aspectRatio: 1.0,
                formatsToSupport: [
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.CODE_39,
                    Html5QrcodeSupportedFormats.UPC_A,
                    Html5QrcodeSupportedFormats.UPC_E,
                    Html5QrcodeSupportedFormats.ITF
                ],
                experimentalFeatures: {
                    useBarCodeDetectorIfSupported: true
                },
                videoConstraints: {
                    facingMode: "environment",
                    width: { min: 640, ideal: 1280 },
                    height: { min: 480, ideal: 720 }
                }
            };

            await scannerRef.current.start(
                { facingMode: 'environment' },
                config,
                (decodedText) => {
                    if (navigator.vibrate) navigator.vibrate(100);
                    onScanSuccess(decodedText);
                    stopScanner();
                },
                () => { /* Quiet */ }
            );

            setHasPermission(true);
            setIsScanning(true);
        } catch (err: any) {
            console.error('Html5Qrcode start failed:', err);
            if (err.toString().includes("permission") || err.toString().includes("NotAllowedError")) {
                setHasPermission(false);
                onScanError?.('Vui lòng cho phép quyền Camera.');
            }
            setIsScanning(false);
        } finally {
            setIsInitializing(false);
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                if (scannerRef.current.isScanning) {
                    await scannerRef.current.stop();
                }
            } catch (error) {
                console.warn('Stop scanner fail:', error);
            } finally {
                scannerRef.current = null;
                // Clean up DOM 
                const container = document.getElementById('barcode-reader');
                if (container) container.innerHTML = "";
            }
        }
    };

    return (
        <div className="scanner-container" style={{ width: '100%', position: 'relative' }}>
            <div
                id="barcode-reader"
                className={`scanner-viewport ${isScanning ? 'active' : ''}`}
                style={{
                    width: '100%',
                    minHeight: '320px',
                    background: '#000',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '4px solid var(--border-color)',
                    position: 'relative'
                }}
            />

            {isInitializing && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: 'white',
                    zIndex: 20,
                    textAlign: 'center'
                }}>
                    <div className="loading-spinner" style={{ width: '40px', height: '40px', margin: '0 auto 10px' }}></div>
                    <p>Khởi động Camera...</p>
                </div>
            )}

            {isScanning && !isInitializing && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '85%',
                    height: '160px',
                    border: '2px dashed var(--primary)',
                    borderRadius: '12px',
                    pointerEvents: 'none',
                    zIndex: 10,
                    boxShadow: '0 0 0 2000px rgba(0,0,0,0.5)'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '-40px',
                        width: '100%',
                        textAlign: 'center',
                        color: 'white',
                        fontWeight: '900',
                        fontSize: '1.2rem',
                        textShadow: '2px 2px 4px black'
                    }}>ĐƯA MÃ VÀO KHUNG</div>
                </div>
            )}

            {hasPermission === false && (
                <div className="error-card" style={{ marginTop: '1.5rem' }}>
                    <p>⚠️ Chưa cấp quyền Camera.</p>
                    <button className="btn-retry" onClick={() => window.location.reload()}>BẤM ĐỂ TẢI LẠI TRANG</button>
                </div>
            )}

            {(!isScanning && !isInitializing) && (
                <div className="scanner-controls" style={{ marginTop: '2rem' }}>
                    <button className="scan-button" onClick={() => setIsScanning(true)}>
                        🔄 BẬT LẠI CAMERA
                    </button>
                </div>
            )}
        </div>
    );
}
