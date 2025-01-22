export async function pagination(
  model,
  query,
  additionalFilter = undefined,
  aggregationPipeline = null
) {
  const { search, onlyAvailable, page = 1, limit = 10, sort } = { ...query };

  const pageNumber = parseInt(page);
  const recordLimit = parseInt(limit);
  const skipedQuantity = (pageNumber - 1) * recordLimit;

  const filter = { ...additionalFilter };

  if (onlyAvailable) filter.numberInStock = { $gt: 0 };

  if (search) {
    const searchRegex = new RegExp(search, "i");
    filter.$or = [
      { name: searchRegex },
      { "book.name": searchRegex },
      { "user.name": searchRegex },
      { phone: searchRegex },
      { "user.phone": searchRegex },
      { studentId: searchRegex },
      { "user.studentId": searchRegex },
      { autherName: searchRegex },
      { "book.autherName": searchRegex },
      { language: searchRegex },
      { "book.language": searchRegex },
      { bookId: searchRegex },
      { "book.bookId": searchRegex },
    ];
  }

  let sortOption = {};
  if (sort) {
    const [field, order] = sort.split(":"); // Example: 'name:asc' or 'name:desc'
    sortOption[field] = order === "desc" ? -1 : 1; // -1 for descending, 1 for ascending
  }

  if (aggregationPipeline) {
    let pipeline = [...aggregationPipeline, { $match: filter }];

    if (sort) {
      const [field, order] = sort.split(":");
      const sortStage = { $sort: { [field]: order === "desc" ? -1 : 1 } };
      pipeline.push(sortStage);
    }

    const skipStage = { $skip: (pageNumber - 1) * recordLimit };
    const limitStage = { $limit: recordLimit };
    pipeline.push(skipStage, limitStage);

    let result = await model.aggregate(pipeline);

    let totalRecords =
      (
        await model.aggregate([
          ...aggregationPipeline,
          { $match: filter },
          { $count: "total" },
        ])
      )[0]?.total || 0;

    let totalPages = Math.ceil(totalRecords / recordLimit);

    let hasNextPage =
      totalRecords - pageNumber * recordLimit > 0 &&
      result.length >= recordLimit;

    return {
      status: 200,
      message: "Data Retrieved Successfully",
      result: result,
      pagination: {
        totalRecord: totalRecords,
        totalPages: totalPages,
        hasNextPage: hasNextPage,
        currentPage: pageNumber,
      },
    };
  }

  let totalRecords = await model.countDocuments(filter);
  let totalPages = Math.ceil(totalRecords / recordLimit);

  return {
    filter,
    skipedQuantity,
    recordLimit,
    totalPages,
    totalRecords,
    pageNumber,
    sortOption,
  };
}
