import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Функция cn для объединения CSS классов (используется в компонентах)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
