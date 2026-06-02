import { MEAL_STATUS } from "./constants";

export type MealStatus = (typeof MEAL_STATUS)[keyof typeof MEAL_STATUS];
