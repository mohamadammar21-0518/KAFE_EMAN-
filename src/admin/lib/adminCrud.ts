/** Typed delete confirmation — same pattern across admin CRUD. */
export function buildDeleteConfirmPhrase(itemName: string) {
  return `I am sure to delete ${itemName}`;
}
