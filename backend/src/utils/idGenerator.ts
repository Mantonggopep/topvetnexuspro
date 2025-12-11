/**
 * Generates a formatted ID based on a pattern and a sequence number.
 * Pattern Examples: "HH/000/year" -> "HH/001/2025"
 */
export const generateNextId = (pattern: string | null | undefined, sequenceNumber: number): string => {
    // 1. Default fallback
    if (!pattern) return sequenceNumber.toString();

    const currentYear = new Date().getFullYear().toString();
    
    // 2. Replace 'year' first (case insensitive)
    // We do this first so that if the year is "2000", it doesn't interfere with the 000 padding later
    let formatted = pattern.replace(/year/gi, currentYear);

    // 3. Find the sequence of zeros to determine padding
    // e.g. "HH/000/2025" matches "000"
    const zeroMatch = formatted.match(/(0+)/);

    if (zeroMatch) {
        const placeholder = zeroMatch[1]; // "000"
        const paddingLength = placeholder.length; // 3
        
        // Convert sequence to string with padding
        // 1 -> "001", 10 -> "010", 100 -> "100"
        const paddedNumber = sequenceNumber.toString().padStart(paddingLength, '0');
        
        // Replace ONLY the first occurrence of the zeros with the padded number
        formatted = formatted.replace(placeholder, paddedNumber);
    } else {
        // If no zeros found in pattern (e.g. "INV-"), just append the number
        formatted = `${formatted}${sequenceNumber}`;
    }

    return formatted;
};