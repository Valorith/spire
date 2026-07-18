import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import InfoIcon from '@mui/icons-material/Info';
import LinkOffIcon from '@mui/icons-material/LinkOff';

import { useMainContext } from '../main/context';
import * as keyval from 'idb-keyval';
import { useConfirm } from 'material-ui-confirm';
import { VERSION, expansions } from 'sage-core/model/constants';
import {
  deleteEqFolder,
  getEQFile,
  writeEQFile,
} from 'sage-core/util/fileHandler';
import { Flyout, FlyoutButton } from '../common/flyout';
import { AboutDialog } from './about-dialog';
import { assetUrl } from '../../embed-config';
const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const POPUP_Z_INDEX = 2600;
const MenuProps = {
  sx: {
    zIndex: POPUP_Z_INDEX,
  },
  slotProps: {
    root: {
      sx: {
        zIndex: POPUP_Z_INDEX,
      },
    },
  },
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      zIndex   : POPUP_Z_INDEX,
      width    : 250,
    },
  },
};
export const ZoneChooserDialog = ({ open }) => {
  const [_type, _setType] = useState('unknown');
  const {
    selectedZone,
    setSelectedZone,
    setZoneDialogOpen,
    setModelExporter,
    loadGameController,
    Spire,
    setZones,
    recentList,
    setRecentList,
    rootFileSystemHandle,
  } = useMainContext();
  const [zoneList, setZoneList] = useState([]);
  const [expansionFilter, setExpansionFilter] = useState([]);
  const [zone, setZone] = useState(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [enteringZone, setEnteringZone] = useState(false);
  const [enteringModelReview, setEnteringModelReview] = useState(false);

  const autocompleteRef = useRef(null);
  const previewAutoEnterRef = useRef(false);
  const filteredZoneList = useMemo(() => {
    if (expansionFilter.length === 0) {
      return zoneList;
    }
    return zoneList.filter((z) => {
      return expansionFilter.includes(z.expansion);
    });
  }, [zoneList, expansionFilter]);

  const handleExpansionFilterChange = (event) => {
    const {
      target: { value },
    } = event;
    setExpansionFilter(
      // On autofill we get a stringified value.
      typeof value === 'string' ? value.split(',') : value
    );
  };

  useEffect(() => {
    if (!rootFileSystemHandle) {
      return;
    }
    (async () => {
      const assetData = await getEQFile('data', 'version.json', 'json');
      if (assetData?.version === VERSION) {
        return;
      }
      console.log('Purging assets');
      await deleteEqFolder('data');
      await deleteEqFolder('items');
      await deleteEqFolder('models');
      await deleteEqFolder('objects');
      await deleteEqFolder('zones');
      await deleteEqFolder('textures');
      await writeEQFile(
        'data',
        'version.json',
        JSON.stringify({ version: VERSION })
      );
    })();
  }, [rootFileSystemHandle]);

  const selectAndExit = useCallback(
    async (zone, save = true) => {
      if (!zone?.short_name) {
        return;
      }
      setEnteringZone(true);
      try {
        if (save && !recentList.some((a) => a.short_name === zone.short_name)) {
          recentList.push(zone);
          localStorage.setItem('recent-zones', JSON.stringify(recentList));
        }
        setSelectedZone(zone);
        setZoneDialogOpen(false);
        void loadGameController().catch((error) => {
          console.error('[ZoneChooserDialog] failed to start zone editor controller load', error);
        });
      } finally {
        setEnteringZone(false);
      }
    },
    [loadGameController, setZoneDialogOpen, setSelectedZone, recentList]
  );

  useEffect(() => {
    const previewZoneName = window.__spireSagePreviewZone;
    if (
      !previewZoneName ||
      previewAutoEnterRef.current ||
      selectedZone ||
      enteringZone ||
      !zoneList.length
    ) {
      return;
    }

    const previewZone = zoneList.find((z) => z.short_name === previewZoneName);
    if (!previewZone) {
      return;
    }

    previewAutoEnterRef.current = true;
    void selectAndExit(previewZone);
  }, [enteringZone, selectedZone, selectAndExit, zoneList]);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        autocompleteRef.current?.querySelector('input')?.focus();
      }, 0);
      (async () => {
        if (Spire) {
          await Spire.Zones.getZones()
            .then((zones) => {
              if (!Array.isArray(zones)) {
                console.log('Error with spire zones', zones);
                throw new Error('Error with zones response');
              }
              setZoneList(zones);
            })
            .catch(async () => {
              await fetch(assetUrl('static/zoneData.json'))
                .then((r) => r.json())
                .then(setZoneList);
            });
        } else {
          await fetch(assetUrl('static/zoneData.json'))
            .then((r) => r.json())
            .then(setZoneList);
        }
      })();
    }
  }, [open, Spire, setZones]);

  useEffect(() => setZones(zoneList), [zoneList, setZones]);

  const confirm = useConfirm();

  const openModelReview = async () => {
    setEnteringModelReview(true);
    const url = new URL(window.location.href);
    url.searchParams.set('sageModelReview', '1');
    window.history.replaceState(null, '', url.toString());
    setModelExporter(true);
    setZoneDialogOpen(false);
    try {
      await loadGameController();
    } catch (error) {
      console.error('[ZoneChooserDialog] failed to start model review', error);
      setModelExporter(false);
      setZoneDialogOpen(true);
    } finally {
      setEnteringModelReview(false);
    }
  };

  const unlinkDir = () => {
    confirm({
      description: 'Are you sure you want to unlink your EQ directory?',
      title      : 'Unlink EQ Directory',
    })
      .then(() => {
        if (window.electronAPI && window.electronFS) {
          localStorage.removeItem('eqdir');
          window.location.reload();
        } else {
          keyval.del('eqdir').then(() => {
            window.location.reload();
          });
        }

      })
      .catch(() => {
        /* ... */
      });
  };

  return (
    <Box
      sx={{
        position      : 'fixed',
        inset         : 0,
        zIndex        : 2400,
        display       : open ? 'flex' : 'none',
        alignItems    : 'center',
        justifyContent: 'center',
        padding       : 3,
        background    : 'rgba(4, 6, 10, 0.35)',
        pointerEvents : 'auto',
      }}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <Box
        role="dialog"
        aria-modal="true"
        aria-labelledby="spire-zone-chooser-title"
        sx={{
          position      : 'relative',
          width         : '100%',
          maxWidth      : 520,
          minWidth      : 350,
          minHeight     : 240,
          border        : '1px solid rgba(221, 208, 160, 0.7)',
          background    : 'linear-gradient(180deg, rgba(17, 24, 34, 0.98), rgba(9, 13, 19, 0.98))',
          boxShadow     : '0 18px 48px rgba(0, 0, 0, 0.55)',
          borderRadius  : '6px',
          color         : '#e8dcc0',
          pointerEvents : 'auto',
          padding       : 2,
        }}
      >
        <Typography
          id="spire-zone-chooser-title"
          className="ui-dialog-title"
          sx={{ textAlign: 'center', marginBottom: 2 }}
        >
          EQ Sage: Zone Editor
        </Typography>
        <Flyout>
          <FlyoutButton
            onClick={() => setAboutOpen(true)}
            Icon={InfoIcon}
            title="About / Contact"
          />
          <FlyoutButton
            disabled={!!selectedZone}
            onClick={unlinkDir}
            Icon={LinkOffIcon}
            title="Unlink EQ Directory"
          />
        </Flyout>
        <AboutDialog open={aboutOpen} setOpen={setAboutOpen} />
        <Stack alignContent={'center'} alignItems={'center'} direction={'column'}>
          <FormControl
            size="small"
            sx={{ m: 1, width: 300, margin: '5px auto' }}
          >
            <InputLabel id="zone-filter-label">Expansion Filter</InputLabel>
            <Select
              labelId="zone-filter-label"
              id="zone-filter"
              name="expansionFilter"
              fullWidth={false}
              multiple
              value={expansionFilter}
              onChange={handleExpansionFilterChange}
              inputProps={{ 'aria-label': 'Expansion Filter' }}
              input={
                <OutlinedInput
                  label="Expansion Filter"
                  inputProps={{
                    'aria-label': 'Expansion Filter',
                    name        : 'expansionFilter',
                  }}
                />
              }
              renderValue={(selected) =>
                selected.length === 0
                  ? 'None'
                  : selected.map((a) => expansions[a]).join(', ')
              }
              MenuProps={MenuProps}
            >
              {expansions.map((name, idx) => (
                <MenuItem key={name} value={idx}>
                  <Checkbox checked={expansionFilter.includes(idx)} />
                  <ListItemText primary={name} />
                </MenuItem>
              ))}
            </Select>

            <Autocomplete
              ref={autocompleteRef}
              size="small"
              freeSolo
              sx={{ margin: '15px 0' }}
              slotProps={{
                popper: {
                  sx: {
                    zIndex: POPUP_Z_INDEX,
                  },
                },
              }}
              id="combo-box-demo"
              isOptionEqualToValue={(option, value) => option.key === value.key}
              noOptionsText={'Enter Custom File and Press Return'}
              onChange={async (e, values) => {
                if (!values) {
                  return;
                }
                if (typeof values === 'string') {
                    await selectAndExit({
                      short_name: e.target.value,
                      id        : -1,
                      long_name : e.target.value,
                    }, false);
                } else {
                  if (e.key === 'Enter') {
                    await selectAndExit(values.zone, true);
                  }
                  setZone(values.zone);
                }

              }}
              renderOption={(props, option) => {
                return (
                  <li {...props} key={option.key}>
                    {option.label}
                  </li>
                );
              }}
              options={filteredZoneList.map((zone, idx) => {
                return {
                  label: `${zone.long_name} - ${zone.short_name} ${
                    zone.version > 0 ? `[v${zone.version}]` : ''
                  }`.trim(),
                  id  : idx,
                  key : `${zone.id}-${zone.zoneidnumber}`,
                  zone,
                };
              })}
              //  sx={{ width: 300 }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Zone"
                  inputProps={{
                    ...params.inputProps,
                    'aria-label': 'Zone',
                    name        : 'zone',
                  }}
                />
              )}
            />
          </FormControl>
          <FormControl sx={{ maxWidth: '400px' }}>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {!recentList.length && (
                <Typography
                  sx={{ fontSize: '15px', margin: '5px auto' }}
                  color="text.secondary"
                  gutterBottom
                >
                  No recent zones. Select a zone to get started!
                </Typography>
              )}
              {recentList.map((zone) => (
                <Chip
                  key={`chip-${zone.id}`}
                  label={`${zone.long_name} ${
                    zone.version > 0 ? `[v${zone.version}]` : ''
                  }`.trim()}
                  variant="outlined"
                  onClick={() => {
                    void selectAndExit(zone);
                  }}
                  onDelete={() => {
                    setRecentList((l) => l.filter((z) => z.id !== zone.id));
                  }}
                />
              ))}
            </Stack>
          </FormControl>
        </Stack>
        <Stack direction={'column'}>
          <Button
            color="primary"
            onClick={() => {
              void selectAndExit(zone);
            }}
            disabled={!zone || enteringZone}
            variant="outlined"
            sx={{ margin: '5px auto' }}
          >
            {enteringZone ? 'Preparing Zone Editor...' : 'Enter Zone Editor'}
          </Button>
          <Button
            color="primary"
            onClick={() => void openModelReview()}
            disabled={enteringZone || enteringModelReview}
            variant="text"
            sx={{ margin: '2px auto 0', fontSize: '13px' }}
          >
            {enteringModelReview ? 'Preparing Model Review…' : 'Open Model Review'}
          </Button>
        </Stack>
      </Box>
    </Box>

  );
};
