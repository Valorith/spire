import React, { useEffect, useMemo, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import BABYLON from '@bjs';

import { gameController } from '../../../viewer/controllers/GameController';

const { Tools } = BABYLON;

const initialOffset = {
  left: 46,
  top : 46,
};

function getCardinalDirection(camera) {
  const forward = camera.getForwardRay().direction;
  const angle = Math.atan2(forward.x, forward.z);
  const degrees = Tools.ToDegrees(angle);

  if (degrees < 0) {
    return (degrees + 360) % 360;
  }

  return degrees % 360;
}

export const Compass = ({ forceOpen = false }) => {
  const [degrees, setDegrees] = useState(0);
  const [open, setOpen] = useState(true);
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 });
  useEffect(() => {
    const interval = setInterval(() => {
      if (document?.querySelector('.nav-bg-open')) {
        setOpen(false);
        return;
      }
      if (!gameController.CameraController?.camera) {
        return;
      }
      setOpen(true);
      const cam = gameController.CameraController.camera;
      const camDegrees = getCardinalDirection(cam);

      window.deg = camDegrees;
      setDegrees(camDegrees);
      const x = cam.position.x.toFixed(1);
      const y = cam.position.z.toFixed(1);
      const z = cam.position.y.toFixed(1);

      setPosition((p) => {
        if (p.x === x && p.y === y && p.z === z) {
          return p;
        }
        return { x, y, z };
      });
    }, 250);
    return () => {
      clearInterval(interval);
    };
  }, []);

  const compassPosition = useMemo(() => {
    const radians = (degrees * Math.PI) / 180;
    const radius = 32;
    const offset = { ...initialOffset };
    offset.left += radius * Math.sin(radians);
    offset.top -= radius * Math.cos(radians);

    return offset;
  }, [degrees]);
  return !open && !forceOpen ? null : (
    <Box
      sx={{
        position     : 'fixed',
        right        : '20px',
        top          : '10px',
        zIndex       : 10,
        pointerEvents: 'none',
        width        : 112,
      }}
    >
      <Box
        aria-label="Compass"
        sx={{
          position       : 'relative',
          width          : 100,
          height         : 100,
          margin         : '0 auto',
          borderRadius   : '50%',
          border         : '1px solid rgba(224, 204, 137, 0.95)',
          background     : 'radial-gradient(circle at center, rgba(24, 31, 37, 0.96) 0 32%, rgba(6, 9, 12, 0.95) 33% 100%)',
          boxShadow      : '0 0 0 2px rgba(0, 0, 0, 0.65), inset 0 0 16px rgba(225, 197, 106, 0.2)',
          color          : '#f0dfac',
          fontFamily     : 'Georgia, serif',
          userSelect     : 'none',
        }}
      >
        {[
          ['N', '50%', 5, 'translateX(-50%)'],
          ['E', 'calc(100% - 13px)', '50%', 'translateY(-50%)'],
          ['S', '50%', 'calc(100% - 17px)', 'translateX(-50%)'],
          ['W', 10, '50%', 'translateY(-50%)'],
        ].map(([label, left, top, transform]) => (
          <Typography
            key={label}
            component="span"
            sx={{
              position     : 'absolute',
              left,
              top,
              transform,
              color        : label === 'N' ? '#f5d36a' : '#d8c78a',
              fontSize     : 13,
              lineHeight   : 1,
              letterSpacing: 0,
              textShadow   : '0 1px 2px #000',
            }}
          >
            {label}
          </Typography>
        ))}
        <Box
          sx={{
            position       : 'absolute',
            left           : 50,
            top            : 50,
            width          : 2,
            height         : 36,
            transform      : `translate(-50%, -100%) rotate(${degrees}deg)`,
            transformOrigin: '50% 100%',
            background     : 'linear-gradient(180deg, #f7d86f, #bd6d35)',
            boxShadow      : '0 0 6px rgba(247, 216, 111, 0.85)',
            borderRadius   : 2,
          }}
        />
        <Box
          sx={{
            position     : 'absolute',
            left         : `${compassPosition.left}px`,
            top          : `${compassPosition.top}px`,
            width        : 8,
            height       : 8,
            borderRadius : '50%',
            background   : '#fff7c8',
            boxShadow    : '0 0 8px rgba(255, 236, 150, 0.95), 0 0 0 1px rgba(0, 0, 0, 0.75)',
          }}
        />
      </Box>
      <Stack
        direction="column"
        sx={{
          width          : 92,
          margin         : '6px auto 0',
          padding        : '4px 7px',
          border         : '1px solid rgba(224, 204, 137, 0.35)',
          background     : 'rgba(7, 10, 13, 0.72)',
          color          : '#f3ead4',
          fontFamily     : 'Consolas, monospace',
          fontSize       : 12,
          lineHeight     : 1.25,
          textAlign      : 'left',
          boxShadow      : '0 2px 8px rgba(0, 0, 0, 0.35)',
        }}
      >
        <Typography component="span" sx={{ color: 'inherit', font: 'inherit', letterSpacing: 0 }}>
          X: {position.y}
        </Typography>
        <Typography component="span" sx={{ color: 'inherit', font: 'inherit', letterSpacing: 0 }}>
          Y: {position.x}
        </Typography>
        <Typography component="span" sx={{ color: 'inherit', font: 'inherit', letterSpacing: 0 }}>
          Z: {position.z}
        </Typography>
      </Stack>
    </Box>
  );
};
