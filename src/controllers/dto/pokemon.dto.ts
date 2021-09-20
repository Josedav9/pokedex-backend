import { PokemonInfo } from "../interfaces/pokemon.interface";

export interface PokeApiListDTO {
  count: number;
  next: string;
  previus?: string;
  results: {
    name: string;
    url: string;
  }[];
}

export interface PokeApiInfoDTO {
  id: number;
  name: string;
  order: number;
  sprites: {
    other: {
      "official-artwork": {
        front_default: string;
      };
    };
  }; // Image url,
  types: {
    type: {
      url: string;
      name: string;
    };
  }[];
}
