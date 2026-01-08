/**
 * Class Name Utility (cn)
 *
 * Utility function for conditionally joining CSS class names.
 * A lightweight alternative to libraries like `clsx` or `classnames`.
 *
 * @module shared/utils/cn
 *
 * FEATURES:
 * - Filters out falsy values (false, null, undefined, 0, '')
 * - Flattens nested arrays
 * - Converts all values to strings
 * - Joins with spaces
 *
 * USAGE EXAMPLES:
 * ```tsx
 * // Basic conditional classes
 * cn('btn', isActive && 'btn-active')
 * // Result: 'btn btn-active' or 'btn'
 *
 * // Multiple conditions
 * cn(
 *   'base-class',
 *   isYes && 'text-yes',
 *   isNo && 'text-no',
 *   variant === 'primary' && 'bg-cyber'
 * )
 *
 * // Common component pattern
 * <button className={cn('btn', variants[variant], className)}>
 *   {children}
 * </button>
 * ```
 */

type ClassValue = string | number | boolean | undefined | null | ClassValue[];

/**
 * Conditionally join class names into a single string.
 * Filters out falsy values and flattens arrays.
 *
 * @param classes - Class names, conditions, or arrays thereof
 * @returns Joined class name string
 */
export function cn(...classes: ClassValue[]): string {
  const flatten = (arr: ClassValue[]): (string | number)[] => {
    const result: (string | number)[] = [];
    for (const item of arr) {
      if (Array.isArray(item)) {
        result.push(...flatten(item));
      } else if (item && typeof item !== 'boolean') {
        result.push(item);
      }
    }
    return result;
  };

  return flatten(classes).map(String).join(' ');
}
