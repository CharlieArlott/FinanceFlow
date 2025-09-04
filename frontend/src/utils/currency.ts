// Currency formatting utility for Malaysian Ringgit (RM)

export const formatCurrency = (amount: number): string => {
  return `RM${Math.abs(amount).toFixed(2)}`;
};

export const formatCurrencyWithSign = (amount: number): string => {
  const prefix = amount >= 0 ? '+RM' : '-RM';
  return `${prefix}${Math.abs(amount).toFixed(2)}`;
};

export const formatCurrencyDisplay = (amount: number, showSign: boolean = false): string => {
  if (showSign) {
    return formatCurrencyWithSign(amount);
  }
  return formatCurrency(amount);
};