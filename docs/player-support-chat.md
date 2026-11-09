# Player Support live chat

The petition inbox uses the local EQEmu World roster for account presence. **Online** includes another character on the petition’s account and a player at character select. **Unknown** means Spire could not verify presence for the selected server. The chat composer checks that the petition’s character is in a zone and can receive tells.

## Enable live tells

1. Apply [the EQEmu companion patch](player-support-eqemu.patch) in your EQEmu server checkout with `git apply player-support-eqemu.patch`. The patch applies cleanly, and World and zone build with it, on both of these:
   - [Valorith/Server `master` at dc15939](https://github.com/Valorith/Server/commit/dc1593967a7e929dfa6a503de341f6d1ab60028d)
   - [EQEmu/EQEmu `master` at 4aceae18](https://github.com/EQEmu/EQEmu/commit/4aceae18b94ffaafc08e2b17bc41cd72c77f795d)

   It only calls APIs that both trees share. For example, it starts transactions with a plain `START TRANSACTION` query because `TransactionBegin()` returns a result in Valorith/Server but `void` upstream.
2. Build and install the patched World and zone binaries on your test installation. Keep the World console reachable from Spire on IPv4 loopback. Spire reads its port from `server.world.telnet` in `eqemu_config.json`.
3. Open **Server Admin → Player Support** and select a petition. Send a tell from **Live chat** to turn on **Messages** automatically. Use **Enable messages** if you want the player to write first. In EverQuest, the player can answer with `#petition <message>`, `/reply <message>` after a Game Master tell, or `/tell *GameMaster <message>`.

Turning **Messages** on or off is recorded on the case timeline with the staff member's name. When you resolve a case you can add an optional resolution summary, which is shown on the timeline next to the status change.

Spire grants chat actions through Player Support write access. The patch reserves `GameMaster` and `*GameMaster` as tell destinations. A reply is recorded and acknowledged only when the sender is the petitioning character, the in-game petition is active, and **Messages** is on for that case. Players receive a private reason if they have no active petition or **Messages** is off. Turning off **Messages** or resolving the case preserves the transcript.

Spire and the patched World use console protocol version 2 to confirm replies. If you installed an earlier revision of the patch, rebuild World and zone with the current patch before updating Spire.

The patched World also refreshes the parcel window and shows the native arrival notice for online recipients when Spire sends a parcel to the local server. Parcels are committed before World is notified. Players can collect queued parcels from a parcel merchant when they next open the window.

Test an account with its petitioning character offline and an alternate online. The queue should show **Online** and the conversation should show **Character unavailable**. Also test that reconnecting World restores messaging on an enabled petition and that switching to an unrelated database connection shows **Unknown** for presence.

## Filing petitions with #petition

The patch adds a `#petition` command for players. It works alongside `/guidehelp`, which is how current clients open the petition window.

- `#petition <message>` files a petition when the player has none. It creates the same petition as `/guidehelp`, so it appears in Player Support right away.
- If the player already has an open petition, `#petition <message>` adds to it. The text goes to Game Master like a tell. Spire records it on the case when **Messages** is on, and otherwise tells the player why it could not.
- Petitions are one per account. Only the character that filed it can add to it; on another character, `#petition` names the character who filed it instead.
- `#petition` with no message shows whether a petition is open and how to add to or withdraw it.

Server operators can rename or restrict the command in the `command_settings` table like any other command.

## Character and corpse recovery

Open **Move character** or **Corpses** from a petition. Player Operations read access lets staff inspect locations and loot. A move requires write access to both Player Support and Player Operations, an open or waiting case, and a reason recorded in the petition timeline.

Recovery uses the same companion patch and loopback World console. Online characters and loaded corpses also require the source zone's TCP WebSocket listener to be reachable on IPv4 loopback from Spire. Corpses go to a base zone's safe point or to the player. Buried corpses can be inspected. Moves are available for unburied corpses.

A character can be moved to a base zone's safe point, to exact coordinates in a base zone, or to another character's location. Choose **Coordinates** to enter X, Y, Z and a heading (0–511). You can paste the output of `/loc`, which lists Y, X, Z, and Spire puts the values in the right fields. Choose **Player** to search for any character. Spire uses that character's live position when they are in game and their last saved position otherwise. Moves into instances are not supported, so a character inside an instance cannot be used as the destination.

A cross-zone character receipt confirms that the zone requested the move. If a receipt is unconfirmed, refresh the target's location before trying again.

For an unburied corpse, choose **Player’s current location** to use the petitioning character’s live coordinates and instance. The character must be in game. The destination zone sends a chat notice when it confirms the corpse arrived.

Spire character moves send **You have been moved by a Game Master**. If Spire relocates a saved character, the patched zone displays the notice when the player next enters the game.
