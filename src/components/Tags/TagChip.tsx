import { Chip } from '@mui/material';
import type { Tag } from '../../types/tag';

type TagChipProps = {
  tag: Tag;
  size?: 'small' | 'medium';
  onDelete?: (event?: any) => void;
  onClick?: () => void;
  selected?: boolean;
};

export function TagChip({ tag, size = 'small', onDelete, onClick, selected }: TagChipProps) {
  return (
    <Chip
      label={tag.name}
      size={size}
      onDelete={onDelete}
      onClick={onClick}
      sx={{
        backgroundColor: tag.color,
        color: '#fff',
        '&:hover': {
          backgroundColor: tag.color,
          filter: 'brightness(0.9)'
        },
        ...(onClick && {
          cursor: 'pointer'
        }),
        ...(selected && {
          border: '2px solid',
          borderColor: 'primary.main'
        })
      }}
    />
  );
}
