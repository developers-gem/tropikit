import { connectDatabase, disconnectDatabase } from "../config/db";
import { Destination } from "../models/Destination";
import { Story } from "../models/Story";
import destinationsSeed from "./data/destinations.json";
import storiesSeed from "./data/stories.json";

async function seed() {
  await connectDatabase();

  console.log(`Seeding ${destinationsSeed.length} destinations...`);
  await Destination.deleteMany({});
  const inserted = await Destination.insertMany(destinationsSeed);
  console.log(`Inserted ${inserted.length} destinations.`);

  const bySlug = new Map(inserted.map((d) => [d.slug, d._id]));

  console.log(`Seeding ${storiesSeed.length} stories...`);
  await Story.deleteMany({});
  const storyDocs = storiesSeed
    .map((s: (typeof storiesSeed)[number]) => {
      const destinationId = bySlug.get(s.destinationSlug);
      if (!destinationId) {
        console.warn(`Skipping story "${s.title}" — unknown destination slug ${s.destinationSlug}`);
        return null;
      }
      const { destinationSlug: _drop, ...rest } = s;
      return { ...rest, destinationId };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);

  await Story.insertMany(storyDocs);
  console.log(`Inserted ${storyDocs.length} stories.`);

  console.log("Seed complete.");
  await disconnectDatabase();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
