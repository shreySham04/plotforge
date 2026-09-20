export function sectionLabel(type, number) {
  if (type === "STORY") {
    return `Chapter ${number || 1}`;
  }
  return `Scene ${number || 1}`;
}

export function screenplayTemplate() {
  return `EXT. COFFEE SHOP - DAY\n\nALEX sits at a corner table, typing intently on a laptop.\n\nALEX\n(muttering)\nThis plot needs a twist...\n`;
}
