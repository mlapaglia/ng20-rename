// Sample utils file - should detect as -utils
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function calculateTotal(items: any[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

export const parseJson = (jsonString: string) => {
  try {
    return JSON.parse(jsonString);
  } catch {
    return null;
  }
};

export function convertToSlug(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-');
}

export function transformData(input: any): any {
  // Utility transformation logic
  return input;
}
