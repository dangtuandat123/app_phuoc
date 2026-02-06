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

    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(console.error);
            }
        };
    }, []);

    const startScanner = async () => {
        try {
            const html5QrCode = new Html5Qrcode('barcode-reader');
            scannerRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: 'environment' }, // Use back camera
                {
                    fps: 10,
                    qrbox: { width: 250, height: 150 },
                    aspectRatio: 1.5,
                },
                (decodedText) => {
                    // On successful scan
                    onScanSuccess(decodedText);
                    stopScanner();
                },
                (errorMessage) => {
                    // Ignore scan errors (no QR found)
                }
            );

            setHasPermission(true);
            setIsScanning(true);
        } catch (error) {
            console.error('Error starting scanner:', error);
            setHasPermission(false);
            onScanError?.('Không thể truy cập camera. Vui lòng cấp quyền camera.');
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current = null;
            } catch (error) {
                console.error('Error stopping scanner:', error);
            }
        }
        setIsScanning(false);
    };

    return (
        <div className="scanner-container">
            <div
                id="barcode-reader"
                className={`scanner-viewport ${isScanning ? 'active' : ''}`}
            />

            {hasPermission === false && (
                <div className="permission-error">
                    <p>⚠️ Không thể truy cập camera</p>
                    <p>Vui lòng cấp quyền camera trong cài đặt trình duyệt</p>
                </div>
            )}

            <div className="scanner-controls">
                {!isScanning ? (
                    <button className="scan-button" onClick={startScanner}>
                        <span className="scan-icon">📷</span>
                        Quét mã vạch
                    </button>
                ) : (
                    <button className="stop-button" onClick={stopScanner}>
                        <span className="stop-icon">✕</span>
                        Dừng quét
                    </button>
                )}
            </div>
        </div>
    );
}
