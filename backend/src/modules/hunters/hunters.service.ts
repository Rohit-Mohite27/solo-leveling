import * as huntersRepository from "./hunters.repository.js";

export async function getHunterById(id: number) {
  return huntersRepository.findHunterById(id);
}
