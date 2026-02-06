'use client';

import { useState, useEffect } from 'react';

interface ProductFormProps {
    barcode: string;
    initialData?: { name: string; price: number }; // Optional initial data for edit mode
    onSubmit: (product: { barcode: string; name: string; price: number }) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export default function ProductForm({
    barcode,
    initialData,
    onSubmit,
    onCancel,
    isLoading = false,
}: ProductFormProps) {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');

    // Setup initial data if editing
    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setPrice(initialData.price.toString());
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && price) {
            const finalPrice = Math.floor(parseFloat(price)); // Ensure integer
            onSubmit({
                barcode,
                name,
                price: finalPrice,
            });
        }
    };

    const isEditMode = !!initialData;

    return (
        <div className="product-form-overlay">
            <form className="product-form" onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
                <h2>{isEditMode ? 'CẬP NHẬT THÔNG TIN' : 'THÊM SẢN PHẨM MỚI'}</h2>

                <div className="form-group">
                    <label htmlFor="barcode">Mã vạch</label>
                    <input
                        type="text"
                        id="barcode"
                        value={barcode}
                        readOnly
                        className="input-readonly"
                        style={{ fontSize: '1.5rem', fontWeight: 'bold' }}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="name">Tên sản phẩm</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ví dụ: Nước ngọt Coca"
                        required
                        autoFocus
                        style={{ fontSize: '1.25rem' }}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="price">Giá bán (VNĐ)</label>
                    <input
                        type="number"
                        id="price"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="Nhập giá tiền"
                        min="0"
                        step="1"
                        required
                        style={{ fontSize: '1.5rem', fontWeight: 'bold' }}
                    />
                </div>

                <div className="form-actions">
                    <button
                        type="submit"
                        className="btn-submit"
                        disabled={isLoading || !name || !price}
                        style={{ height: '60px', fontSize: '1.4rem' }}
                    >
                        {isLoading ? 'ĐANG LƯU...' : 'XÁC NHẬN LƯU'}
                    </button>

                    <button
                        type="button"
                        className="btn-cancel"
                        onClick={onCancel}
                        disabled={isLoading}
                        style={{ height: '50px' }}
                    >
                        HỦY
                    </button>
                </div>
            </form>
        </div>
    );
}
