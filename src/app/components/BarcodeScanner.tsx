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
    const [status, setStatus] = useState<'idle' | 'initializing' | 'running' | 'error' | 'denied'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    // Auto-start logic
    useEffect(() => {
        if (isScanning) {
            // Short delay to let the DOM stabilize
            const timer = setTimeout(startScanner, 400);
            return () => {
                clearTimeout(timer);
                stopScanner();
            };
        } else {
            stopScanner();
        }
    }, [isScanning]);

    const startScanner = async () => {
        if (scannerRef.current && scannerRef.current.isScanning) return;

        setStatus('initializing');
        setErrorMessage('');

        try {
            // 1. Ensure DOM is ready
            const readerElement = document.getElementById('barcode-reader');
            if (!readerElement) {
                throw new Error("Không tìm thấy vùng chứa Camera (DOM error)");
            }
            readerElement.innerHTML = ""; // Clean house

            // 2. Browser Check
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Trình duyệt không hỗ trợ Camera hoặc trang web không an toàn (cần HTTPS)");
            }

            // 3. Create Instance
            const html5QrCode = new Html5Qrcode('barcode-reader');
            scannerRef.current = html5QrCode;

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

            // 4. Start Camera
            await html5QrCode.start(
                { facingMode: 'environment' },
                config,
                (decodedText) => {
                    if (navigator.vibrate) navigator.vibrate(100);
                    onScanSuccess(decodedText);
                    stopScanner();
                },
                () => { } // Scanning in progress...
            );

            setStatus('running');
            setIsScanning(true);
        } catch (err: any) {
            console.error('Html5Qrcode start failed:', err);
            const msg = err.message || err.toString();
            setErrorMessage(msg);

            if (msg.includes("permission") || msg.includes("NotAllowedError")) {
                setStatus('denied');
            } else {
                setStatus('error');
            }

            setIsScanning(false);
            onScanError?.(msg);
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
                setStatus('idle');
                const node = document.getElementById('barcode-reader');
                if (node) node.innerHTML = "";
            }
        }
    };

    return (
        <div className="scanner-container" style={{ width: '100%', position: 'relative' }}>
            <div
                id="barcode-reader"
                style={{
                    width: '100%',
                    minHeight: '350px',
                    background: '#000',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: status === 'running' ? '4px solid #16a34a' : '4px solid #374151',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                {/* UI Feedback States */}
                {status === 'initializing' && (
                    <div style={{ color: 'white', textAlign: 'center', zIndex: 10 }}>
                        <div className="loading-spinner" style={{ width: '40px', height: '40px', margin: '0 auto 10px' }}></div>
                        <p style={{ fontWeight: 800 }}>ĐANG KHỞI TẠO CAMERA...</p>
                    </div>
                )}

                {(status === 'error' || status === 'denied') && (
                    <div style={{ color: 'white', textAlign: 'center', padding: '1rem', zIndex: 10, background: 'rgba(0,0,0,0.7)', width: '100%' }}>
                        <p style={{ color: '#ef4444', fontWeight: 900, fontSize: '1.2rem', marginBottom: '1rem' }}>
                            {status === 'denied' ? 'CHƯA CẤP QUYỀN CAMERA' : 'LỖI CAMERA'}
                        </p>
                        <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '1.5rem' }}>{errorMessage}</p>
                        <button
                            onClick={startScanner}
                            style={{ background: 'white', color: 'black', padding: '0.8rem 1.5rem', borderRadius: '8px', fontWeight: 'bold' }}
                        >
                            THỬ LẠI NGAY
                        </button>
                    </div>
                )}

                {status === 'idle' && !isScanning && (
                    <div style={{ color: 'white', textAlign: 'center', zIndex: 10 }}>
                        <button
                            onClick={() => setIsScanning(true)}
                            style={{ background: 'var(--primary)', color: 'white', padding: '1rem 2rem', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.2rem' }}
                        >
                            KÍCH HOẠT CAMERA
                        </button>
                    </div>
                )}
            </div>

            {status === 'running' && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '80%',
                    height: '180px',
                    border: '2px dashed #16a34a',
                    borderRadius: '12px',
                    pointerEvents: 'none',
                    zIndex: 5,
                    boxShadow: '0 0 0 2000px rgba(0,0,0,0.5)'
                }}>
                    <div style={{ width: '100%', textAlign: 'center', color: 'white', marginTop: '-40px', fontWeight: 800 }}>
                        ĐƯA MÃ VÀO GIỮA KHUNG
                    </div>
                </div>
            )}
        </div>
    );
}
