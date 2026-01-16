/**
 * Utilitaires pour la validation et la génération de sessions
 */

/**
 * Valide qu'un identifiant respecte le format UUID v4
 * @param {string} uuid - L'UUID à valider
 * @returns {boolean} True si valide, false sinon
 */
export function isValidUUIDv4(uuid) {
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return typeof uuid === 'string' && uuidV4Regex.test(uuid);
}

/**
 * Génère un UUID v4 cryptographiquement sécurisé
 * @returns {string} UUID v4
 */
export function generateUUIDv4() {
  // Utiliser crypto.randomUUID() si disponible (navigateurs modernes)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback pour les navigateurs plus anciens
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Génère plusieurs UUIDs et vérifie leur unicité
 * @param {number} count - Nombre d'UUIDs à générer
 * @returns {string[]} Tableau d'UUIDs uniques
 */
export function generateUniqueUUIDs(count = 1) {
  const uuids = new Set();
  
  while (uuids.size < count) {
    uuids.add(generateUUIDv4());
  }
  
  return Array.from(uuids);
}

/**
 * Vérifie l'entropie d'un UUID (mesure basique de randomness)
 * @param {string} uuid - L'UUID à analyser
 * @returns {number} Score d'entropie (0-1, plus élevé = plus aléatoire)
 */
export function calculateUUIDEntropy(uuid) {
  if (!isValidUUIDv4(uuid)) {
    return 0;
  }
  
  // Retirer les tirets et convertir en minuscules
  const cleanUuid = uuid.replace(/-/g, '').toLowerCase();
  
  // Compter la fréquence de chaque caractère
  const charFreq = {};
  for (const char of cleanUuid) {
    charFreq[char] = (charFreq[char] || 0) + 1;
  }
  
  // Calculer l'entropie de Shannon
  const length = cleanUuid.length;
  let entropy = 0;
  
  Object.values(charFreq).forEach(freq => {
    const probability = freq / length;
    entropy -= probability * Math.log2(probability);
  });
  
  // Normaliser sur une échelle de 0 à 1
  const maxEntropy = Math.log2(16); // 16 caractères hexadécimaux possibles
  return entropy / maxEntropy;
}

/**
 * Constantes pour la gestion des sessions
 */
export const SESSION_CONSTANTS = {
  STORAGE_PREFIX: 'session_',
  CURRENT_SESSION_KEY: 'current_session_id',
  EXPIRATION_TIME: 24 * 60 * 60 * 1000, // 24 heures en millisecondes
  MIN_ENTROPY_THRESHOLD: 0.8, // Seuil minimum d'entropie acceptable
  
  // Clés de données de session
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'userData',
  CREATED_AT: 'createdAt',
  LAST_ACTIVITY: 'lastActivity'
};