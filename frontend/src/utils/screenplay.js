export function screenplayTemplate() {
  return `INT. ROOM - NIGHT\n\nJOHN\nSomething feels wrong.\n\nACTION\nA loud knock interrupts the silence.`;
}

export function sectionLabel(type, sectionNumber) {
  return type === "SCRIPT" ? `Scene ${sectionNumber}` : `Chapter ${sectionNumber}`;
}
