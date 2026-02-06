'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library';

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
    const videoRef = useRef<HTMLVideoElement>(null);
    const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);

    useEffect(() => {
        // Initialize ZXing Reader
        const hints = new Map();
        const formats = [
            BarcodeFormat.EAN_13,
            BarcodeFormat.EAN_8,
            BarcodeFormat.CODE_128,
            BarcodeFormat.CODE_39,
            BarcodeFormat.UPC_A,
            BarcodeFormat.UPC_E,
            BarcodeFormat.ITF
        ];
        hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
        hints.set(DecodeHintType.TRY_HARDER, true); // Enable Try Harder for better accuracy

        codeReaderRef.current = new BrowserMultiFormatReader(hints);

        // Auto-start if isScanning is true
        if (isScanning) {
            startScanning();
        }

        return () => {
            stopScanning();
        };
    }, []);

    // Watch for changes in isScanning prop to toggle camera
    useEffect(() => {
        if (isScanning) {
            startScanning();
        } else {
            stopScanning();
        }
    }, [isScanning]);

    const startScanning = async () => {
        if (!codeReaderRef.current || !videoRef.current) return;

        try {
            setHasPermission(null);

            // Get all video devices
            const videoInputDevices = await codeReaderRef.current.listVideoInputDevices();
            if (videoInputDevices.length === 0) {
                throw new Error('Không tìm thấy camera');
            }

            // Standard logic: try to find back camera
            const backCamera = videoInputDevices.find(device =>
                device.label.toLowerCase().includes('back') ||
                device.label.toLowerCase().includes('rear') ||
                device.label.toLowerCase().includes('0') // Sometimes first is back
            ) || videoInputDevices[0];

            await codeReaderRef.current.decodeFromVideoDevice(
                backCamera.deviceId,
                videoRef.current,
                (result, error) => {
                    if (result) {
                        const barcode = result.getText();
                        console.log('Barcode detected:', barcode);
                        onScanSuccess(barcode);
                        // Parent will set isScanning to false, triggering stopScanning via useEffect
                    }
                    if (error && !(error.name === 'NotFoundException')) {
                        // Ignore NotFoundException as it happens every frame no barcode is found
                        console.warn('Scan error:', error);
                    }
                }
            );

            setHasPermission(true);
            setIsScanning(true);
        } catch (err: any) {
            console.error('Start scan error:', err);
            setHasPermission(false);
            onScanError?.('Không thể bật camera. Hãy kiểm tra quyền truy cập.');
            setIsScanning(false);
        }
    };

    const stopScanning = () => {
        if (codeReaderRef.current) {
            codeReaderRef.current.reset();
        }
    };

    return (
        <div className="scanner-container" style={{ width: '100%', position: 'relative' }}>
            <div className="scanner-viewport" style={{
                width: '100%',
                aspectRatio: '4/3',
                background: '#000',
                borderRadius: '16px',
                overflow: 'hidden',
                position: 'relative'
            }}>
                <video
                    ref={videoRef}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

                {/* Visual Overlay */}
                {isScanning && (
                    <div className="scanner-overlay" style={{
                        position: 'absolute',
                        inset: 0,
                        border: '2px solid rgba(255,255,255,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <div style={{
                            width: '80%',
                            height: '40%',
                            border: '2px solid var(--primary)',
                            borderRadius: '8px',
                            boxShadow: '0 0 0 1000px rgba(0,0,0,0.5)',
                            position: 'relative'
                        }}>
                            {/* Animated Scan Line */}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '2px',
                                background: 'var(--primary)',
                                animation: 'scan-anim 2s infinite linear'
                            }} />
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
        @keyframes scan-anim {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>

            {hasPermission === false && (
                <div className="permission-error" style={{ marginTop: '1rem', color: 'var(--danger)', textAlign: 'center' }}>
                    <p>⚠️ Cần quyền truy cập Camera để quét mã.</p>
                    <button
                        onClick={startScanning}
                        className="btn-retry"
                        style={{ marginTop: '0.5rem', padding: '0.5rem 1rem' }}
                    >
                        Thử lại
                    </button>
                </div>
            )}
        </div>
    );
}
