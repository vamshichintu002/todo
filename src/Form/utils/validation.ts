export const validateAge = (value: string): string | null => {
  const age = parseInt(value);
  if (isNaN(age) || age < 1 || age > 100) {
    return 'Age must be between 1 and 100';
  }
  return null;
};

export const validateAmount = (value: string): string | null => {
  const amount = parseFloat(value);
  if (isNaN(amount) || amount < 0) {
    return 'Please enter a valid amount';
  }
  return null;
};

export const validateText = (value: string): string | null => {
  if (!/^[A-Za-z\s]*$/.test(value)) {
    return 'Please enter only letters and spaces';
  }
  return null;
};

export const validateNumber = (value: string, min: number, max: number): string | null => {
  const num = parseInt(value);
  if (isNaN(num) || num < min || num > max) {
    return `Please enter a number between ${min} and ${max}`;
  }
  return null;
};

export const validatePhone = (value: string): string | null => {
  if (!/^[0-9]{10}$/.test(value)) {
    return 'Please enter a valid 10-digit phone number';
  }
  return null;
};

export const validateName = (value: string): string | null => {
  if (!/^[A-Za-z\s]{2,50}$/.test(value)) {
    return 'Name must be 2-50 characters long and contain only letters and spaces';
  }
  return null;
};