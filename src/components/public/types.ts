export type PublicDishState = "available" | "held" | "claimed" | "unavailable";

export type PublicDish = {
  id: string;
  name: string;
  imagePath: string;
  description: string;
  tags: string[];
  state: PublicDishState;
  claimedBy?: string;
};

export type DrawerDish = {
  id: string;
  dishName: string;
  customerName?: string;
};
