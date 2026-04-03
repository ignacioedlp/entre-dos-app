import { Svg, G, Path, Mask, Circle } from 'react-native-svg';

type Props = { size?: number };

export function FlagCO({ size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Mask id="CO_svg__a">
        <Circle cx={256} cy={256} r={256} fill="#fff" />
      </Mask>
      <G mask="url(#CO_svg__a)">
        <Path fill="#d80027" d="M0 384l255.8-29.7L512 384v128H0z" />
        <Path fill="#0052b4" d="M0 256l259.5-31L512 256v128H0z" />
        <Path fill="#ffda44" d="M0 0h512v256H0z" />
      </G>
    </Svg>
  );
}
