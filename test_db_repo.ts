import { db, initializeDatabase } from "./server/db";
import { ChallengeRepository } from "./server/repositories/ChallengeRepository";
import { challenges } from "./shared/schema";

async function run() {
  await initializeDatabase();
  console.log("Seeding challenges...");
  const challengeRepo = new ChallengeRepository();
  const existingRepoChallenges = await challengeRepo.findAll();
  console.log("Challenges from repository before seed:", existingRepoChallenges);
  if (existingRepoChallenges.length === 0) {
    await db.insert(challenges).values([
      {
        name: "BioSlime Survival",
        description: "Implement an intelligent agent to direct cellular automaton paths to maximize slime survival under toxic environments.",
        complexity: "Hard",
        activeScorers: ["example", "provisional"],
        inputSpec: "Integer seed, 50x50 integer array representing state grid, 200 simulation cycles.",
        outputSpec: "List of move coordinates to steer slime growth vectors."
      }
    ]);
    console.log("Seeded successfully.");
  }
  const challengesAfter = await challengeRepo.findAll();
  console.log("Challenges from repository after seed:", challengesAfter);
}

run().catch(console.error);
