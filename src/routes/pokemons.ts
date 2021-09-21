import * as express from "express";
import {
  getPokemonsFromType,
  getEvolutionChain,
  getPokemons,
  getLegendaryPokemons,
  getMythicalPokemons,
  pokemon_0,
} from "../controllers/pokemons";

export const router = express.Router();

router.route("/").get(getPokemons);
router.route("/legendary/").get(getLegendaryPokemons);
router.route("/mythical/").get(getMythicalPokemons);
router.route("/chain/:pokemonId").get(getEvolutionChain);
router.route("/type/:typeId").get(getPokemonsFromType);
