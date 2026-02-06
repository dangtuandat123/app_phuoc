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
    const [lastResult, setLastResult] = useState<string | null>(null);
    const [count, setCount] = useState(0);

    // Constants for accuracy
    const REQUIRED_CONFIRMATIONS = 3; // Must read the same code 3 times to confirm

    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(console.error);
            }
        };
    }, []);

    const handleDecodedText = (decodedText: string) => {
        // If the scanner detects the same text as before
        if (decodedText === lastResult) {
            const newCount = count + 1;
            setCount(newCount);

            // If we've reached the threshold, finalize the scan
            if (newCount >= REQUIRED_CONFIRMATIONS) {
                onScanSuccess(decodedText);
                stopScanner();
                setCount(0);
                setLastResult(null);
            }
        } else {
            // Different code or first code detected, start/reset count
            setLastResult(decodedText);
            setCount(1);
        }
    };

    const startScanner = async () => {
        try {
            const html5QrCode = new Html5Qrcode('barcode-reader');
            scannerRef.current = html5QrCode;

            // Optimize for accuracy: 
            // 1. Limit formats if needed (keeping all for flexibility but common 1D optimized)
            // 2. Higher resolution
            // 3. Experimental features for 1D
            const config = {
                fps: 15, // 15 is a sweet spot for balance between speed and clarity
                qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
                    // For 1D barcodes, a wider but shorter box is better
                    const width = Math.min(viewfinderWidth * 0.8, 300);
                    const height = Math.min(viewfinderHeight * 0.4, 150);
                    return { width, height };
                },
                aspectRatio: 1.0,
                // Experimental: some features that might help with 1D barcodes
                experimentalFeatures: {
                    useBarCodeDetectorIfSupported: true,
                },
                videoConstraints: {
                    facingMode: 'environment',
                    width: { min: 640, ideal: 1280, max: 1920 },
                    height: { min: 480, ideal: 720, max: 1080 },
                }
            };

            await html5QrCode.start(
                { facingMode: 'environment' },
                config,
                handleDecodedText,
                (errorMessage) => {
                    // Quietly ignore scan errors
                }
            );

            setHasPermission(true);
            setIsScanning(true);
        } catch (error) {
            console.error('Error starting scanner:', error);
            setHasPermission(false);
            onScanError?.('Không thể truy cập camera. Vui lòng cấp quyền.');
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
        setCount(0);
        setLastResult(null);
    };

    return (
        <div className="scanner-container">
            <div
                id="barcode-reader"
                className={`scanner-viewport ${isScanning ? 'active' : ''}`}
            />

            {isScanning && (
                <div className="scan-status" style={{
                    marginTop: '0.5rem',
                    color: 'var(--primary)',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    height: '1.2rem'
                }}>
                    {count > 0 && lastResult && `Đang xác thực mã... (${count}/${REQUIRED_CONFIRMATIONS})`}
                </div>
            )}

            {hasPermission === false && (
                <div className="permission-error">
                    <p>⚠️ Lỗi truy cập Camera</p>
                </div>
            )}

            <div className="scanner-controls">
                {!isScanning ? (
                    <button className="scan-button" onClick={startScanner}>
                        📷 BẮT ĐẦU QUÉT
                    </button>
                ) : (
                    <button className="stop-button" onClick={stopScanner}>
                        ✕ DỪNG QUÉT
                    </button>
                )}
            </div>
        </div>
    );
}
