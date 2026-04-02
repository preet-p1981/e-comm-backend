export const validate = (schema, key = 'body') => (req, res, next) => {
  req[key] = schema.parse(req[key]);
  next();
};
