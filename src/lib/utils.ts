import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { SupermarketData } from '@/types/supermarket'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Translates English status values to Dutch for display
 */
export function translateStatus(status: 'open' | 'closed'): string {
  switch (status) {
    case 'open':
      return 'Open';
    case 'closed':
      return 'Gesloten';
    default:
      return 'Gesloten';
  }
}

/**
 * Generates a Google Maps search URL for a supermarket
 */
export function generateGoogleMapsUrl(supermarket: SupermarketData): string {
  const query = encodeURIComponent(`${supermarket.name} ${supermarket.address} ${supermarket.postalCode} ${supermarket.city}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

/**
 * Opens a supermarket location in Google Maps in a new tab
 */
export function openInGoogleMaps(supermarket: SupermarketData): void {
  const url = generateGoogleMapsUrl(supermarket);
  window.open(url, '_blank', 'noopener,noreferrer');
}
