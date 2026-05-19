import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { writeEQFile } from 'sage-core/util/fileHandler';
import { useMainContext } from '../main/context';

const DEFAULT_ZONE_SEQUENCE = [
  'blackburrow',
  'befallen',
  'fieldofbone',
  'kaesora',
  'iceclad',
  'greatdivide',
];

const parseValidationConfig = () => {
  if (typeof window === 'undefined') {
    return { enabled: false, zones: DEFAULT_ZONE_SEQUENCE };
  }
  const params = new URLSearchParams(window.location.search);
  const zoneParam = params.get('sageValidateZones') || params.get('sageValidationZones');
  const zones = zoneParam
    ? zoneParam.split(',').map((zone) => zone.trim()).filter(Boolean)
    : DEFAULT_ZONE_SEQUENCE;
  return {
    enabled: params.has('sageValidation') || params.has('sageValidateZones'),
    zones: zones.length ? zones : DEFAULT_ZONE_SEQUENCE,
  };
};

export const SageValidationHarness = () => {
  const {
    selectedZone,
    setSelectedZone,
    setZoneDialogOpen,
    zones,
    loadGameController,
  } = useMainContext();
  const config = useMemo(parseValidationConfig, []);
  const [reports, setReports] = useState([]);
  const [status, setStatus] = useState('Waiting for zone list');
  const visitedRef = useRef(new Set());
  const reportsRef = useRef([]);
  const selectingRef = useRef(false);
  const selectedZoneRef = useRef(null);
  const startedRef = useRef(false);

  useEffect(() => {
    selectedZoneRef.current = selectedZone?.short_name ?? null;
  }, [selectedZone]);

  const persistReports = useCallback(
    (nextReports, nextStatus) => {
      const failures = nextReports.filter((report) => !report.pass?.all);
      const payload = {
        config,
        complete: nextReports.length >= config.zones.length && failures.length === 0,
        failureCount: failures.length,
        failures: failures.map((report) => ({
          zone: report.zone,
          pass: report.pass,
          spawns: report.spawns,
          doors : report.doors,
          movement: report.movement,
          canvas: report.canvas,
          visuals: report.visuals,
        })),
        status: nextStatus,
        reports: nextReports,
        timestamp: new Date().toISOString(),
      };
      window.__spireSageValidationSummary = payload;
      void writeEQFile(
        'data',
        'spire-validation-report.json',
        JSON.stringify(payload, null, 2)
      ).catch((error) => {
        console.warn('[SageValidation] failed to persist report', error);
      });
    },
    [config]
  );

  useEffect(() => {
    if (!config.enabled) {
      return;
    }
    persistReports([], 'Validation enabled; waiting for zone list');
  }, [config.enabled, persistReports]);

  const selectZone = useCallback(
    (zoneName) => {
      if (!config.enabled || selectingRef.current) {
        return;
      }
      const nextZone = zones.find((zone) => zone.short_name === zoneName);
      if (!nextZone) {
        const nextStatus = `Missing zone metadata for ${zoneName}`;
        setStatus(nextStatus);
        persistReports(reportsRef.current, nextStatus);
        return;
      }
      selectingRef.current = true;
      const nextStatus = `Loading ${nextZone.long_name ?? nextZone.short_name}`;
      setStatus(nextStatus);
      persistReports(reportsRef.current, nextStatus);
      setZoneDialogOpen(false);
      setSelectedZone(nextZone);
      void loadGameController()
        .catch((error) => {
          const failureStatus = `Controller load failed: ${error?.message ?? error}`;
          setStatus(failureStatus);
          persistReports(reportsRef.current, failureStatus);
        })
        .finally(() => {
          window.setTimeout(() => {
            selectingRef.current = false;
          }, 250);
        });
    },
    [
      config.enabled,
      loadGameController,
      persistReports,
      setSelectedZone,
      setZoneDialogOpen,
      zones,
    ]
  );

  useEffect(() => {
    if (!config.enabled) {
      return;
    }
    window.__spireSageValidationConfig = config;
  }, [config]);

  useEffect(() => {
    if (!config.enabled || !zones.length || startedRef.current) {
      return;
    }
    startedRef.current = true;
    if (selectedZone?.short_name !== config.zones[0]) {
      selectZone(config.zones[0]);
    }
  }, [config.enabled, config.zones, selectedZone, selectZone, zones.length]);

  useEffect(() => {
    if (!config.enabled) {
      return;
    }

    const onZoneReady = (event) => {
      const report = event.detail;
      if (!report?.zone || visitedRef.current.has(report.zone)) {
        return;
      }
      visitedRef.current.add(report.zone);
      const nextReports = [...reportsRef.current, report];
      reportsRef.current = nextReports;
      setReports(nextReports);

      const currentIndex = config.zones.indexOf(report.zone);
      const laterZones = currentIndex >= 0
        ? config.zones.slice(currentIndex + 1)
        : config.zones;
      const nextZone = laterZones.find((zone) => !visitedRef.current.has(zone))
        ?? config.zones.find((zone) => !visitedRef.current.has(zone));
      if (!nextZone) {
        const completeStatus = `Validation complete (${visitedRef.current.size} zones)`;
        setStatus(completeStatus);
        persistReports(nextReports, completeStatus);
        return;
      }

      const nextStatus = `Validated ${report.zone}; loading ${nextZone}`;
      setStatus(nextStatus);
      persistReports(nextReports, nextStatus);
      window.setTimeout(() => {
        if (selectedZoneRef.current !== nextZone) {
          selectZone(nextZone);
        }
      }, 1200);
    };

    window.addEventListener('spire-sage-zone-validation-ready', onZoneReady);
    return () => {
      window.removeEventListener('spire-sage-zone-validation-ready', onZoneReady);
    };
  }, [config.enabled, config.zones, persistReports, selectZone]);

  if (!config.enabled) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        right: 12,
        bottom: 12,
        zIndex: 2600,
        width: 360,
        maxHeight: '45vh',
        overflow: 'hidden',
        border: '1px solid rgba(221, 208, 160, 0.7)',
        background: 'rgba(8, 12, 18, 0.92)',
        color: '#e8dcc0',
        padding: 1.25,
        pointerEvents: 'none',
      }}
    >
      <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
        Sage Validation
      </Typography>
      <Typography sx={{ fontSize: 12, marginBottom: 0.5 }}>
        {status}
      </Typography>
      {reports.slice(-6).map((report) => (
        <Typography
          key={`${report.zone}-${report.timestamp}`}
          sx={{ fontSize: 11, lineHeight: 1.35 }}
        >
          {report.pass?.all ? 'PASS' : 'FAIL'} {report.zone}: spawns {report.spawns?.loaded ?? 0}/
          {report.spawns?.requested ?? report.requestedSpawns}, roots{' '}
          {report.rootNodeCount}, proxies {report.lodProxyCount}, fallback{' '}
          {report.spawns?.fallbackCount ?? 0}, tex{' '}
          {report.visuals?.readyTextureCount ?? 0}/
          {report.visuals?.texturedSlotCount ?? 0}, texFallback{' '}
          {report.visuals?.fallbackTextureCount ?? 0}, anim{' '}
          {report.visuals?.animatedSkeletonSpawnCount ?? 0}/
          {report.visuals?.skeletonSpawnCount ?? 0}, doors{' '}
          {report.doors?.loaded ?? 0}/{report.doors?.visibleRequested ?? report.doors?.requested ?? 0}
          {report.doors?.hidden ? ` (${report.doors.hidden} hidden)` : ''}, doorTex{' '}
          {report.doors?.visuals?.readyTextureCount ?? 0}/
          {report.doors?.visuals?.texturedSlotCount ?? 0}, doorFallback{' '}
          {report.doors?.visuals?.fallbackTextureCount ?? 0}, ground{' '}
          {report.visuals?.belowGroundSpawnCount ?? 0}/
          {report.visuals?.aboveGroundSpawnCount ?? 0}, move{' '}
          {report.movement?.distance?.toFixed?.(1) ?? 'n/a'}
        </Typography>
      ))}
    </Box>
  );
};
