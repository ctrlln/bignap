
import type { Database } from '../types';

export async function fetchData(): Promise<Database> {
    const response = await fetch(`${import.meta.env.BASE_URL}data/db.json`);
    if (!response.ok) {
        throw new Error('Failed to fetch data');
    }
    return response.json();
}
