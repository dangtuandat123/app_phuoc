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

    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Sheet1!A:C', // barcode, name, price
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return null;
        }

        // Skip header row, find matching barcode
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row[0] === barcode) {
                return {
                    barcode: row[0],
                    name: row[1],
                    price: parseFloat(row[2]) || 0,
                };
            }
        }

        return null;
    } catch (error) {
        console.error('Error finding product:', error);
        throw error;
    }
}

export async function addProduct(product: Product): Promise<boolean> {
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Sheet1!A:C',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[product.barcode, product.name, product.price]],
            },
        });

        return true;
    } catch (error) {
        console.error('Error adding product:', error);
        throw error;
    }
}
