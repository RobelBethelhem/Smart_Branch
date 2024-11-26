export function cleanBase64String(base64String: string): string {
    // Remove duplicate data:image prefixes
    if (base64String.startsWith('data:image/jpeg;base64,data:image/jpeg;base64,')) {
        base64String = base64String.replace('data:image/jpeg;base64,', '');
    }
    
    // Remove any data:image prefix to standardize the string
    base64String = base64String.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
    
    // Add back the proper prefix
    return `data:image/jpeg;base64,${base64String}`;
}

export function loadImage(base64String: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => resolve(img);
        img.onerror = (error) => reject(new Error('Failed to load image: ' + error));
        
        // Clean the base64 string before setting src
        img.src = cleanBase64String(base64String);
    });
}

export function isValidBase64Image(str: string): boolean {
    if (!str?.length) return false;
    try {
        return str.includes('data:image') && btoa(atob(str.split(',')[1])) === str.split(',')[1];
    } catch (err) {
        return false;
    }
}