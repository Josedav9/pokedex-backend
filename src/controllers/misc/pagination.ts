import { Pagination } from "controllers/interfaces/pokemon.interface";

export const createPaginationObject = (
  limit: number,
  offset: number,
  total: number
) => {
  const startIndex = offset;
  let endIndex = offset + limit;
  if (endIndex > total) endIndex = total;

  // Pagination result
  const pagination: Pagination = { startIndex, endIndex, total };

  
  return pagination;
};