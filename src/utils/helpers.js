export const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const toPlainDecimal = (value) => Number(value).toFixed(2);

export const generateOrderNumber = () => `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

export const parsePagination = (query) => {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 12), 1), 50);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};
