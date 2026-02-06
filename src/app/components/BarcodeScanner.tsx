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
    const mountRef = useRef(false);

    // Helper to ensure DOM is clean
    const clearScannerNode = () => {
        const node = document.getElementById('barcode-reader');
        if (node) {
            node.innerHTML = '';
            // Also remove any attributes html5-qrcode might have added
            node.removeAttribute('style');
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                if (scannerRef.current.isScanning) {
                    await scannerRef.current.stop();
                }
            } catch (err) {
                console.warn('Error stopping scanner:', err);
            } finally {
                scannerRef.current = null;
                clearScannerNode();
            }
        }
    };

    const startScanner = async () => {
        if (isInitializing) return;

        // Safety: Stop any existing instance first
        await stopScanner();

        setIsInitializing(true);

        try {
            clearScannerNode();
            const html5QrCode = new Html5Qrcode('barcode-reader');
            scannerRef.current = html5QrCode;

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
                    width: { min: 640, ideal: 1280 }
                }
            };

            await html5QrCode.start(
                { facingMode: 'environment' },
                config,
                (decodedText) => {
                    if (navigator.vibrate) navigator.vibrate(100);
                    onScanSuccess(decodedText);
                    // Auto stop after success
                    setIsScanning(false);
                },
                () => { } // Quiet during scan
            );

            setHasPermission(true);
        } catch (err: any) {
            console.error('Scan start error:', err);
            if (err.toString().includes("NotAllowedError") || err.toString().includes("permission")) {
                setHasPermission(false);
            }
            setIsScanning(false);
        } finally {
            setIsInitializing(false);
        }
    };

    // Sync logic
    useEffect(() => {
        mountRef.current = true;

        if (isScanning) {
            // Use a timeout to avoid conflicts with React rendering cycle
            const timeoutId = setTimeout(() => {
                if (mountRef.current) startScanner();
            }, 300);
            return () => clearTimeout(timeoutId);
        } else {
            stopScanner();
        }

        return () => {
            mountRef.current = false;
            stopScanner();
        };
    }, [isScanning]);

    return (
        <div className="scanner-container" style={{ width: '100%', position: 'relative' }}>
            <div
                id="barcode-reader"
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
                    inset: 0,
                    background: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    zIndex: 20,
                    borderRadius: '12px'
                }}>
                    <div className="loading-spinner" style={{ width: '40px', height: '40px', margin: '0 auto 10px' }}></div>
                    <p>Đang bật camera...</p>
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
                    border: '3px dashed var(--primary)',
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
                        fontSize: '1.3rem',
                        textShadow: '2px 2px 4px black'
                    }}>ĐƯA MÃ VÀO GIỮA KHUNG</div>
                </div>
            )}

            {hasPermission === false && (
                <div className="error-card" style={{ marginTop: '1.5rem' }}>
                    <p>⚠️ Không thể mở Camera. Vui lòng cấp quyền trong cài đặt.</p>
                    <button className="btn-retry" onClick={() => window.location.reload()}>TẢI LẠI TRANG</button>
                </div>
            )}
        </div>
    );
}
