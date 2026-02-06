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
    const [permissionError, setPermissionError] = useState<string>('');

    // Effect to handle start/stop based on isScanning prop
    useEffect(() => {
        let mounted = true;

        const manageScanner = async () => {
            // If we should be scanning but scanner isn't running
            if (isScanning && !scannerRef.current) {
                try {
                    await startScanner();
                } catch (e) {
                    console.error("Failed to start scanner automatically", e);
                }
            }
            // If we should NOT be scanning but scanner IS running
            else if (!isScanning && scannerRef.current) {
                await stopScanner();
            }
        };

        manageScanner();

        // Cleanup on unmount
        return () => {
            mounted = false;
            if (scannerRef.current) {
                // We can't await in cleanup, but we can call stop
                scannerRef.current.stop().catch(err => console.warn("Error stopping scanner on unmount", err));
                scannerRef.current = null;
            }
        };
    }, [isScanning]); // Re-run when isScanning changes

    const startScanner = async () => {
        // Prevent multiple initializations
        if (scannerRef.current) return;

        try {
            const html5QrCode = new Html5Qrcode('barcode-reader');
            scannerRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: 'environment' }, // Use back camera
                {
                    fps: 10,
                    qrbox: { width: 250, height: 150 },
                    aspectRatio: 1.0,
                },
                (decodedText) => {
                    // On successful scan
                    if (isScanning) { // Check valid state
                        onScanSuccess(decodedText);
                        // Don't stop here, let the parent control state (which will trigger effect to stop)
                    }
                },
                (errorMessage) => {
                    // Verify error type
                    if (errorMessage?.includes("NotAllowedError")) {
                        setHasPermission(false);
                        setPermissionError(errorMessage);
                    }
                }
            );

            setHasPermission(true);
            // We don't call setIsScanning(true) here because it's passed as prop
        } catch (error: any) {
            console.error('Error starting scanner:', error);
            setHasPermission(false);
            setPermissionError(error?.message || 'Không thể truy cập camera');
            onScanError?.(error?.message || 'Lỗi Camera');
            // If failed, tell parent
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
                console.error('Error stopping scanner:', error);
            }
        }
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
                    <p>{permissionError || 'Vui lòng cấp quyền camera trong cài đặt trình duyệt'}</p>
                </div>
            )}

            {/* Manual Controls Backup (Hidden if auto-scanning works well, but good for debug) */}
            <div className="scanner-controls">
                {!isScanning && (
                    <button className="scan-button" onClick={() => setIsScanning(true)}>
                        Kích hoạt Camera
                    </button>
                )}
            </div>
        </div>
    );
}
