import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { writeEQFile } from 'sage-core/util/fileHandler';
import { useSettingsContext } from '../../context/settings';
import { useMainContext } from '../main/context';

const getConfig = () => {
  if (typeof window === 'undefined') {
    return { enabled: false, zones: [] };
  }
  const params = new URLSearchParams(window.location.search);
  const zones = (params.get('sageRaceArchiveZones') ?? '')
    .split(',')
    .map((zone) => zone.trim().toLowerCase())
    .filter(Boolean);
  const requestedReportName =
    params.get('sageRaceArchiveReport') ?? 'spire-race-archive-audit';
  const reportName = requestedReportName.replace(/[^a-z0-9_-]/gi, '-');
  return {
    enabled: zones.length > 0,
    reportName,
    zones: Array.from(new Set(zones)),
  };
};

export const RaceArchiveAudit = () => {
  const { gameController, rootFileSystemHandle } = useMainContext();
  const settings = useSettingsContext();
  const config = useMemo(getConfig, []);
  const startedRef = useRef(false);
  const [completed, setCompleted] = useState(0);
  const [failures, setFailures] = useState(0);
  const [status, setStatus] = useState('Waiting for the bootstrap zone');

  useEffect(() => {
    if (
      !config.enabled ||
      startedRef.current ||
      !gameController ||
      !rootFileSystemHandle
    ) {
      return;
    }

    const run = async () => {
      if (startedRef.current || !gameController.currentScene?.activeCamera) {
        return;
      }
      startedRef.current = true;
      const { processZone } = await import('../zone/processZone');
      const reports = [];

      const persist = async (complete = false) => {
        const payload = {
          complete,
          zoneCount: config.zones.length,
          processedCount: reports.length,
          failureCount: reports.filter((report) => !report.pass).length,
          reports,
          timestamp: new Date().toISOString(),
        };
        window.__spireSageRaceArchiveAudit = payload;
        await writeEQFile(
          'data',
          `${config.reportName}.json`,
          JSON.stringify(payload, null, 2)
        );
        setFailures(payload.failureCount);
      };

      for (const zone of config.zones) {
        const startedAt = performance.now();
        setStatus(`Processing ${zone}`);
        try {
          await processZone(
            zone,
            settings,
            rootFileSystemHandle,
            true,
            gameController,
            (stage, detail) => setStatus(detail ? `${stage}: ${detail}` : stage)
          );
          reports.push({
            zone,
            pass: true,
            elapsedMs: Math.round(performance.now() - startedAt),
          });
        } catch (error) {
          reports.push({
            zone,
            pass: false,
            error: error?.message ?? String(error),
            stack: error?.stack ?? null,
            elapsedMs: Math.round(performance.now() - startedAt),
          });
        }
        setCompleted(reports.length);
        await persist(false);
        await new Promise((resolve) => window.setTimeout(resolve, 0));
      }

      await persist(true);
      setStatus(`Archive pass complete (${reports.length} zones)`);
      window.dispatchEvent(
        new CustomEvent('spire-sage-race-archive-audit-complete', {
          detail: window.__spireSageRaceArchiveAudit,
        })
      );
    };

    const onZoneReady = () => void run();
    window.addEventListener('spire-sage-zone-validation-ready', onZoneReady);
    if (gameController.currentScene?.activeCamera) {
      void run();
    }
    return () => {
      window.removeEventListener('spire-sage-zone-validation-ready', onZoneReady);
    };
  }, [config.enabled, config.reportName, config.zones, gameController, rootFileSystemHandle, settings]);

  if (!config.enabled) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        left: 12,
        top: 12,
        zIndex: 2600,
        width: 360,
        border: '1px solid rgba(221, 208, 160, 0.7)',
        background: 'rgba(8, 12, 18, 0.92)',
        color: '#e8dcc0',
        padding: 1.25,
        pointerEvents: 'none',
      }}
    >
      <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
        Race Archive Coverage
      </Typography>
      <Typography sx={{ fontSize: 12 }}>{status}</Typography>
      <Typography sx={{ fontSize: 11 }}>
        {completed}/{config.zones.length} zones · {failures} archive failures
      </Typography>
    </Box>
  );
};
