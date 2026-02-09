import { sql } from '../db/schema';

/**
 * Address Model
 * Defines the structure and validation for address data
 */

export interface Address {
    id?: number; // Changed to number to match Serial ID
    userId?: number;
    fullName: string;
    phone: string;
    street: string;
    streetNumber?: string;
    apartment?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    latitude?: number;
    longitude?: number;
    isDefault?: boolean;
    label?: 'home' | 'work' | 'other';
    createdAt?: Date;
    updatedAt?: Date;
}

export interface AddressFormData {
    fullName: string;
    phone: string;
    street: string;
    streetNumber?: string;
    apartment?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    label?: 'home' | 'work' | 'other';
    isDefault?: boolean;
}

export class AddressModel implements Address {
    id?: number;
    userId?: number;
    fullName: string;
    phone: string;
    street: string;
    streetNumber?: string;
    apartment?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    latitude?: number;
    longitude?: number;
    isDefault?: boolean;
    label?: 'home' | 'work' | 'other';
    createdAt?: Date;
    updatedAt?: Date;

    constructor(data: Address) {
        this.id = data.id;
        this.userId = data.userId;
        this.fullName = data.fullName;
        this.phone = data.phone;
        this.street = data.street;
        this.streetNumber = data.streetNumber;
        this.apartment = data.apartment;
        this.city = data.city;
        this.state = data.state;
        this.postalCode = data.postalCode;
        this.country = data.country;
        this.latitude = data.latitude;
        this.longitude = data.longitude;
        this.isDefault = data.isDefault || false;
        this.label = data.label || 'home';
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
    }

    // --- DB Operations ---

    static async create(userId: number, data: AddressFormData): Promise<AddressModel> {
        const addressLine1 = [data.streetNumber, data.street].filter(Boolean).join(' ');
        const addressLine2 = data.apartment || null;

        // If set as default, unset other defaults for this user
        if (data.isDefault) {
            await sql`
        UPDATE addresses SET is_default = FALSE WHERE user_id = ${userId}
      `;
        }

        const [row] = await sql`
      INSERT INTO addresses (
        user_id, full_name, phone, address_line1, address_line2, 
        city, state, postal_code, country, type, is_default
      )
      VALUES (
        ${userId}, ${data.fullName}, ${data.phone}, ${addressLine1}, ${addressLine2},
        ${data.city}, ${data.state}, ${data.postalCode}, ${data.country}, ${data.label || 'home'}, ${data.isDefault || false}
      )
      RETURNING *
    `;

        return this.fromSQL(row);
    }

    static async findByUserId(userId: number): Promise<AddressModel[]> {
        const rows = await sql`
      SELECT * FROM addresses WHERE user_id = ${userId} ORDER BY is_default DESC, created_at DESC
    `;
        return rows.map(row => this.fromSQL(row));
    }

    static async findById(id: number): Promise<AddressModel | null> {
        const [row] = await sql`
      SELECT * FROM addresses WHERE id = ${id}
    `;
        if (!row) return null;
        return this.fromSQL(row);
    }

