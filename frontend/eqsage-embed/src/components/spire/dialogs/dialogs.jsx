import React, { Suspense } from 'react';
import { useOverlayContext } from '../provider';

const SettingsDialog = React.lazy(() =>
  import('./settings-dialog').then((module) => ({ default: module.SettingsDialog }))
);
const ZoneDialog = React.lazy(() =>
  import('./zone-dialog').then((module) => ({ default: module.ZoneDialog }))
);
const NpcDialog = React.lazy(() =>
  import('./npc-dialog').then((module) => ({ default: module.NpcDialog }))
);
const QuestDialog = React.lazy(() =>
  import('./quest-dialog').then((module) => ({ default: module.QuestDialog }))
);

export const OverlayDialogs = () => {
  const { dialogState, closeDialogs } = useOverlayContext();
  return (
    <Suspense fallback={null}>
      {dialogState['settings'] && <SettingsDialog onClose={closeDialogs} />}
      {dialogState['zone'] && <ZoneDialog onClose={closeDialogs} />}
      {dialogState['quests'] && (
        <QuestDialog onClose={closeDialogs} open={dialogState['quests']} />
      )}
      {dialogState['npc'] && (
        <NpcDialog onClose={closeDialogs} />
      )}
    </Suspense>
  );
};
