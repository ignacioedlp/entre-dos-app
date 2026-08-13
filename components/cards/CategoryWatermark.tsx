import Svg, { Path, Rect } from 'react-native-svg';

type CardCategory = 'action' | 'home' | 'date';

interface CategoryWatermarkProps {
  category: CardCategory;
  color: string;
  size: number;
}

export function CategoryWatermark({ category, color, size }: CategoryWatermarkProps) {
  return (
    <Svg height={size} viewBox="0 0 96 96" width={size}>
      {category === 'action' && <Path d="M54 8 24 51h21l-3 37 30-44H51l3-36Z" fill={color} />}
      {category === 'home' && (
        <>
          <Rect fill={color} height={32} rx={12} width={54} x={21} y={28} />
          <Rect fill={color} height={25} rx={8} width={78} x={9} y={51} />
          <Rect fill={color} height={10} width={10} x={16} y={71} />
          <Rect fill={color} height={10} width={10} x={70} y={71} />
          <Path d="M48 33c-10 0-18 8-18 18h36c0-10-8-18-18-18Z" fill={color} fillOpacity={0.5} />
        </>
      )}
      {category === 'date' && (
        <Path
          d="M48 82C48 82 10 60 10 34 10 19 21 9 35 9c6 0 10 3 13 8 3-5 7-8 13-8 14 0 25 10 25 25 0 26-38 48-38 48Z"
          fill={color}
        />
      )}
    </Svg>
  );
}
