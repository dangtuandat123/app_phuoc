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
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        // START SCANNER ON MOUNT
        const timer = setTimeout(() => {
            startScanner();
        }, 500);

        return () => {
            clearTimeout(timer);
            stopScanner();
        };
    }, []);

    const startScanner = async () => {
        try {
            // Clear DOM just in case
            const node = document.getElementById('barcode-reader');
            if (node) node.innerHTML = '';

            const scanner = new Html5Qrcode('barcode-reader');
            scannerRef.current = scanner;

            const config = {
                fps: 20,
                qrbox: { width: 300, height: 200 },
                aspectRatio: 1.0,
                formatsToSupport: [
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.CODE_39,
                    Html5QrcodeSupportedFormats.UPC_A,
                    Html5QrcodeSupportedFormats.UPC_E,
                    Html5QrcodeSupportedFormats.ITF
                ]
            };

            await scanner.start(
                { facingMode: 'environment' },
                config,
                (decodedText) => {
                    if (navigator.vibrate) navigator.vibrate(100);
                    onScanSuccess(decodedText);
                    stopScanner();
                },
                () => { } // Quiet
            );

            setHasPermission(true);
            setIsScanning(true);
        } catch (err: any) {
            console.error('Scanner start error:', err);
            setErrorMsg(err.toString());
            if (err.toString().includes("permission") || err.toString().includes("NotAllowedError")) {
                setHasPermission(false);
            }
            setIsScanning(false);
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            if (scannerRef.current.isScanning) {
                try {
                    await scannerRef.current.stop();
                } catch (e) {
                    console.warn("Stop scanner error", e);
                }
            }
            scannerRef.current = null;
        }
    };

    return (
        <div className="scanner-container" style={{ width: '100%' }}>
            {/* THE CAMERA DIV - MUST BE PRE-SIZED */}
            <div
                id="barcode-reader"
                style={{
                    width: '100%',
                    height: '350px',
                    background: '#1a1a1a',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '3px solid var(--primary)',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                {/* Placeholder text visible while loading */}
                {hasPermission === null && !errorMsg && (
                    <div style={{ color: 'white', textAlign: 'center' }}>
                        <div className="loading-spinner" style={{ width: '30px', height: '30px', margin: '0 auto 10px' }}></div>
                        <p style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>ĐANG MỞ CAMERA...</p>
                    </div>
                )}
            </div>

            {hasPermission === false && (
                <div className="error-card" style={{ marginTop: '1rem', background: '#fee2e2', border: '1px solid #ef4444' }}>
                    <p style={{ color: '#dc2626', fontWeight: 'bold' }}>⚠️ LỖI QUYỀN TRUY CẬP</p>
                    <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>Vui lòng cấp quyền camera cho trang web này.</p>
                    <button className="btn-retry" onClick={() => window.location.reload()} style={{ marginTop: '1rem' }}>TẢI LẠI TRANG</button>
                </div>
            )}

            {errorMsg && !hasPermission && (
                <div style={{ fontSize: '0.8rem', color: 'gray', marginTop: '0.5rem', textAlign: 'center' }}>
                    Debug: {errorMsg.substring(0, 50)}...
                </div>
            )}
        </div>
    );
}
