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
            onSubmit({
                barcode,
                name,
                price: parseFloat(price),
            });
        }
    };

    const isEditMode = !!initialData;

    return (
        <div className="product-form-overlay">
            <form className="product-form" onSubmit={handleSubmit}>
                <h2>{isEditMode ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}</h2>

                <div className="form-group">
                    <label htmlFor="barcode">Mã vạch</label>
                    <input
                        type="text"
                        id="barcode"
                        value={barcode}
                        readOnly
                        className="input-readonly"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="name">Tên sản phẩm</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nhập tên sản phẩm"
                        required
                        autoFocus
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="price">Giá (VNĐ)</label>
                    <input
                        type="number"
                        id="price"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="Nhập giá sản phẩm"
                        min="0"
                        step="1"
                        required
                    />
                </div>

                <div className="form-actions">
                    <button
                        type="button"
                        className="btn-cancel"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        className="btn-submit"
                        disabled={isLoading || !name || !price}
                    >
                        {isLoading ? 'Đang lưu...' : (isEditMode ? 'Lưu cập nhật' : 'Lưu sản phẩm')}
                    </button>
                </div>
            </form>
        </div>
    );
}
