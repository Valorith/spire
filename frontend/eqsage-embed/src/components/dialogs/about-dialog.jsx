import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import YouTubeIcon from '@mui/icons-material/YouTube';
import CodeIcon from '@mui/icons-material/Code';
import { DiscordIcon } from '../common/icons/discord';

import './about-dialog.scss';

const Link = ({ Icon, text, link }) => (
  <Stack className="hover-link" direction="row">
    <Icon />
    <Typography
      onClick={() => window.open(link, '_blank')}
      sx={{ marginLeft: '10px', userSelect: 'none', fontSize: '15px' }}
      gutterBottom
    >
      {text}
    </Typography>
  </Stack>
);

export const AboutDialog = ({ open, setOpen }) => {
  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      open={open}
      onClose={() => setOpen(false)}
      aria-labelledby="draggable-dialog-title"
    >
      <DialogTitle
        style={{ margin: '0 auto' }}
        id="draggable-dialog-title"
      >
        About the Spire Zone Editor
      </DialogTitle>
      <DialogContent className='about-content'>
        <div>
          <Stack
            alignContent="center"
            justifyContent="space-between"
            direction="row"
            spacing={1}
          ></Stack>

          <Typography
            sx={{ fontSize: 17, marginBottom: 2 }}
            color="text.secondary"
            gutterBottom
          >
            The Spire zone editor interacts with local EverQuest files to
            decode and preview zones directly inside Spire. This embedded
            editor is maintained as part of the Spire codebase.
          </Typography>
          <Typography
            sx={{ fontSize: 17, marginBottom: 2 }}
            color="text.secondary"
            gutterBottom
          >
            Here are some useful project and community links:
          </Typography>

          <Link
            Icon={GitHubIcon}
            text="Spire GitHub"
            link="https://github.com/Valorith/spire"
          />
          <Link
            Icon={DiscordIcon}
            text="EQEmu Discord (in channel #project-requiem)"
            link="https://discord.gg/785p886eCw"
          />
          <Link
            Icon={YouTubeIcon}
            text="Spire Repository"
            link="https://github.com/Valorith/spire"
          />
          <Link
            Icon={CodeIcon}
            text="EQ Advanced Maps"
            link="https://eqmap.vercel.app"
          />
          <Link
            Icon={CodeIcon}
            text="EQ: Requiem"
            link="https://eqrequiem.com"
          />
     
          <Typography
            sx={{ fontSize: 17, marginBottom: 2 }}
            color="text.secondary"
            gutterBottom
          >
            Feedback and implementation details now live with Spire itself, so
            repository issues and pull requests should be filed there.
          </Typography>
          <Typography
            sx={{ fontSize: 17, marginBottom: 2 }}
            color="text.secondary"
            gutterBottom
          >
            This embed keeps the native file-access and zone-processing
            workflow, but it no longer depends on the standalone Sage site or
            repository.
          </Typography>
        </div>
      </DialogContent>
      <DialogActions disableSpacing sx={{ margin: '0 auto' }}>
        <Button
          sx={{ color: 'white' }}
          autoFocus
          onClick={() => setOpen(false)}
        >
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};
