/**
 * Utility functions for generating and validating guild promo codes
 */

/**
 * Generates a unique promo code for a guild
 * Format: GAME_GUILDNAME_RANDOM (e.g., WOW_PHOENIX_A3B9)
 * 
 * @param gameName - Name of the game
 * @param guildName - Name of the guild
 * @returns A unique promo code string
 */
export function generatePromoCode(gameName: string, guildName: string): string {
  // Clean and take first 3 chars of game name
  const gamePrefix = gameName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 3);
  
  // Clean and take first 6 chars of guild name
  const guildPrefix = guildName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 6);
  
  // Generate 4-character random suffix
  const randomSuffix = Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '0')
    .padEnd(4, '0');
  
  return `${gamePrefix}_${guildPrefix}_${randomSuffix}`;
}

/**
 * Validates a promo code format
 * 
 * @param promoCode - The promo code to validate
 * @returns true if the format is valid, false otherwise
 */
export function isValidPromoCodeFormat(promoCode: string): boolean {
  // Should match format: XXX_XXXXXX_XXXX (alphanumeric with underscores)
  const promoCodeRegex = /^[A-Z0-9]{1,10}_[A-Z0-9]{1,10}_[A-Z0-9]{4}$/;
  return promoCodeRegex.test(promoCode);
}
