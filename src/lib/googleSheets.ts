import { google } from 'googleapis';

const getGoogleSheetsClient = async () => {
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    return sheets;
};

export interface Product {
    barcode: string;
    name: string;
    price: number;
}

export async function findProductByBarcode(barcode: string): Promise<Product | null> {
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    const sheetName = process.env.GOOGLE_SHEET_NAME || 'Sheet1';

    try {
        console.log(`Searching for barcode: ${barcode} in sheet: ${sheetName}`);

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${sheetName}!A:C`, // barcode, name, price
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            console.log('No rows found in sheet');
            return null;
        }

        const targetBarcode = barcode.trim();

        // Scan ALL rows (starting from i=0) to handle sheets without headers
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];

            // Safety check: ensure row has data
            if (!row || !row[0]) continue;

            // Robust comparison: convert to string and trim
            const rowBarcode = row[0].toString().trim();

            if (rowBarcode === targetBarcode) {
                // Handle text price like "58.000.000" or "58,000,000" or "$100"
                const priceString = row[2] ? row[2].toString() : '0';
                // Remove non-numeric characters except dot and comma (handled by parseFloat somewhat, but cleaning helps)
                // Actually parseFloat stops at non-numeric. 
                // Better to just try parseFloat directly first.
                // Assuming simple number for now as per user screenshot.
                let price = parseFloat(priceString);

                if (isNaN(price)) {
                    // Try to clean formatting if NaN
                    const cleanPrice = priceString.replace(/[^0-9.-]+/g, '');
                    price = parseFloat(cleanPrice) || 0;
                }

                console.log(`Found product at row ${i + 1}:`, row);
                return {
                    barcode: rowBarcode,
                    name: row[1] ? row[1].toString() : '',
                    price: price,
                };
            }
        }

        console.log('Product not found in any row');
        return null;
    } catch (error) {
        console.error('Error finding product:', error);
        throw error;
    }
}

export async function addProduct(product: Product): Promise<boolean> {
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    const sheetName = process.env.GOOGLE_SHEET_NAME || 'Sheet1';

    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `${sheetName}!A:C`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                // Prepend ' to ensure Google Sheets treats barcode as string (preserving leading zeros)
                values: [[`'${product.barcode}`, product.name, product.price]],
            },
        });

        return true;
    } catch (error) {
        console.error('Error adding product:', error);
        throw error;
    }
}

export async function updateProduct(product: Product): Promise<boolean> {
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    const sheetName = process.env.GOOGLE_SHEET_NAME || 'Sheet1';

    try {
        // 1. Find the row index first
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${sheetName}!A:C`,
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return false; // Not found
        }

        const targetBarcode = product.barcode.trim();
        let rowIndex = -1;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (row && row[0] && row[0].toString().trim() === targetBarcode) {
                rowIndex = i + 1; // 1-based index
                break;
            }
        }

        if (rowIndex === -1) {
            return false; // Product not found
        }

        // 2. Update the row
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${sheetName}!B${rowIndex}:C${rowIndex}`, // Update Name (Col B) and Price (Col C)
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[product.name, product.price]],
            },
        });

        return true;
    } catch (error) {
        console.error('Error updating product:', error);
        throw error;
    }
}
