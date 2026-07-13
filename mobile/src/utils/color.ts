// Translucent tints of the user's chosen accent color — several screens use
// e.g. rgba(168,200,74,.1) as a soft badge/pill background behind the solid
// accent; this produces the same effect for any hex the theme picker sets.
export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
