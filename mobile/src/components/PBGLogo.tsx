import React from "react";
import Svg, { Path, Circle, Text as SvgText } from "react-native-svg";

interface Props {
  size?: number;
  color?: string;
  ink?: string;
  // "PB" font-size in the SVG's own 100-unit coordinate space. Decoupled
  // from `size` on purpose: when the icon is scaled way up next to a brand
  // wordmark, the splatter should visually dominate — the letters shouldn't
  // scale 1:1 with it, or they end up oversized and the mark stops reading
  // as "art with letters on it." Callers pass a smaller textSize as size
  // grows so the rendered "PB" stays close to the adjacent wordmark's
  // on-screen text height instead of ballooning with the icon.
  textSize?: number;
  style?: object;
}

// A paint-splatter mark, replacing the old plain rounded square. The blob is
// a hand-authored 10-point splatter (quadratic-bezier star through alternating
// spike/valley points, with one drip stretched out longer than the rest for
// asymmetry) plus four satellite droplets thrown off in the same directions
// as nearby spikes, for the spray-paint look. "PB" sits centered in the
// shape's solid core with a bold weight so it stays legible against
// whatever fill color the user picks.
export default function PBGLogo({ size = 40, color = "#A8C84A", ink = "#10150d", textSize = 30, style }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      <Circle cx={98} cy={10} r={3.5} fill={color} />
      <Circle cx={98} cy={45} r={3} fill={color} />
      <Circle cx={8} cy={82} r={5} fill={color} />
      <Circle cx={50} cy={99} r={3} fill={color} />
      <Path
        d="M29,49
           Q1,59 31,60
           Q27,73 41,69
           Q46,99 55,70
           Q70,78 66,64
           Q77,63 71,52
           Q95,38 67,38
           Q71,21 55,30
           Q46,4 41,31
           Q26,26 32,40
           Q21,42 29,49
           Z"
        fill={color}
      />
      <SvgText
        x="50"
        y={50 + textSize * 0.31}
        fontSize={textSize}
        fontWeight="900"
        fill={ink}
        textAnchor="middle"
        fontFamily="System"
      >
        PB
      </SvgText>
    </Svg>
  );
}
