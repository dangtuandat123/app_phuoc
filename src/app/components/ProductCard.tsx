'use client';

interface Product {
    barcode: string;
    name: string;
    price: number;
}

interface ProductCardProps {
    product: Product;
    onClose: () => void;
}

export default function ProductCard({ product, onClose }: ProductCardProps) {
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
                <h2 className="product-name">{product.name}</h2>
                <p className="product-barcode">Mã: {product.barcode}</p>
                <div className="product-price">{formatPrice(product.price)}</div>
            </div>

            <div className="product-card-footer">
                <button className="btn-scan-again" onClick={onClose}>
                    Quét tiếp
                </button>
            </div>
        </div>
    );
}
