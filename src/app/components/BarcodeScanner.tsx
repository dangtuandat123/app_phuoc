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

    useEffect(() => {
        // Initial start if isScanning is true
        if (isScanning) {
            const timer = setTimeout(startScanner, 500);
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
        // Check if already running to avoid "Scanner already running" error
        if (scannerRef.current && scannerRef.current.isScanning) {
            return;
        }

        try {
            if (!scannerRef.current) {
                scannerRef.current = new Html5Qrcode('barcode-reader');
            }

            const config = {
                fps: 20,
                // Increased scan area for easier aiming
                qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
                    const width = viewfinderWidth * 0.9;
                    const height = Math.min(viewfinderHeight * 0.5, 250);
                    return { width, height };
                },
                aspectRatio: 1.0,
                // CRITICAL FOR ACCURACY: Enable specific 1D formats and experimental mode
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
                    useBarCodeDetectorIfSupported: true // Use Android Native Barcode API if available (ULTRA FAST)
                },
                videoConstraints: {
                    facingMode: "environment",
                    // Request higher resolution for better label reading
                    width: { min: 640, ideal: 1280 },
                    height: { min: 480, ideal: 720 }
                }
            };

            await scannerRef.current.start(
                { facingMode: 'environment' },
                config,
                (decodedText) => {
                    // Vibrate on success
                    if (navigator.vibrate) navigator.vibrate(100);

                    onScanSuccess(decodedText);
                    stopScanner();
                },
                () => {
                    // Quietly ignore scan attempts
                }
            );

            setHasPermission(true);
            setIsScanning(true);
        } catch (err: any) {
            console.error('Html5Qrcode error:', err);
            // If error is "permission denied" or others
            if (err.toString().includes("permission") || err.toString().includes("NotAllowedError")) {
                setHasPermission(false);
                onScanError?.('Cần quyền Camera để quét mã.');
            }
            setIsScanning(false);
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            try {
                await scannerRef.current.stop();
                // Don't null it, just stop it
            } catch (error) {
                console.warn('Stop scanner fail:', error);
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
                    minHeight: '300px',
                    background: '#000',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '4px solid var(--border-color)'
                }}
            />

            {isScanning && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '85%',
                    height: '150px',
                    border: '2px dashed var(--primary)',
                    borderRadius: '8px',
                    pointerEvents: 'none',
                    zIndex: 10,
                    boxShadow: '0 0 0 2000px rgba(0,0,0,0.4)'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '-30px',
                        width: '100%',
                        textAlign: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        textShadow: '1px 1px 2px black'
                    }}>ĐƯA MÃ VẠCH VÀO KHUNG</div>
                </div>
            )}

            {hasPermission === false && (
                <div className="error-card" style={{ marginTop: '1rem' }}>
                    <p>⚠️ Chặn Camera. Hãy kiểm tra cài đặt trình duyệt.</p>
                    <button className="btn-retry" onClick={() => window.location.reload()}>TẢI LẠI TRANG</button>
                </div>
            )}

            {!isScanning && (
                <div className="scanner-controls" style={{ marginTop: '1.5rem' }}>
                    <button className="scan-button" onClick={() => setIsScanning(true)}>
                        🔄 THỬ LẠI LẦN NỮA
                    </button>
                </div>
            )}
        </div>
    );
}
