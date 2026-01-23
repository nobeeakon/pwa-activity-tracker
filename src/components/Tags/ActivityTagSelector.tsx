import { useState } from 'react';
import { Autocomplete, TextField, Box, Button } from '@mui/material';
import { useTags } from '../../hooks/useTags';
import { TagChip } from './TagChip';
import { TagManager } from './TagManager';

type ActivityTagSelectorProps = {
  value: number[];
  onChange: (tagIds: number[]) => void;
  disabled?: boolean;
};

export function ActivityTagSelector({ value, onChange, disabled }: ActivityTagSelectorProps) {
  const allTags = useTags();
  const [tagManagerOpen, setTagManagerOpen] = useState(false);

  // Find tag objects for selected IDs
  const selectedTags = allTags.filter(tag => value.includes(tag.id!));

  return (
    <>
      <Box>
        <Autocomplete
          multiple
          options={allTags}
          value={selectedTags}
          onChange={(_, newTags) => {
            onChange(newTags.map(tag => tag.id!));
          }}
          getOptionLabel={(option) => option.name}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Tags"
              placeholder="Select tags..."
              helperText="Select tags to organize this activity"
            />
          )}
          renderTags={(tagValue, getTagProps) =>
            tagValue.map((tag, index) => {
              const { key, ...tagProps } = getTagProps({ index });
              return (
                <TagChip
                  key={key}
                  tag={tag}
                  {...tagProps}
                />
              );
            })
          }
          disabled={disabled}
        />

        <Button
          size="small"
          onClick={() => setTagManagerOpen(true)}
          sx={{ mt: 1 }}
        >
          Manage Tags
        </Button>
      </Box>

      <TagManager
        open={tagManagerOpen}
        onClose={() => setTagManagerOpen(false)}
      />
    </>
  );
}
