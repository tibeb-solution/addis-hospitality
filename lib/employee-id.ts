/**
 * Utility for generating and managing unique Employee ID numbers and barcodes
 */

// Generate a deterministic or randomized employee ID number in the format AHS-001-XXX-2026
export function generateEmployeeIdNumber(seed?: string): string {
  const year = new Date().getFullYear();
  
  if (!seed) {
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `AHS-001-${randomNum}-${year}`;
  }

  // Create deterministic 3-digit number from seed
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);
  const middleCode = String((positiveHash % 900) + 100).padStart(3, "0");
  return `AHS-001-${middleCode}-${year}`;
}

export function formatEmployeeId(idNumber?: string | null, fallbackSeed?: string): string {
  if (idNumber && idNumber.trim().length > 0) {
    if (!idNumber.startsWith("AHS-") && !idNumber.startsWith("001-")) {
      return `AHS-${idNumber}`;
    }
    return idNumber;
  }
  return generateEmployeeIdNumber(fallbackSeed);
}

/**
 * Pure TypeScript Code 128 Barcode Generator (Type B)
 * Encodes alphanumeric strings into precise bar/space width arrays
 */
const CODE128_PATTERNS: number[] = [
  212222, 222122, 222221, 121223, 121322, 131222, 122213, 122312, 132212, 221213, // 0-9
  221312, 231212, 112232, 122132, 122231, 113222, 123122, 123221, 223211, 221132, // 10-19
  221231, 213212, 223112, 312131, 311222, 321122, 321221, 312212, 322112, 322211, // 20-29
  212123, 212321, 232121, 111323, 131123, 131321, 112313, 132113, 132311, 211313, // 30-39
  231113, 231311, 112133, 112331, 132131, 113123, 113321, 133121, 313121, 211331, // 40-49
  231131, 213113, 213311, 213131, 311123, 311321, 331121, 312113, 312311, 332111, // 50-59
  314111, 221411, 431111, 111224, 111422, 121124, 121421, 141122, 141221, 112214, // 60-69
  112412, 122114, 122411, 142112, 142211, 241211, 221114, 413111, 241112, 134111, // 70-79
  111242, 121142, 121241, 114212, 124112, 124211, 411212, 421112, 421211, 212141, // 80-89
  214121, 412121, 111143, 111341, 131141, 114113, 114311, 411113, 411311, 113141, // 90-99
  114131, 311141, 411131, 211412, 211214, 211232, 2331112 // 100-106 (106 is STOP)
];

export function encodeCode128(text: string): string {
  // Start Code B is index 104
  const startCode = 104;
  const codes: number[] = [startCode];
  let checkSum = startCode;

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const codeVal = charCode - 32; // Code 128B ASCII offset
    if (codeVal >= 0 && codeVal <= 95) {
      codes.push(codeVal);
      checkSum += codeVal * (i + 1);
    }
  }

  const checkDigit = checkSum % 103;
  codes.push(checkDigit);
  codes.push(106); // Stop code

  // Convert numbers to binary bar/space pattern string ('1' = bar, '0' = space)
  let binaryString = "";
  for (let i = 0; i < codes.length; i++) {
    const pattern = String(CODE128_PATTERNS[codes[i]]);
    let isBar = true;
    for (let j = 0; j < pattern.length; j++) {
      const width = parseInt(pattern[j], 10);
      binaryString += (isBar ? "1" : "0").repeat(width);
      isBar = !isBar;
    }
  }
  return binaryString;
}
