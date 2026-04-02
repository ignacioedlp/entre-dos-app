import { Svg, G, Path, Defs, ClipPath } from 'react-native-svg';

type Props = { size?: number };

export function FlagAR({ size = 24 }: Props) {
  return (
    <Svg width={size} height={size} fill="none" viewBox="0 0 24 24">
      <G clipPath="url(#AR_svg__a)">
        <Path
          d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12z"
          fill="#F0F0F0"
        />
        <Path
          d="M12-.001A12 12 0 001.192 6.782H22.81A12 12 0 0012-.001zm0 24a12 12 0 0010.81-6.783H1.191A12 12 0 0012.001 24z"
          fill="#338AF3"
        />
        <Path
          d="M15.586 12l-1.465.69.78 1.419-1.591-.305-.202 1.608L12 14.229l-1.109 1.183-.201-1.608-1.592.305.78-1.42L8.414 12l1.466-.69-.78-1.419 1.59.305.202-1.608L12 9.771l1.108-1.183.202 1.608 1.59-.306-.78 1.42 1.465.689z"
          fill="#FFDA44"
        />
      </G>
      <Defs>
        <ClipPath id="AR_svg__a">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  );
}
