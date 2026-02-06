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
        // Initialize ZXing Reader with specific 1D formats for better accuracy
        const hints = new Map();
        const formats = [
            BarcodeFormat.EAN_13,
            BarcodeFormat.EAN_8,
            BarcodeFormat.CODE_128,
            BarcodeFormat.CODE_39,
            BarcodeFormat.UPC_A,
            BarcodeFormat.UPC_E,
            BarcodeFormat.ITF,
            BarcodeFormat.RSS_14,
            BarcodeFormat.CODE_93
        ];
        hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
        hints.set(DecodeHintType.TRY_HARDER, true);
        hints.set(DecodeHintType.ASSUME_GS1, true);

        codeReaderRef.current = new BrowserMultiFormatReader(hints);

        if (isScanning) {
            // Use a small delay to ensure DOM is ready and interaction loop is favorable
            const timer = setTimeout(startScanning, 500);
            return () => {
                clearTimeout(timer);
                stopScanning();
            }
        }

        return () => stopScanning();
    }, []);

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
            const videoInputDevices = await codeReaderRef.current.listVideoInputDevices();
            if (videoInputDevices.length === 0) {
                throw new Error('Không tìm thấy camera');
            }

            // Find back camera
            const backCamera = videoInputDevices.find(device =>
                /back|rear|sau|environment/i.test(device.label)
            ) || videoInputDevices[videoInputDevices.length - 1]; // Usually last one is back

            await codeReaderRef.current.decodeFromVideoDevice(
                backCamera.deviceId,
                videoRef.current,
                (result, error) => {
                    if (result && isScanning) {
                        const barcode = result.getText();
                        onScanSuccess(barcode);
                    }
                }
            );

            setHasPermission(true);
            setIsScanning(true);
        } catch (err: any) {
            console.error('Start scan error:', err);
            setHasPermission(false);
            onScanError?.('Lỗi camera: ' + err.message);
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
                position: 'relative',
                border: '4px solid var(--border-color)'
            }}>
                <video
                    ref={videoRef}
                    playsInline // CRITICAL FOR MOBILE
                    muted       // CRITICAL FOR AUTO-PLAY
                    autoPlay    // CRITICAL FOR AUTO-START
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

                {isScanning && (
                    <div className="scanner-overlay" style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none'
                    }}>
                        <div style={{
                            width: '70%',
                            height: '2px',
                            background: 'var(--danger)',
                            boxShadow: '0 0 10px var(--danger)',
                            animation: 'scan-anim 2s infinite ease-in-out'
                        }} />
                        <div style={{
                            position: 'absolute',
                            width: '80%',
                            height: '50%',
                            border: '2px solid white',
                            borderRadius: '12px',
                            boxShadow: '0 0 0 1000px rgba(0,0,0,0.5)'
                        }} />
                    </div>
                )}
            </div>

            <style jsx>{`
        @keyframes scan-anim {
          0%, 100% { transform: translateY(-80px); opacity: 0.5; }
          50% { transform: translateY(80px); opacity: 1; }
        }
      `}</style>

            {hasPermission === false && (
                <div className="permission-error" style={{ padding: '1rem', background: '#fee2e2', borderRadius: '8px', marginTop: '1rem' }}>
                    <p style={{ color: '#dc2626', fontWeight: 'bold' }}>⚠️ Không mở được Camera</p>
                    <button
                        onClick={startScanning}
                        className="btn-retry"
                        style={{ marginTop: '1rem', width: '100%' }}
                    >
                        THỬ LẠI
                    </button>
                </div>
            )}
        </div>
    );
}