    static async update(id: number, userId: number, data: Partial<AddressFormData>): Promise<AddressModel | null> {
        // Logic to build query dynamically is needed, or just specific fields

        // Check ownership
        const [existing] = await sql`SELECT user_id FROM addresses WHERE id = ${id}`;
        if (!existing || existing.user_id !== userId) return null;

        if (data.isDefault) {
            await sql`UPDATE addresses SET is_default = FALSE WHERE user_id = ${userId}`;
        }

        // Construct update object
        const updateData: any = {};
        if (data.fullName) updateData.full_name = data.fullName;
        if (data.phone) updateData.phone = data.phone;
        if (data.city) updateData.city = data.city;
        if (data.state) updateData.state = data.state;
        if (data.postalCode) updateData.postal_code = data.postalCode;
        if (data.country) updateData.country = data.country;
        if (data.label) updateData.type = data.label;
        if (data.isDefault !== undefined) updateData.is_default = data.isDefault;

        if (data.street || data.streetNumber) {
            // This makes partial updates tricky if we don't have previous values. 
            // For simplicity, if street is updated, we expect full address line reconstruction or we just map street to address_line1
            if (data.street) updateData.address_line1 = data.street; // Simplified
        }
        if (data.apartment !== undefined) updateData.address_line2 = data.apartment;

        const [row] = await sql`
      UPDATE addresses SET ${sql(updateData)}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

        return row ? this.fromSQL(row) : null;
    }

    static async delete(id: number, userId: number): Promise<boolean> {
        const result = await sql`
      DELETE FROM addresses WHERE id = ${id} AND user_id = ${userId}
    `;
        return result.count > 0;
    }

    // Helper to convert DB row to AddressModel
    static fromSQL(row: any): AddressModel {
        return new AddressModel({
            id: row.id,
            userId: row.user_id,
            fullName: row.full_name,
            phone: row.phone,
            street: row.address_line1, // Mapping back (simplified)
            streetNumber: '', // Lost in translation unless parsed
            apartment: row.address_line2 || undefined,
            city: row.city,
            state: row.state,
            postalCode: row.postal_code,
            country: row.country,
            label: row.type as 'home' | 'work' | 'other',
            isDefault: row.is_default,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        });
    }

    // --- Domain Methods ---

    /**
     * Returns the full formatted address as a single string
     */
    getFullAddress(): string {
        const parts = [
            this.streetNumber && `${this.streetNumber}`,
            this.street,
            this.apartment && `Apt ${this.apartment}`,
            this.city,
            this.state,
            this.postalCode,
            this.country
        ].filter(Boolean);

        return parts.join(', ');
    }

    /**
     * Returns the address formatted for display (multi-line)
     */
    getFormattedAddress(): string {
        let formatted = '';

        if (this.streetNumber) {
            formatted += `${this.streetNumber} ${this.street}`;
        } else {
            formatted += this.street;
        }

        if (this.apartment) {
            formatted += `, Apt ${this.apartment}`;
        }

        formatted += `\n${this.city}, ${this.state} ${this.postalCode}`;
        formatted += `\n${this.country}`;

        return formatted;
    }

    /**
     * Validates the address data
     */
    validate(): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!this.fullName || this.fullName.trim().length === 0) {
            errors.push('Full name is required');
        }
        if (!this.phone || this.phone.trim().length === 0) {
            errors.push('Phone number is required');
        }

        if (!this.street || this.street.trim().length === 0) {
            errors.push('Street is required');
        }

        if (!this.city || this.city.trim().length === 0) {
            errors.push('City is required');
        }

        if (!this.state || this.state.trim().length === 0) {
            errors.push('State is required');
        }

        if (!this.postalCode || this.postalCode.trim().length === 0) {
            errors.push('Postal code is required');
        }

        if (!this.country || this.country.trim().length === 0) {
            errors.push('Country is required');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Returns a plain object representation
     */
    toJSON(): Address {
        return {
            id: this.id,
            userId: this.userId,
            fullName: this.fullName,
            phone: this.phone,
            street: this.street,
            streetNumber: this.streetNumber,
            apartment: this.apartment,
            city: this.city,
            state: this.state,
            postalCode: this.postalCode,
            country: this.country,
            latitude: this.latitude,
            longitude: this.longitude,
            isDefault: this.isDefault,
            label: this.label,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

/**
 * Utility functions for address operations
 */
export class AddressUtils {
    /**
     * Validates a postal code format (basic validation)
     */
    static validatePostalCode(postalCode: string, country: string): boolean {
        const patterns: { [key: string]: RegExp } = {
            'US': /^\d{5}(-\d{4})?$/,
            'CA': /^[A-Z]\d[A-Z] \d[A-Z]\d$/,
            'UK': /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i,
            'IN': /^\d{6}$/,
        };

        const pattern = patterns[country.toUpperCase()];
        if (!pattern) {
            return postalCode.length > 0; // Basic check for unknown countries
        }

        return pattern.test(postalCode);
    }

    /**
     * Calculates distance between two addresses (if coordinates are available)
     * Uses Haversine formula
     */
    static calculateDistance(addr1: Address, addr2: Address): number | null {
        if (!addr1.latitude || !addr1.longitude || !addr2.latitude || !addr2.longitude) {
            return null;
        }

        const R = 6371; // Earth's radius in kilometers
        const dLat = (addr2.latitude - addr1.latitude) * Math.PI / 180;
        const dLon = (addr2.longitude - addr1.longitude) * Math.PI / 180;

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(addr1.latitude * Math.PI / 180) *
            Math.cos(addr2.latitude * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return distance;
    }
}
