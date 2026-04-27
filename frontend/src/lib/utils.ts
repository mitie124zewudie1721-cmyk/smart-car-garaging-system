// src/lib/utils.ts
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes intelligently (resolves conflicts)
 * 
 * @example
 * cn("px-4 py-2", isActive && "bg-blue-600 text-white", "rounded-lg")
 * cn("text-sm", { "font-bold": isBold, "italic": isItalic })
 */
export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
}

// Optional extra helpers (very common in shadcn/ui projects)

export function cx(...inputs: ClassValue[]): string {
    return cn(inputs); // alias — some people prefer cx()
}

/**
 * Conditional class helper (alternative syntax)
 * @example cva("base", { variants: { size: { sm: "text-sm", lg: "text-lg" } } })
 */
export { clsx };