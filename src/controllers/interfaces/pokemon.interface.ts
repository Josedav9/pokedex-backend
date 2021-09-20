export interface Pagination {
  next: number;
  prev: number;
  limit: number;
}

export interface PokemonInfo { 
  id: number,
  name: string,
  order: number,
  sprite: string, // Image url,
  types: string[]
}