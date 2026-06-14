const STROOPS_PER_XLM = 10_000_000;

/** Convert XLM to stroops */
export const xlmToStroops = (xlm: number | string): string =>
  Math.round(parseFloat(String(xlm)) * STROOPS_PER_XLM).toString();

/** Convert stroops to XLM */
export const stroopsToXlm = (stroops: number | string): string =>
  (parseInt(String(stroops), 10) / STROOPS_PER_XLM).toFixed(7);

/** Format an XLM amount with up to 7 decimal places, trimming trailing zeros */
export const formatXlm = (amount: number | string, decimals = 2): string =>
  parseFloat(parseFloat(String(amount)).toFixed(7)).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: 7,
  });

/** Convert between two assets using a simple exchange rate */
export const convertAsset = (amount: number | string, rate: number): string =>
  (parseFloat(String(amount)) * rate).toFixed(7);

/** Estimate USD value of XLM given a price */
export const xlmToUsd = (xlm: number | string, priceUsd: number): string =>
  (parseFloat(String(xlm)) * priceUsd).toFixed(2);

/** Estimate XLM needed for a USD amount */
export const usdToXlm = (usd: number | string, priceUsd: number): string =>
  (parseFloat(String(usd)) / priceUsd).toFixed(7);

/** Calculate percentage fee for a transaction */
export const calculateFee = (amount: number | string, feeBps: number): string => {
  const fee = (parseFloat(String(amount)) * feeBps) / 10_000;
  return fee.toFixed(7);
};

/** Round XLM to valid Stellar precision (7 decimal places) */
export const toStellarPrecision = (amount: number | string): string =>
  parseFloat(String(amount)).toFixed(7);
