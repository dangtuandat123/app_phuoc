'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

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

    // Core effect: Watch for isScanning changes to start/stop the camera automatically
    useEffect(() => {
        if (isScanning && !scannerRef.current) {
            // Delay a bit to ensure the DOM element #barcode-reader is ready
            const timeoutId = setTimeout(startScanner, 300);
            return () => clearTimeout(timeoutId);
        } else if (!isScanning && scannerRef.current) {
            stopScanner();
        }
    }, [isScanning]);

    const startScanner = async () => {
        // If scanner is already active, don't re-initialize
        if (scannerRef.current) return;

        try {
            const html5QrCode = new Html5Qrcode('barcode-reader');
            scannerRef.current = html5QrCode;

            const config = {
                fps: 20,
                // Simplified qrbox for better compatibility across devices
                qrbox: { width: 300, height: 200 },
                aspectRatio: 1.0,
            };

            await html5QrCode.start(
                { facingMode: 'environment' },
                config,
                (decodedText) => {
                    // Success: Report to parent and stop
                    onScanSuccess(decodedText);
                    stopScanner();
                },
                (errorMessage) => {
                    // Debug scan attempts if needed, but keep UI quiet
                }
            );

            setHasPermission(true);
            setIsScanning(true);
        } catch (error: any) {
            console.error('Error starting scanner:', error);
            setHasPermission(false);
            onScanError?.('Không thể truy cập Camera. Vui lòng cấp quyền.');
            setIsScanning(false);
            scannerRef.current = null;
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current = null;
            } catch (error) {
                console.warn('Error stopping scanner:', error);
            }
        }
        setIsScanning(false);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(() => { });
            }
        };
    }, []);

    return (
        <div className="scanner-container">
            <div
                id="barcode-reader"
                className={`scanner-viewport ${isScanning ? 'active' : ''}`}
            />

            {hasPermission === false && (
                <div className="permission-error">
                    <p>⚠️ Lỗi truy cập Camera</p>
                    <button className="btn-retry" onClick={startScanner} style={{ marginTop: '1rem' }}>
                        Thử lại
                    </button>
                </div>
            )}

            {/* Manual Start Button ONLY if auto-start failed or stopped */}
            {!isScanning && (
                <div className="scanner-controls">
                    <button className="scan-button" onClick={() => setIsScanning(true)}>
                        📷 BẬT CAMERA QUÉT
                    </button>
                </div>
            )}
        </div>
    );
}
