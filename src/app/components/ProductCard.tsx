'use client';

interface Product {
    barcode: string;
    name: string;
    price: number;
}

interface ProductCardProps {
    product: Product;
    onClose: () => void;
    onEdit: () => void; // New prop
}

export default function ProductCard({ product, onClose, onEdit }: ProductCardProps) {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    return (
        <div className="product-card">
            <div className="product-card-header">
                <span className="success-badge">✓ Tìm thấy</span>
                <button className="close-button" onClick={onClose}>
                    ✕
                </button>
            </div>

            <div className="product-card-body">
                <div className="barcode-display">
                    <span className="label">Mã Barcode:</span>
                    <span className="value">{product.barcode}</span>
                </div>

                <h2 className="product-name">{product.name}</h2>

                <div className="price-display">
                    <span className="label">Giá bán:</span>
                    <div className="product-price">{formatPrice(product.price)}</div>
                </div>
            </div>

            <div className="product-card-footer">
                <button className="btn-edit" onClick={onEdit}>
                    ✎ Sửa thông tin
                </button>
                <button className="btn-scan-again" onClick={onClose}>
                    Quét tiếp
                </button>
            </div>

            <style jsx>{`
        .barcode-display {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
            color: var(--text-muted);
            font-family: monospace;
            background: rgba(255, 255, 255, 0.05);
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            width: fit-content;
            margin: 0 auto 1rem;
        }
        .price-display {
            margin-top: 1rem;
        }
        .price-display .label {
            display: block;
            font-size: 0.9rem;
            color: var(--text-secondary);
            margin-bottom: 0.25rem;
        }
        .product-card-footer {
            flex-direction: column; 
            gap: 1rem;
        }
        .btn-edit {
            background: var(--bg-secondary);
            color: var(--text-secondary);
            border: 1px solid var(--border-color);
            width: 100%;
            padding: 0.8rem;
            border-radius: var(--radius-xl);
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s;
        }
        .btn-edit:hover {
            background: var(--bg-glass);
            color: var(--text-primary);
            border-color: var(--primary);
        }
        .btn-scan-again {
            width: 100%;
        }
      `}</style>
        </div>
    );
}
