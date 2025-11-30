function generateExpiryDate(hours = 24) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export default generateExpiryDate;
