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

const parsePositiveInteger = (value, fallback = 1) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.trunc(parsed) : fallback;
};

const sanitizeReportName = (value) =>
  `${value || 'spire-validation-report'}`.replace(/[^a-z0-9_-]/gi, '-');

const parseValidationConfig = () => {
  if (typeof window === 'undefined') {
    return {
      enabled: false,
      zones: DEFAULT_ZONE_SEQUENCE,
      cycles: 1,
      sequence: DEFAULT_ZONE_SEQUENCE.map((zone, index) => ({
        zone,
        cycle: 1,
        index,
      })),
      expectedReports: DEFAULT_ZONE_SEQUENCE.length,
      persistToEq: true,
      reportName: 'spire-validation-report',
    };
  }
  const params = new URLSearchParams(window.location.search);
  const zoneParam = params.get('sageValidateZones') || params.get('sageValidationZones');
  const zones = zoneParam
    ? zoneParam.split(',').map((zone) => zone.trim()).filter(Boolean)
    : DEFAULT_ZONE_SEQUENCE;
  const normalizedZones = zones.length ? zones : DEFAULT_ZONE_SEQUENCE;
  const cycles = parsePositiveInteger(params.get('sageValidationCycles'), 1);
  const sequence = Array.from({ length: cycles }, (_, cycleIndex) =>
    normalizedZones.map((zone, zoneIndex) => ({
      zone,
      cycle: cycleIndex + 1,
      index: cycleIndex * normalizedZones.length + zoneIndex,
    }))
  ).flat();
  return {
    enabled: params.has('sageValidation') || params.has('sageValidateZones'),
    zones: normalizedZones,
    cycles,
    sequence,
    expectedReports: sequence.length,
    persistToEq: params.get('sageValidationPersist') !== '0',
    reportName: sanitizeReportName(params.get('sageValidationReport')),
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
  const sequenceIndexRef = useRef(0);
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
      const finished = nextReports.length >= config.expectedReports;
      const payload = {
        config,
        finished,
        complete: finished && failures.length === 0,
        failureCount: failures.length,
        failures: failures.map((report) => ({
          zone: report.zone,
          pass: report.pass,
          spawns: report.spawns,
          doors : report.doors,
          movement: report.movement,
          canvas: report.canvas,
          visuals: report.visuals,
          runtimeMemory: report.runtimeMemory,
          sceneResources: report.sceneResources,
          loadError: report.loadError,
        })),
        status: nextStatus,
        reports: nextReports,
        timestamp: new Date().toISOString(),
      };
      window.__spireSageValidationSummary = payload;
      if (config.persistToEq) {
        void writeEQFile(
          'data',
          `${config.reportName}.json`,
          JSON.stringify(payload, null, 2)
        ).catch((error) => {
          console.warn('[SageValidation] failed to persist report', error);
        });
      }
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
      const commitSelection = () => {
        selectedZoneRef.current = nextZone.short_name;
        // Clearing the current zone briefly causes MainProvider to reopen the
        // chooser; close it again before remounting the validation viewer.
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
      };
      if (selectedZoneRef.current === zoneName) {
        // React ignores setting the same zone object again. Explicitly unmount
        // the viewer before a same-zone validation cycle so cleanup, scene
        // disposal, filesystem reads, and texture decoding are all exercised.
        selectedZoneRef.current = null;
        setSelectedZone(null);
        window.setTimeout(commitSelection, 50);
      } else {
        commitSelection();
      }
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
    const firstZone = config.sequence[0]?.zone;
    if (firstZone && selectedZone?.short_name !== firstZone) {
      selectZone(firstZone);
    }
  }, [config.enabled, config.sequence, selectedZone, selectZone, zones.length]);

  useEffect(() => {
    if (!config.enabled) {
      return;
    }

    const onZoneReady = (event) => {
      const report = event.detail;
      const expected = config.sequence[sequenceIndexRef.current];
      if (!report?.zone || !expected || report.zone !== expected.zone) {
        return;
      }
      const sequencedReport = {
        ...report,
        validationSequence: expected,
      };
      sequenceIndexRef.current += 1;
      const nextReports = [...reportsRef.current, sequencedReport];
      reportsRef.current = nextReports;
      setReports(nextReports);

      const nextEntry = config.sequence[sequenceIndexRef.current];
      if (!nextEntry) {
        const completeStatus = config.cycles > 1
          ? `Validation complete (${nextReports.length} runs; ${config.zones.length} zones x ${config.cycles} cycles)`
          : `Validation complete (${config.zones.length} zones)`;
        setStatus(completeStatus);
        persistReports(nextReports, completeStatus);
        return;
      }

      const nextZone = nextEntry.zone;
      const nextStatus = `Validated ${report.zone} (cycle ${expected.cycle}); loading ${nextZone}`;
      setStatus(nextStatus);
      persistReports(nextReports, nextStatus);
      window.setTimeout(() => {
        selectZone(nextZone);
      }, 1200);
    };

    const onZoneError = (event) => {
      const detail = event.detail;
      if (!detail?.zone) {
        return;
      }
      const report = {
        zone: detail.zone,
        longName: detail.longName ?? detail.zone,
        loadError: {
          message: detail.error ?? 'Unknown zone load failure',
          stack: detail.stack ?? null,
        },
        pass: {
          canvas: false,
          movement: false,
          spawns: false,
          textures: false,
          animations: false,
          boundary: false,
          geometry: false,
          doors: false,
          all: false,
        },
        timestamp: detail.timestamp ?? new Date().toISOString(),
      };
      onZoneReady({ detail: report });
    };

    window.addEventListener('spire-sage-zone-validation-ready', onZoneReady);
    window.addEventListener('spire-sage-zone-validation-error', onZoneError);
    return () => {
      window.removeEventListener('spire-sage-zone-validation-ready', onZoneReady);
      window.removeEventListener('spire-sage-zone-validation-error', onZoneError);
    };
  }, [config.cycles, config.enabled, config.sequence, config.zones.length, persistReports, selectZone]);

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
          key={`${report.validationSequence?.index ?? report.timestamp}-${report.zone}`}
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
          {report.visuals?.skeletonSpawnCount ?? 0}, motion{' '}
          {report.visuals?.runtimeAnimation?.movingSpawnCount ?? 0}/
          {report.visuals?.runtimeAnimation?.probedSpawnCount ?? 0}, retarget{' '}
          {report.visuals?.unresolvedAnimationTargetCount ?? 0} unresolved, doors{' '}
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
