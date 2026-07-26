import clsx, { type ClassValue } from "clsx";

/** Thin wrapper so call sites read `cn(...)` instead of `clsx(...)`. */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
