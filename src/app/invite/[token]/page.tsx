import { getDatabase } from "@/db/client";
import { ClosedView } from "@/components/public/closed-view";
import { PublicOrderingPage } from "@/components/public/public-ordering-page";
import type { PublicDish } from "@/components/public/types";
import { createChefService } from "@/server/chef-service";
import { createPublicService } from "@/server/public-service";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const database = getDatabase();
  const state = createPublicService(database).getState(token);

  if (state.kind === "closed") {
    return <ClosedView />;
  }

  const dishes: PublicDish[] = createChefService(database)
    .listDishes()
    .filter((dish) => dish.isAvailable)
    .map((dish) => ({
      id: dish.id,
      name: dish.name,
      imagePath: dish.imagePath,
      description: dish.description,
      tags: dish.tags,
      state: "available",
    }));

  return <PublicOrderingPage inviteToken={token} dishes={dishes} />;
}
