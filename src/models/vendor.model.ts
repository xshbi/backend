export enum VendorStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    PENDING = 'PENDING',
    SUSPENDED = 'SUSPENDED',
}

export enum VendorType {
    SUPPLIER = 'SUPPLIER',
    SERVICE_PROVIDER = 'SERVICE_PROVIDER',
    MANUFACTURER = 'MANUFACTURER',
    DISTRIBUTOR = 'DISTRIBUTOR',
    CONTRACTOR = 'CONTRACTOR',
}

export enum PaymentTerms {
    NET_15 = 'NET_15',
    NET_30 = 'NET_30',
    NET_45 = 'NET_45',
    NET_60 = 'NET_60',
    NET_90 = 'NET_90',
    DUE_ON_RECEIPT = 'DUE_ON_RECEIPT',
    ADVANCE_PAYMENT = 'ADVANCE_PAYMENT',
}

export interface Address {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}

export interface ContactPerson {
    id?: string;
    name: string;
    email: string;
    phone: string;
    designation?: string;
    isPrimary: boolean;
}

export interface BankDetails {
    accountName: string;
    accountNumber: string;
    bankName: string;
    ifscCode?: string;
    swiftCode?: string;
    routingNumber?: string;
}

export interface TaxInformation {
    taxId?: string;
    gstNumber?: string;
    panNumber?: string;
    vatNumber?: string;
}

export interface Vendor {
    id: number;
    user_id: number;
    vendorCode: string; // SKU-like code for vendor
    name: string; // Display name
    legalName?: string;
    type: VendorType;
    status: VendorStatus;

    // Contact Information
    email: string; // Business email
    phone: string;
    website?: string;

    // Address Information (Stored as JSONB)
    billingAddress: Address;
    shippingAddress?: Address;

    // Contact Persons (Stored as JSONB)
    contactPersons: ContactPerson[];

    // Financial Information
    paymentTerms: PaymentTerms;
    creditLimit?: number;
    currency: string;
    bankDetails?: BankDetails; // JSONB

    // Tax Information
    taxInformation?: TaxInformation; // JSONB

    // Business Details
    businessRegistrationNumber?: string;
    incorporationDate?: Date;
    industry?: string;

    // Performance
    rating?: number;

    // Meta
    notes?: string;
    tags?: string[];

    createdAt: Date;
    updatedAt: Date;
}

// SQL Implementation
import { sql } from '../db/schema';

export const createVendorsTable = async () => {
    await sql`
        CREATE TABLE IF NOT EXISTS vendors (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            vendor_code VARCHAR(50) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            legal_name VARCHAR(255),
            type VARCHAR(50) NOT NULL,
            status VARCHAR(50) DEFAULT 'ACTIVE',
            email VARCHAR(255),
            phone VARCHAR(50),
            website VARCHAR(255),
            billing_address JSONB NOT NULL,
            shipping_address JSONB,
            contact_persons JSONB DEFAULT '[]',
            payment_terms VARCHAR(50) DEFAULT 'NET_30',
            credit_limit DECIMAL(12, 2),
            currency VARCHAR(10) DEFAULT 'USD',
            bank_details JSONB,
            tax_information JSONB,
            business_registration_number VARCHAR(100),
            incorporation_date TIMESTAMP,
            industry VARCHAR(100),
            rating DECIMAL(3, 2) DEFAULT 0,
            notes TEXT,
            tags TEXT[],
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(user_id)
        )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status)`;
};

export class VendorModel {
    static async create(vendorData: Partial<Vendor>): Promise<Vendor> {
        // Map camelCase to snake_case for DB
        // Using explicit mapping or SQL helper if keys match. 
        // Since strict typing is good, let's map it manually or assume the input object is prepared.
        // But for safety within model, let's map key fields suitable for the table structure above.

        const {
            user_id, vendorCode, name, legalName, type, status,
            email, phone, website,
            billingAddress, shippingAddress, contactPersons,
            paymentTerms, creditLimit, currency, bankDetails,
            taxInformation, businessRegistrationNumber, incorporationDate, industry,
            notes, tags
        } = vendorData;

        const [vendor] = await sql`
            INSERT INTO vendors (
                user_id, vendor_code, name, legal_name, type, status,
                email, phone, website,
                billing_address, shipping_address, contact_persons,
                payment_terms, credit_limit, currency, bank_details,
                tax_information, business_registration_number, incorporation_date, industry,
                notes, tags
            ) VALUES (
                ${user_id}, ${vendorCode}, ${name}, ${legalName || null}, ${type}, ${status || 'ACTIVE'},
                ${email}, ${phone}, ${website || null},
                ${sql.json(billingAddress)}, ${shippingAddress ? sql.json(shippingAddress) : null}, ${contactPersons ? sql.json(contactPersons) : sql.json([])},
                ${paymentTerms}, ${creditLimit || null}, ${currency || 'USD'}, ${bankDetails ? sql.json(bankDetails) : null},
                ${taxInformation ? sql.json(taxInformation) : null}, ${businessRegistrationNumber || null}, ${incorporationDate || null}, ${industry || null},
                ${notes || null}, ${tags || null}
            )
            RETURNING *
        `;

        return vendor as unknown as Vendor;
    }

    static async delete(id: number): Promise<boolean> {
        // If we delete a vendor, we might want to delete the user too?
        // Or just the vendor profile?
        // If ON DELETE CASCADE is set on vendors(user_id), deleting user deletes vendor.
        // Here we delete vendor profile.
        const result = await sql`DELETE FROM vendors WHERE id = ${id}`;
        return result.count > 0;
    }

    static async deleteByUserId(userId: number): Promise<boolean> {
        const result = await sql`DELETE FROM vendors WHERE user_id = ${userId}`;
        return result.count > 0;
    }

    static async findAll() {
        return await sql`SELECT * FROM vendors ORDER BY name ASC`;
    }

    static async findById(id: number) {
        const [vendor] = await sql`SELECT * FROM vendors WHERE id = ${id}`;
        return vendor;
    }

    static async findByUserId(userId: number) {
        const [vendor] = await sql`SELECT * FROM vendors WHERE user_id = ${userId}`;
        return vendor;
    }
}
