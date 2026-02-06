import { NextRequest, NextResponse } from 'next/server';
import { findProductByBarcode, addProduct, updateProduct, Product } from '@/lib/googleSheets';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const barcode = searchParams.get('barcode');

    if (!barcode) {
        return NextResponse.json(
            { error: 'Barcode is required' },
            { status: 400 }
        );
    }

    try {
        const product = await findProductByBarcode(barcode);

        if (product) {
            return NextResponse.json({ found: true, product });
        } else {
            return NextResponse.json({ found: false, barcode });
        }
    } catch (error) {
        console.error('Error fetching product:', error);
        return NextResponse.json(
            { error: 'Failed to fetch product' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body: Product = await request.json();

        if (!body.barcode || !body.name || body.price === undefined) {
            return NextResponse.json(
                { error: 'Barcode, name, and price are required' },
                { status: 400 }
            );
        }

        await addProduct(body);

        return NextResponse.json({ success: true, product: body });
    } catch (error) {
        console.error('Error adding product:', error);
        return NextResponse.json(
            { error: 'Failed to add product' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body: Product = await request.json();

        if (!body.barcode || !body.name || body.price === undefined) {
            return NextResponse.json(
                { error: 'Barcode, name, and price are required' },
                { status: 400 }
            );
        }

        const success = await updateProduct(body);

        if (success) {
            return NextResponse.json({ success: true, product: body });
        } else {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }
    } catch (error) {
        console.error('Error updating product:', error);
        return NextResponse.json(
            { error: 'Failed to update product' },
            { status: 500 }
        );
    }
}
