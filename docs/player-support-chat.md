# Player Support

![Player Support: queue summary, petition queue, case timeline and character tools](images/player-support/overview.png)

Player Support is the petition inbox under **Server Admin → Player Support**. Staff work each petition as a case: notes, tells, mail and parcels, character and corpse recovery, and the GM tools described below. Every action is recorded on the case timeline with the staff member's name.

The inbox uses the local EQEmu World roster for account presence. **Online** includes another character on the petition's account and a player at character select. **Unknown** means Spire could not verify presence for the selected server. Messaging is per account: Spire sends tells to whichever character on the petition's account is in a zone with tells on, and the case header shows **On <character>** when that is not the character that filed the petition.

On a phone, the queue and the open case show one at a time; **Petitions** goes back to the queue.

![Player Support on a phone: the queue summary and petition queue](images/player-support/phone.png)

Some tools need the companion EQEmu patch, and some need its updated revision. Everything else works on stock EQEmu. [What each server gets](#what-each-server-gets) lists them.

## Without the companion patch

Player Support works on a stock EQEmu World. Spire checks the local World for the patch and turns off what needs it, with a note at the top of the page:

| Works on stock EQEmu | Needs the patch |
|---|---|
| The queue, case workflow and notes, mail and parcel delivery, corpse inspection, presence, and every tool marked "stock" in [What each server gets](#what-each-server-gets) | Live chat and in-game replies, character and corpse moves, move and parcel notices in game, and the `#petition` command and menu |

- **Live chat** shows the conversation history. A message to a player with no character in game is still mailed. **Player replies** cannot be turned on, because the player can't reply in game. When the player is in game, Live chat says tells need the patch and points to **Reply by mail**.
- **Move character** is unavailable, and the recovery window explains why. Corpses can still be inspected.
- A World with an older revision of the patch keeps moves and notices, and turns off Live chat until World and zones are rebuilt with the current patch.

Spire rechecks World about every 30 seconds while the patch is missing, so the tools come back on their own after World restarts with it.

## Enable live tells

![Live chat on a case: the conversation with the player, quick replies and the message field](images/player-support/live-chat.png)

1. Apply [the EQEmu companion patch](player-support-eqemu.patch) in your EQEmu server checkout with `git apply player-support-eqemu.patch`. The patch applies cleanly, and World and zone build with it, on both of these:
   - [Valorith/Server `master` at dc15939](https://github.com/Valorith/Server/commit/dc1593967a7e929dfa6a503de341f6d1ab60028d)
   - [EQEmu/EQEmu `master` at 4aceae18](https://github.com/EQEmu/EQEmu/commit/4aceae18b94ffaafc08e2b17bc41cd72c77f795d)

   It only calls APIs that both trees share. For example, it starts transactions with a plain `START TRANSACTION` query because `TransactionBegin()` returns a result in Valorith/Server but `void` upstream.
2. Build and install the patched World and zone binaries on your test installation. Keep the World console reachable from Spire on IPv4 loopback. Spire reads its port from `server.world.telnet` in `eqemu_config.json`.
3. Open **Server Admin → Player Support** and select a petition. Send a tell from **Live chat**, and use **Turn on replies** when you want the player's answers on the case. In EverQuest, the player can answer with `#petition <message>`, `/reply <message>` after a Game Master tell, or `/tell *GameMaster <message>`.

**Player replies** decides only whether the player's answers are accepted onto the case. It never limits what staff send: with write access, the message box works on any open case whatever the setting, as a tell when the player is in game and by mail when nobody on the account is. Sending does not turn replies on or off. **Turn on replies** works while the player is offline too; it needs the current patch on the server Spire runs beside, and an older patch never turns replies on. While replies are off, the message box says so: the player can read your messages, and if they answer, the game tells them "Your message was not sent. Replies to Game Master are not open on your petition right now; a Game Master will open them when they need your answer." Nothing is recorded on the case.

With the updated patch, a message World delivers as a tell is also shown to that character as a yellow on-screen marquee, "Game Master: <message>", for 6 to 15 seconds depending on its length. The marquee is cut to 120 characters and ends in "..."; the tell always has the full message, and Live chat says so while a draft is longer than the marquee. Mail, account action notices and replies World turns away get no marquee. Live chat mentions the marquee only when World reports the `marquee` feature.

Turning **Player replies** on or off is recorded on the case timeline with the staff member's name. When you resolve a case you can add an optional resolution summary, which is shown on the timeline next to the status change.

Spire grants chat actions through Player Support write access. The patch reserves `GameMaster` and `*GameMaster` as tell destinations. A reply is recorded and acknowledged when it comes from any character on the petitioning account, the in-game petition is active, and **Player replies** is on for that case. Every tell, in either direction, lands in the same conversation, labelled with the character that sent or received it and marked **alt** when that is not the character that filed the petition. Players receive a private reason if they have no active petition or **Player replies** is off. Turning off **Player replies** or resolving the case preserves the transcript.

When no character on the petition's account is in game, a message sent from **Live chat** is mailed to the character that filed the petition instead, from GameMaster with the subject "Response to your petition". The mail reads "This message was sent to you in response to your petition while you were offline: " followed by the message. It is kept in the same conversation, marked **Sent by mail** with a mail icon. A player who is in game with tells turned off is not mailed; Live chat explains that tells are off.

Spire and the patched World use console protocol version 2 to confirm replies. If you installed an earlier revision of the patch, rebuild World and zone with the current patch before updating Spire. World holds up to three unconfirmed replies per character; a player who sends more before Spire confirms them is asked to try again.

The patched World also refreshes the parcel window and shows the native arrival notice for online recipients when Spire sends a parcel to the local server. Parcels are committed before World is notified. Players can collect queued parcels from a parcel merchant when they next open the window.

Test an account with its petitioning character offline and an alternate online. The queue should show **Online**, the case header **On <alternate>**, and tells should reach the alternate and appear in the same conversation. Also test that reconnecting World restores replies on a petition with **Player replies** on and that switching to an unrelated database connection shows **Unknown** for presence.

## Filing petitions with #petition

The patch adds a `#petition` command for players. Petitions are one per account, and any character on the account can use the command.

- `#petition` with no message shows the petition menu: each open petition on the account with its number, the character that filed it, how long ago, its status, a **Replies** line from Spire's **Player replies** setting ("On - reply with #petition [message]" or "Off - a Game Master will open them when they need your answer"), and a preview of the request. Saylinks refresh the menu, explain how to add a message, and withdraw the petition after a confirmation.
- `#petition <message>` files a petition when the account has none. It creates the same petition as the client's own petition window (`/guidehelp`), so it appears in Player Support right away.
- While the account has an open petition, `#petition <message>` adds to it. The text goes to Game Master like a tell. Spire records it on the case when **Player replies** is on, and otherwise tells the player why it could not.

The menu's status comes from Spire when Spire tracks the case: waiting for a Game Master, assigned to a staff member, waiting for the player's reply, or resolved. Spire stores it in the `spire:petition:<petition>` data bucket whenever the case or its **Player replies** setting changes. Without it, the menu shows the in-game queue state. A petition checked out in game shows who is reviewing it.

The menu's links use `#petition reply` and `#petition withdraw <number> [confirm]`; those exact phrases are actions, not messages. Server operators can rename or restrict the command in the `command_settings` table like any other command.

## Character and corpse recovery

![Moving a character to exact coordinates, with the reason recorded on the case](images/player-support/move-coordinates.png)

Open **Move character** or **Corpses** from a petition. Player Operations read access lets staff inspect locations and loot. A move requires write access to both Player Support and Player Operations, an open or waiting case, and a reason recorded in the petition timeline.

Recovery uses the same companion patch and loopback World console. Online characters and loaded corpses also require the source zone's TCP WebSocket listener to be reachable on IPv4 loopback from Spire. Corpses go to a base zone's safe point or to the player.

A character can be moved to a base zone's safe point, to exact coordinates in a base zone, or to another character's location. **Current zone** (its safe point) and **Bind point** are one-click destinations. Choose **Coordinates** to enter X, Y, Z and a heading (0–511). You can paste the output of `/loc`, which lists Y, X, Z, and Spire puts the values in the right fields. Choose **Player** to search for any character. Spire uses that character's live position when they are in game and their last saved position otherwise. Moves into instances are not supported, so a character inside an instance cannot be used as the destination.

A cross-zone character receipt confirms that the zone requested the move. If a receipt is unconfirmed, refresh the target's location before trying again.

For a corpse, choose **Player's current location** to use the petitioning character's live coordinates and instance. The character must be in game. The destination zone sends a chat notice when it confirms the corpse arrived.

Buried corpses can always be inspected. With the updated patch, a buried corpse can also be moved: it shows **Buried · will be unburied**, and the move clears its buried flag and restarts the corpse's decay timer. A buried corpse that is not loaded in any zone (Shadowrest) is moved in the database. Without the updated patch, only unburied corpses can be moved, and the recovery window says why.

Spire character moves send **You have been moved by a Game Master**. If Spire relocates a saved character, the patched zone displays the notice when the player next enters the game.

### Restore experience from a corpse

![A corpse with its experience, and the reason form for returning it](images/player-support/corpse-experience.png)

The corpse details show the experience the corpse holds. **Restore experience** returns the corpse's full resurrection experience to the player once and marks the corpse resurrected, so a later resurrection returns nothing. It needs:

- the updated patch on the server Spire runs beside;
- the player in game;
- the corpse loaded in the player's current zone and instance. Use **Player's current location** to move it to them first;
- a corpse that has not been resurrected and still holds experience.

The button stays disabled with the reason until all of these hold. The player is told in game that a Game Master restored the experience. The zone saves the character right away; if that save fails, Spire reports the restore as unconfirmed, so check the player's experience before trying again.

## Case workflow

![Resolving a case: summary, a saved reply sent first, and the in-game petition clear](images/player-support/resolve.png)

- **Take over and assign:** any staff member with Player Support write access can take over a case from its owner, or assign it to another staff member or to nobody. **Release** is still for the owner only. The staff list shows the users who can write Player Support cases on the connection.
- **Escalate:** an escalated case needs a reason, sorts to the top of the queue, and shows an **Escalated** chip. Resolving a case clears the escalation.
- **Categories:** a case can have one of eight categories: lost or missing items, corpse or death, stuck or location, quest or progress, player conduct, bug report, account or access, and other. Spire suggests one from words in the petition, and staff apply it. Each category shows a short hint with buttons for the matching tools.
- **Reported player:** a case can name another character as the reported player, so Evidence can show that character's events. The character must exist and must not be on the petitioning account.
- **Needs attention:** an open case nobody has answered is **aging** after 30 minutes (its time turns amber) and **Overdue** after 2 hours. A case marked waiting needs a **Follow up** when the player has not replied within 48 hours. A tell or a sent mail or parcel, including an account action notice, counts as an answer. The **Needs attention** card counts escalated, overdue and follow-up cases once each, and filters the queue to them. **Alerts** can also chime when a follow-up comes due.
- **Account notes:** staff can keep up to 20 notes of up to 2,000 characters per account on a connection. The newest shows above every case from that account. Adding or removing a note is recorded on the case where it was done.
- **Viewers:** the queue and the case header show who else has the case open and who is writing to the player. Before a tell or mail is sent while another staff member is writing, or within two minutes after one sent a message, Spire asks for confirmation. Nothing is locked.
- **Resolve and clear the petition:** **Also clear petition #N in game** is on by default. A petition checked out in game is not cleared and the option is off; clear it in game with `#delpetition`, or resolve without it. The case stays resolved whatever the result, and the result is recorded on the case:

  | Server | What happens |
  |---|---|
  | Updated patch | World removes the petition and every zone refreshes its list. The player can file a new petition right away. |
  | Patch without `supportfeatures`, no patch, or a server Spire does not run beside | Spire deletes the petition from the database. A zone that already loaded it keeps it until the next petition is filed or withdrawn, so the player may be told one is still open until then. With the earlier patch, `#petition` already sees the change. |

- **Reply and resolve:** a saved reply can be marked **Reply and resolve** in **Replies**. The Resolve dialog can send any saved reply first: as a tell when the player is in game and the reply fits in a tell, and by in-game mail otherwise, whatever **Player replies** says. The case is resolved only after the reply was sent; if the send fails, including a tell that World refuses, the dialog stays open with the error and the next try is a new send. If delivery was not confirmed, the dialog says so and does not send the reply again on its own: check the conversation, then choose **Send again and resolve** or **Resolve without sending again**.

### Select mode

![Select mode: two cases selected and the bar of batch actions](images/player-support/batch.png)

**Select** above the queue adds a checkbox to each case. With cases selected, a bar offers **Claim**, **Assign…**, **Category…**, **Wait** and **Resolve…** for up to 50 cases at once. Each case is updated on its own, with the same rules as the single-case action, so one case that changed or is checked out in game does not stop the others. The notice says how many were updated and lists each case that was not, with the reason. A batch resolve can clear the cases' petitions in game, on by default.

## Investigation and repair tools

All of these are in the case's side panel or tabs. Tools that change a player's data ask for a reason (8 to 240 characters), which is recorded on the case timeline and in the audit log, and refuse to run on a resolved case.

- **Evidence:** the case's **Evidence** tab lists player events from every character on the petition's account, from 6 hours to 7 days before the petition up to now, with a marker where the petition was filed. Filter by items, deaths, zoning, GM commands, tasks, chat (Say and Player Speech) or possible hacks. When the case has a reported player, Evidence can switch to that character's events. It needs Player Event Logs read access, and only shows event types turned on in the Player Event Log settings. **Chat** needs its own permission and says when Say or Player Speech logging is off. Without that permission, chat is also left out of **All**.
- **Inventory snapshots:** **Snapshots** compares an inventory snapshot with the character's current inventory and bank, and lists what is missing. Items found elsewhere on the account (a corpse, a parcel, the shared bank, another character) or already returned by staff since the snapshot are set aside under **Accounted for** and cannot be selected. Selected items open in the parcel composer with a reason filled in, for review before sending. **Where is it?** opens the item in **Items**. EQEmu takes snapshots when the `Character:ActiveInvSnapshots` rule is on, or with `#invsnapshot capture`.
- **Account history:** the side panel lists the account's other cases with their resolution summaries. **Merge here** moves an earlier case's notes, messages and deliveries into the open case and resolves the earlier one with a link. A case whose petition is still open in game can't be merged away.
- **Saved replies:** **Replies** in the header manages replies shared by everyone on the server connection. Use `{character}` for the player's name and `{account}` for the account. Replies that fit in a tell (200 plain characters) also show as Live chat quick replies; all of them show as mail templates.
- **Alerts:** **Alerts** turns on desktop notifications and a chime for new petitions, player replies and follow-ups due, in this browser. It can also post each new petition to a Discord channel, using a webhook from EQEmu's `discord_webhooks` table. Spire checks every 30 seconds, announces only petitions filed after the channel is chosen, and turns mentions off. A burst of petitions becomes one message that lists up to five and counts the rest. A failed post, whether Discord rejects it or the network fails, is not retried, so keep an eye on the queue as well. Discord alerts come from the Spire running beside the game server.
- **Insights:** **Insights** shows petitions filed in the last 7, 30 or 90 days, including ones nobody has opened yet. **Resolved** and **Merged** are those petitions' current status, not everything resolved during the period. It also shows the median time to first response and to resolution, and responses and resolutions per staff member. Work dated before a case was filed, such as history merged in from an earlier case, is not counted.

### Items

![Items: where a traced item is now, whether staff returned it before, and the events that moved it](images/player-support/items.png)

**Items** traces one item across the account: the character's inventory and bank, the account's other characters, the shared bank, corpses, parcels waiting to be collected, items staff already returned (from Player Support or Mail & Parcels), and item events from the last 30 days (at most 20). Open it from the side panel and choose an item, from **Trace** on an Evidence row (destroyed, sold, dropped, or given away in a trade), or from **Where is it?** in Snapshots.

**Return by parcel** opens the reviewed parcel composer with the item and a reason filled in; nothing is sent until staff review and confirm it there. When the item is still somewhere on the account, or was returned before, Spire says where and asks first. An item that stacks keeps its count. An item that does not stack is returned as one item per copy: one from an Evidence row, and one per missing copy from a snapshot. The parcel composer does not carry charges, so a charged item arrives as a new item rather than with the charges it had.

**Restore history** lists every parcel batch staff sent to the account's characters in the last 90 days.

### Quests & progress

![Quests & progress: active tasks with their steps, completed tasks and timers](images/player-support/quests-progress.png)

**Quests & progress** has three tabs. A line at the top says whether changes go to the database (the character is offline) or apply in game.

- **Tasks** lists active tasks with their steps, completed tasks and task timers. A step can be reset or advanced, and a task removed. In game this needs the updated patch. Offline, a step can be advanced to one short of its goal but never completed, because the reward is only granted in a zone; the dialog says to complete it while the player is in game. When an in-game change completes the task, the confirmation shows the reward first. If the zone cannot save an in-game change, Spire says the game server did not confirm it. Completed records and timers can be cleared while the character is offline. Shared tasks are read-only: the shared task system owns them, so use `#task` in game.
- **Lockouts** lists unexpired expedition lockouts, instances and the safe return point. A lockout can be removed: in the database while the character is offline, and in game with the updated patch. Instances are read-only; the player can leave an expedition with `/dzquit`.
- **Flags** lists zone flags, keys, data buckets and quest globals, with links to the Inventory & Keyring, Data Buckets and QGlobals editors. **Reload game cache** makes zones read data buckets from the database again after an edit. It uses World's stock `api reload 7` command, on the server Spire runs beside only.

A database change needs Spire to see the character offline. A character between zones is asked to try again in a moment. When the character is marked in game and Spire cannot check the World roster (World is down, or runs on another host), changes stay off until that clears. The panel says which of the two it is.

### Account Action

![Account Action: the account's status, the actions, and a suspension with its end time and reason](images/player-support/discipline.png)

**Account Action** kicks the account's character from the game, suspends or bans the account, lifts a restriction, and revokes or restores chat. It shows the account's status, the restriction reason, whether chat is revoked, and who is playing now.

- **Kick** disconnects the account's character that is in a zone, with World's stock console `kick` command. It works without the patch, but only on the server Spire runs beside. A player at character select is not affected.
- **Suspend** sets the account status to -1 until the chosen time. **Ban** sets it to -2 with no end date. Both ask for a second confirmation, block login in EQEmu, and kick the account's characters in game when Spire runs beside the server. **Lift restriction** clears the reason and date and sets the status back to 0.
- Spire suspends and bans player accounts only (status 0 to -2). An account with a staff status is refused with the reason, and lifting a restriction never changes a staff status. This also keeps EQEmu's suspension expiry, which resets the status to 0 when the date passes, from removing a staff status.
- An account restricted by an older Spire, which saved the reason and date without changing the status, is flagged: EQEmu never enforced it. Apply the restriction again to enforce it.
- **Revoke chat** sets the account's revoked flag, and **Restore chat** clears it. What the flag blocks depends on the server build:
  - With the updated patch, OOC, auction and shout are always blocked, and tells still work. The dialog says exactly this.
  - On stock EQEmu and the earlier patch, it blocks tells, blocks OOC and auction only when those channels are server-wide, and never blocks shout. The dialog says only that the channels depend on the server build.
  - On every build, custom (UCS) chat channels read the flag when the player connects to chat, so a change reaches them at the player's next login.

  While no character on the account is in game it is saved to the database and applies at the next login. For a player in game it needs the updated patch on the server Spire runs beside and applies at once. Without the patch, kick the player first or wait until they log out; on any other server, wait until they log out.
- **Notice by mail:** after every action that succeeds (kick, suspend, ban, lift restriction, revoke or restore chat), Spire mails the character that filed the petition a fixed notice from GameMaster with the subject "Notice of account action". It greets the character, says what the Game Master team did (with the suspension's end in UTC), and asks the player to file a petition with `#petition` with any questions. It does not include the staff member's name or the reason, which stays an internal note on the case. A suspended or banned player reads it after they can log in again. The mail appears on the case timeline like **Reply by mail** and is recorded in the audit log. A refused or failed action sends nothing, and retrying the same request does not send a second notice. If the mail cannot be written, the action still stands, and the result says the notice could not be mailed. The notice is written to the database, so it works on stock EQEmu and on any server connection.

### Player Operations changes

Player Operations applies the same suspend, ban and lift rules. Suspending or banning now sets the account status, so World really blocks the login; before, Spire saved only the reason and date. It refuses staff accounts, and kicks the account's characters in game after a suspension or ban when the account is on the server Spire runs beside.

It also refuses profile edits, moves, currency changes, transfers and retirement while the character is in game, because the game would overwrite the change when it saves the character. Log the player out, or kick them from Player Support, first.

### Linked accounts and bug reports

- **Linked accounts** lists other accounts that have logged in from the same IP addresses as the petitioning account: their restriction, the shared addresses, up to five characters, and how many cases they have on this connection. Spire checks only when **Check shared IP addresses** is pressed. Up to 50 accounts are shown.
- **Bug reports** lists the account's `/bug` reports from the last 30 days, plus any linked to the case, up to 50. Staff can link a report to the case, unlink it, or mark it reviewed with an optional note. The section is hidden when the account has no reports.

## Privacy

- IP addresses never leave the server in full. IPv4 addresses keep their first three parts and end in `.x`; IPv6 addresses keep their first three groups and end in `:x`. Loopback addresses, and addresses shared by more than 25 accounts (usually a shared connection, such as a cafe), are left out, and the number left out is shown.
- Opening linked accounts, and viewing chat in Evidence (the **Chat** group, or chat events under **All**), adds an entry to the case timeline: "Checked linked accounts (N found)" or "Opened chat logs for …". Each is recorded at most once an hour per staff member.
- Account notes are visible to staff only, on every case from that account.

## Permissions

Player Support uses the **Player Support** resource: read to see the queue and cases, write for every change (claiming, notes, replies, workflow actions, select mode, account notes). Some tools also need another grant on the connection. Controls the viewer cannot use are hidden or disabled.

| Tool | Also needs |
|---|---|
| Move character, corpses, Snapshots, Items, Quests & progress | Player Operations (read to view, write to change) |
| Restore experience, remove a lockout, task changes | Player Operations write |
| Return by parcel, snapshot restores | Mail & Parcels Editor read and write |
| Account Action | Player Support write and Player Operations read to open; Player Operations write to act (the notice mail needs no Mail & Parcels grant) |
| Evidence | Player Event Logs read |
| Chat in Evidence | Player Event Logs read and **Player Support Chat Logs** read |
| Linked accounts | **Player Support Linked Accounts** read |
| Reload game cache | Data Buckets Editor write |
| Mark a bug report reviewed | Bug Reports write |

**Player Support Chat Logs** and **Player Support Linked Accounts** are separate from **Player Support**: a Player Support grant does not include them. Give them on the user's permission screen for the connection (**Admin → Users**), where they appear with a Read checkbox. Connection owners and users with an **ALL** grant have them.

## What each server gets

Spire asks World which Player Support features its patch supports with the `supportfeatures` console command, about once a minute together with the patch check. The updated patch (patch 3) reports seven: `close_petition`, `lockouts`, `tasks`, `revoke`, `corpse_exp`, `unbury` and `marquee`. A build that does not list `marquee` keeps the others; its tells simply show no marquee. A tool that needs a missing feature stays visible and disabled with the reason: "Needs the updated Player Support patch" on the server Spire runs beside, or "Needs the game server this Spire runs beside" for any other connection.

| Tool | No patch | Patch without `supportfeatures` | Updated patch | Server Spire does not run beside |
|---|---|---|---|---|
| Queue, workflow, notes, mail, parcels, Evidence, Snapshots, Items, flags, linked accounts, bug reports, account notes, select mode | Yes (stock) | Yes | Yes | Yes |
| Live chat, moves, in-game notices, `#petition` | No | Yes | Yes | No |
| Clear the petition in game when resolving | Database delete | Database delete | World command, zones refresh | Database delete |
| Remove a lockout | Offline only | Offline only | Offline and in game | Offline only |
| Task fixes | Offline only | Offline only | Offline and in game | Offline only |
| Kick | Yes (stock) | Yes | Yes | No |
| Suspend and ban | Yes, with kick | Yes, with kick | Yes, with kick | Yes, without kick |
| Revoke chat | Offline only | Offline only | Offline and in game | Offline only |
| Fixed revoke policy (OOC, auction and shout blocked, tells allowed) | No | No | Yes | Not detected; the dialog uses the general line |
| On-screen marquee for Game Master tells | No | No | Yes | No |
| Account action notice by mail | Yes (stock) | Yes | Yes | Yes |
| Restore experience | No | No | Yes | No |
| Move a buried corpse | No | No | Yes | No |
| Reload game cache | Yes (stock) | Yes | Yes | No |

With the patch revision that has no `supportfeatures` command, live chat and moves keep working, because the chat protocol is unchanged. The page shows no extra banner; the tools in the table that need the updated patch are disabled with their reason.

## Upgrading the server

1. Update Spire first. It works with the older patch and with none.
2. Start from your EQEmu checkout without the earlier Player Support patch: a clean checkout of the same base, or the earlier patch reversed with `git apply -R` and the old patch file. Then apply the current [companion patch](player-support-eqemu.patch) with `git apply player-support-eqemu.patch`. Do not edit the patch file.
3. Rebuild World and zone, install them, and restart World and every zone.
4. Within about a minute, Spire detects the new features. Open a case and check that the Resolve dialog says "The player can file a new petition right away."

## Known limits

- Shared tasks are read-only.
- An offline task edit never completes a step. Complete it while the player is in game.
- Restoring corpse experience needs the player in game, in the corpse's zone and instance.
- If a resurrection is already on its way to the player when the experience is restored, the player can receive the experience twice. Check that nobody is resurrecting the player first.
- The aging (30 minutes), overdue (2 hours) and follow-up (48 hours) times are fixed.
- Viewer presence is kept by each Spire process. Two Spire instances behind one database do not see each other's viewers.
- Instances and expeditions are read-only; Spire does not change expedition membership.
- Snapshots count an item staff returned since the snapshot as accounted for, even if the player lost it again later. Return it again in the parcel composer by hand if needed.
- Evidence chat shows the selected character's own events only; it does not match tells between the petitioner and the reported player.
