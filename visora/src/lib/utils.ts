import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names with conflict resolution.
 *
 * @example
 * cn("px-2 py-1", condition && "bg-red-500", "px-4")
 * // → "py-1 bg-red-500 px-4"   (later `px-4` wins over earlier `px-2`)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
