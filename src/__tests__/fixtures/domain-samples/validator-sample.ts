// Sample validator file - should detect as -validator
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPassword(password: string): boolean {
  return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
}

export function checkUserInput(input: string): boolean {
  return input.trim().length > 0;
}

export function verifyPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s-()]+$/;
  return phoneRegex.test(phone);
}

export class FormValidator {
  validate(data: any): boolean {
    return true;
  }
}
