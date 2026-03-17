import Masonry from 'react-masonry-css';
import { CoverCard } from './CoverCard';
import type { AppState, AppAction } from '@/lib/cover-picker-types';

type Props = {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
};

const breakpointColumns = {
  default: 4,
  1100: 3,
  700: 2,
};

export const ImageGrid = ({ state, dispatch }: Props) => {
  return (
    <Masonry
      breakpointCols={breakpointColumns}
      className="masonry-grid"
      columnClassName="masonry-grid_column"
    >
      {state.images.map((image, i) => (
        <CoverCard
          key={image.id}
          image={image}
          state={state}
          dispatch={dispatch}
          index={i}
        />
      ))}
    </Masonry>
  );
};
