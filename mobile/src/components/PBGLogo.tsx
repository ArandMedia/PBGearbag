import React from "react";
import Svg, { Path, Circle, Text as SvgText } from "react-native-svg";

interface Props {
  size?: number;
  color?: string;
  ink?: string;
}

// A paint-splatter mark, replacing the old plain rounded square. The blob is
// a hand-authored irregular six-lobe shape (not a circle/blob-generator
// output) plus two small satellite droplets for extra "splatter" character.
// Kept deliberately un-detailed — anything busier turns to mud at the
// ~36-40px this renders at in the nav — with "PB" flat and centered so it
// stays legible regardless of the fill color the user picks.
export default function PBGLogo({ size = 40, color = "#A8C84A", ink = "#10150d" }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx={87} cy={26} r={6} fill={color} />
      <Circle cx={12} cy={82} r={4.5} fill={color} />
      <Path
        d="M50,16 Q73,15 85,30 Q90,47 76,65 Q63,87 43,91 Q26,84 20,61 Q9,45 17,31 Q28,15 50,16 Z"
        fill={color}
      />
      <SvgText
        x="50"
        y="63"
        fontSize="36"
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
