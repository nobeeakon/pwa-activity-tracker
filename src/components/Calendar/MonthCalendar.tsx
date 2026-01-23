import { Box, Paper, Typography, IconButton } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  format,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth
} from 'date-fns';

const CELL_HEIGHT = 40;

export function MonthCalendar({
  records,
  currentMonth,
  onMonthChange
}: {
  records: { date: Date; note?: string }[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}) {

  const firstDay = startOfMonth(currentMonth);
  const lastDay = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: firstDay, end: lastDay });
  const startDayOfWeek = getDay(firstDay);

  const handlePrevMonth = () => {
    onMonthChange(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    onMonthChange(addMonths(currentMonth, 1));
  };

  const numberOfRecordsInDate = (date: Date) => {
    return records.filter(record => isSameDay(record.date, date)).length;
  };

  // Create array of empty cells for alignment
  const emptyCells = Array.from({ length: startDayOfWeek }, (_, i) => i);

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      {/* Header with navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <IconButton onClick={handlePrevMonth} size="small">
          <ChevronLeft />
        </IconButton>
        <Typography variant="h6">
          {format(currentMonth, 'MMMM yyyy')}
        </Typography>
        <IconButton onClick={handleNextMonth} size="small">
          <ChevronRight />
        </IconButton>
      </Box>

      {/* Weekday headers */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 0.5,
          mb: 0.5
        }}
      >
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <Box key={`header-${index}`} sx={{ textAlign: 'center' }}>
            <Typography variant="caption" fontWeight="bold" color="text.secondary">
              {day}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Calendar grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 0.5
        }}
      >
        {/* Empty cells for alignment */}
        {emptyCells.map(index => (
          <Box key={`empty-${index}`} sx={{ height: CELL_HEIGHT }} />
        ))}

        {/* Date cells */}
        {daysInMonth.map(date => {
          const isToday = isSameDay(date, new Date());
          const recordCount = numberOfRecordsInDate(date);
          
          return (
            <Paper
              key={date.toISOString()}
              elevation={0}
              sx={{
                height: CELL_HEIGHT,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: recordCount ? 'action.hover' : 'transparent',
                border: isToday ? '2px solid' : recordCount ? '1px solid green' : '1px dashed',
                borderColor: isToday ? 'primary.main' : recordCount ? 'success.main' : 'divider',
                position: 'relative'
              }}
            >
              <Typography 
          variant="body2" 
          color={isSameMonth(date, currentMonth) ? 'text.primary' : 'text.disabled'}
          fontWeight={isToday ? 'bold' : 'normal'}
              >
          {format(date, 'd')}
              </Typography>
              {recordCount > 0 && (
          <Box
            sx={{
              width: recordCount > 1 ? 20 : 8,
              height: 8,
              borderRadius: '20%',
              backgroundColor: 'success.main',
              position: 'absolute',
              bottom: 3
            }}
          />
              )}
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
}
