import { createSupabaseServerActionClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GearOptimizerClient } from "@/components/gear-optimizer/gear-optimizer-client";

export default async function GearOptimizerPage() {
  const supabase = createSupabaseServerActionClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Fetch all gear items
  const { data: gearItems, error: gearError } = await supabase
    .from("gear_items")
    .select("*")
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (gearError) {
    console.error("Error fetching gear items:", gearError);
  }

  // Fetch gear sets
  const { data: gearSets, error: setsError } = await supabase
    .from("gear_sets")
    .select("*");

  if (setsError) {
    console.error("Error fetching gear sets:", setsError);
  }

  return (
    <GearOptimizerClient
      initialGearItems={gearItems || []}
      initialGearSets={gearSets || []}
    />
  );
}

