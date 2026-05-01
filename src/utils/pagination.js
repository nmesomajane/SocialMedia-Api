const paginate = async (model, query, options) => {
  const page  = parseInt(options.page)  || 1;
  const limit = parseInt(options.limit) || 20;
  const skip  = (page - 1) * limit;

  const [data, total] = await Promise.all([
    model.find(query).sort(options.sort).skip(skip).limit(limit),
    model.countDocuments(query)
  ]);

  return {
    data,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  };
};
module.exports = paginate;