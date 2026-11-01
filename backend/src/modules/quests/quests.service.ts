import * as questsRepository from "./quests.repository.js";

type CreateQuestInput = {
  name: string;
  kind: "count" | "distance" | "duration" | "yesno" | "steps";
  target: number;
  unit: string;
  accent?: string;
};

export async function listQuestsForHunter(hunter_id: number) {
  return questsRepository.findQuestsByHunterId(hunter_id);
}

export async function addQuest(hunter_id: number, input: CreateQuestInput) {
  return questsRepository.insertQuest({
    hunter_id,
    name: input.name,
    kind: input.kind,
    target: String(input.target),
    unit: input.unit,
    accent: input.accent ?? "#7c6cf0",
  });
}

export async function deleteQuest(id: number) {
  return questsRepository.softDeleteQuest(id);
}
