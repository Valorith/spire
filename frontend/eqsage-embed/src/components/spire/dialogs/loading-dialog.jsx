import React, { useEffect, useMemo } from 'react';
import { UiState, useSelector } from '../../../state';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Typography,
} from '@mui/material';

const getProgressFromText = (text) => {
  const match = `${text ?? ''}`.match(/(\d+)\s+of\s+(\d+)/i);
  if (!match) {
    return null;
  }

  const loaded = Number(match[1]);
  const total = Number(match[2]);
  if (!Number.isFinite(loaded) || !Number.isFinite(total) || total <= 0) {
    return null;
  }

  return {
    loaded,
    total,
    percent: Math.max(0, Math.min(100, (loaded / total) * 100)),
  };
};

export const LoadingDialog = () => {
  const loading = useSelector(UiState.loading);
  const loadingText = useSelector(UiState.loadingText);
  const loadingTitle = useSelector(UiState.loadingTitle);
  const progress = useMemo(() => getProgressFromText(loadingText), [loadingText]);

  useEffect(() => {
    if (window.gameController) {
      window.gameController.loading = loading;
    }
  }, [loading]);

  return loading ? (
    <>
      <Box className="main"></Box>
      <Dialog
        open={true}
        maxWidth="md"
        className="ui-dialog"
        sx={{ pointerEvents: 'none', zIndex: 1000000 }}
        slotProps={{
          backdrop: { sx: { pointerEvents: 'none' } },
          paper   : {
            sx: {
              minWidth       : 360,
              maxWidth       : 460,
              background     : 'linear-gradient(180deg, rgba(14, 20, 28, 0.97), rgba(5, 8, 12, 0.97))',
              border         : '1px solid rgba(220, 209, 156, 0.72)',
              boxShadow      : '0 18px 54px rgba(0, 0, 0, 0.55)',
              backgroundImage: 'linear-gradient(180deg, rgba(24, 35, 49, 0.82), rgba(6, 10, 15, 0.95))',
            },
          },
        }}
      >
        <DialogTitle className="ui-dialog-title">
          {loadingTitle || 'Loading'}
        </DialogTitle>
        <DialogContent sx={{ pb: 2.5 }}>
          <Box
            sx={{
              display      : 'flex',
              flexDirection : 'column',
              justifyContent: 'center',
              minHeight    : 92,
              gap          : 1.25,
            }}
          >
            <Typography
              sx={{
                fontSize  : 15,
                lineHeight : 1.35,
                minHeight : 20,
                textAlign : 'center',
                color     : '#DDD',
              }}
              color="#DDD"
            >
              {loadingText || 'Preparing assets...'}
            </Typography>
            <Box
              sx={{
                display   : 'flex',
                alignItems: 'center',
                gap       : 1.25,
              }}
            >
              <LinearProgress
                variant={progress ? 'determinate' : 'indeterminate'}
                value={progress?.percent ?? 0}
                sx={{
                  flex           : 1,
                  height         : 8,
                  borderRadius   : 0,
                  backgroundColor: 'rgba(220, 209, 156, 0.17)',
                  border         : '1px solid rgba(220, 209, 156, 0.38)',
                  '& .MuiLinearProgress-bar': {
                    background:
                      'linear-gradient(90deg, #8f7d48 0%, #d8c88f 48%, #f0e1ad 100%)',
                  },
                }}
              />
              {progress && (
                <Typography
                  sx={{
                    width     : 42,
                    fontSize  : 12,
                    color     : 'rgba(238, 230, 188, 0.92)',
                    textAlign : 'right',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {Math.round(progress.percent)}%
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  ) : null;
};
