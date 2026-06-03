export type PublicDishState = "available" | "selected" | "held" | "claimed" | "unavailable";

export type PublicDish = {
  id: string;
  name: string;
  imagePath: string;
  description: string;
  tags: string[];
  state: PublicDishState;
  claimedBy?: string;
  actionText?: string;
};

export type DrawerDish = {
  id: string;
  dishId?: string;
  dishName: string;
  customerName?: string;
  actionText?: string;
};
