// Reproducible demo data. Must be safe to rerun.
// Demo passwords must come from environment variables, never from this file.
async function main(): Promise<void> {
  console.log("Seed: nothing to seed yet.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
