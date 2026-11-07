/**
 * Move `id` so it lands where `target` is. Dragging forward (towards the end of the list) puts it AFTER the target,
 * dragging backward puts it BEFORE it, so every direction (left/right, up/down) works from any position.
 * If `target` is missing the item goes to the end.
 */
export function moveToTarget<T>(list: T[], id: T, target?: T): T[] {
  const from = list.indexOf(id);
  const rest = list.filter((x) => x !== id);
  let i = target === undefined ? -1 : rest.indexOf(target);
  if (i < 0) return [...rest, id];
  if (from >= 0 && from < list.indexOf(target as T)) i += 1;
  return [...rest.slice(0, i), id, ...rest.slice(i)];
}
