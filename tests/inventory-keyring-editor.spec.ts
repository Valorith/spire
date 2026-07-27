import { expect, Page, test } from '@playwright/test';

type InventoryKeyringMockState = {
  online?: boolean;
  inventoryCreate?: Record<string, unknown>;
  inventoryCreates?: Record<string, unknown>[];
  inventoryDelete?: Record<string, unknown>;
  keyCreate?: Record<string, unknown>;
};

const sword = {
  id: 1001,
  name: 'Guard Captain Sword',
  icon: 519,
  item_class: 0,
  item_type: 0,
  slots: 8192,
  stackable: false,
  stack_size: 1,
  max_charges: 0,
  bag_slots: 0,
  bag_size: 0,
  bag_type: 0,
  size: 2,
  no_drop: true,
  no_rent: true,
  attuneable: false,
  augment_type_mask: 0,
  augment_restrict: 0,
  augment_slots: [0, 0, 0, 0, 0, 0],
};

const potion = {
  ...sword,
  id: 1002,
  name: 'Distillate of Celestial Healing',
  icon: 856,
  item_type: 21,
  slots: 0,
  stackable: true,
  stack_size: 20,
};

const keyItem = {
  ...sword,
  id: 1003,
  name: 'Key of the Spire',
  icon: 1077,
  slots: 0,
};

const augmentItem = {
  ...sword,
  id: 1004,
  name: 'Radiant Ruby',
  icon: 1278,
  slots: 0,
  augment_type_mask: 1,
};

const slots = [
  { id: 2, label: 'Head', group: 'Equipment', known: true, selectable: true, description: 'Equipped character slot' },
  { id: 13, label: 'Primary', group: 'Equipment', known: true, selectable: true, description: 'Equipped character slot' },
  { id: 23, label: 'General 1', group: 'Inventory', known: true, selectable: true, description: 'Top-level carried inventory slot' },
  { id: 24, label: 'General 2', group: 'Inventory', known: true, selectable: true, description: 'Top-level carried inventory slot' },
  { id: 2000, label: 'Bank 1', group: 'Bank', known: true, selectable: true, description: 'Personal bank slot' },
  { id: 2500, label: 'Shared Bank 1', group: 'Shared Bank', known: true, selectable: true, description: 'Account-shared bank slot' },
];

function character(online = false, id = 42) {
  return {
    id,
    account_id: id === 43 ? 8 : 7,
    account_name: id === 43 ? 'CodexMira' : 'CodexAlder',
    name: id === 43 ? 'Mira' : 'Alder',
    level: 65,
    class: 3,
    race: 1,
    online,
    inventory_count: 1,
    key_count: 1,
    snapshot_count: 1,
  };
}

function inventoryRecord(item = sword, slot = slots[1], characterID = 42) {
  return {
    character_id: characterID,
    account_id: characterID === 43 ? 8 : 7,
    storage_kind: 'character',
    slot_id: slot.id,
    slot,
    item_id: item.id,
    item,
    charges: 1,
    color: 0,
    augments: [1, 2, 3, 4, 5, 6].map(socket => ({ socket, item_id: 0 })),
    instance_no_drop: false,
    custom_data: '',
    ornament_icon: 0,
    ornament_id_file: 0,
    ornament_hero_model: 0,
    guid: 0,
    container_contents: 0,
    evolving: null,
  };
}

function detail(state: InventoryKeyringMockState, characterID = 42) {
  return {
    character: character(Boolean(state.online), characterID),
    inventory: [inventoryRecord(sword, slots[1], characterID)],
    keyring: [{ id: 1, char_id: characterID, item_id: keyItem.id, item: keyItem }],
    snapshots: [{ time_index: 1785100000, item_count: 1 }],
    slots,
  };
}

async function installInventoryKeyringMocks(page: Page, state: InventoryKeyringMockState) {
  await page.route('**/api/v1/**', route => {
    if (!route.request().isNavigationRequest()) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    return route.continue();
  });
  await page.route('https://api.github.com/**', route => route.abort());
  await page.route('**/api/v1/app/env**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          is_spire_initialized: true,
          env: 'local',
          version: '1.0.0',
          features: {},
          settings: [],
          os: 'linux',
        },
      }),
    })
  );

  await page.route('**/api/v1/inventory-keyring/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace('/api/v1/inventory-keyring', '');
    const fulfill = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

    if (path === '/summary') {
      return fulfill({
        characters_with_inventory: 1,
        inventory_items: 1,
        keyring_characters: 1,
        keyring_entries: 1,
        snapshot_characters: 1,
        snapshot_sets: 1,
      });
    }
    if (path === '/characters') {
      return fulfill({
        data: [character(Boolean(state.online)), character(false, 43)],
        total: 2,
        page: 1,
        limit: 30,
      });
    }
    const characterMatch = path.match(/^\/character\/(42|43)$/);
    if (characterMatch && request.method() === 'GET') {
      return fulfill(detail(state, Number(characterMatch[1])));
    }
    if (path === '/character/42/snapshot/1785100000') {
      return fulfill({
        character: character(Boolean(state.online)),
        time_index: 1785100000,
        items: [inventoryRecord()],
      });
    }
    if (path === '/lookup/items') {
      const query = String(url.searchParams.get('q') || '').toLowerCase();
      const records = [sword, potion, keyItem, augmentItem].filter(item =>
        item.name.toLowerCase().includes(query) || String(item.id) === query
      );
      return fulfill(records);
    }
    if (path === '/character/42/inventory' && request.method() === 'POST') {
      state.inventoryCreate = request.postDataJSON();
      state.inventoryCreates = [...(state.inventoryCreates || []), state.inventoryCreate];
      const selectedItem = [sword, potion, keyItem, augmentItem].find(
        item => Number(item.id) === Number(state.inventoryCreate?.item_id)
      ) || potion;
      const created = inventoryRecord(
        selectedItem,
        slots.find(slot => Number(slot.id) === Number(state.inventoryCreate?.slot_id)) || slots[2]
      );
      const updated = detail(state);
      updated.inventory.push(created);
      return fulfill({ audit_id: 21, detail: updated });
    }
    if (path === '/character/42/inventory/13' && request.method() === 'DELETE') {
      state.inventoryDelete = request.postDataJSON();
      const updated = detail(state);
      updated.inventory = [];
      return fulfill({ audit_id: 22, detail: updated });
    }
    if (path === '/character/42/keyring' && request.method() === 'POST') {
      state.keyCreate = request.postDataJSON();
      const updated = detail(state);
      updated.keyring.push({ id: 2, char_id: 42, item_id: potion.id, item: potion });
      return fulfill({ audit_id: 23, detail: updated });
    }

    return fulfill({ error: `Unhandled inventory test route: ${request.method()} ${path}` }, 404);
  });
}

test.describe('Inventory & Keyring Editor', () => {
  test('renders named player storage context in the native editor shell across responsive widths', async ({ page }) => {
    const state: InventoryKeyringMockState = {};
    await installInventoryKeyringMocks(page, state);
    await page.goto('/admin/inventory-keyring?character=42');

    await expect(page.getByRole('heading', { name: 'Inventory & Keyring' })).toBeVisible();
    await expect(page.getByTestId('inventory-keyring-inspector')).toContainText('Alder');
    await expect(page.getByTestId('inventory-keyring-items')).toContainText('Guard Captain Sword');
    await expect(page.getByTestId('inventory-keyring-items')).toContainText('Primary');
    await expect(page.locator('a[href="/admin/inventory-keyring"]')).toBeVisible();

    const inventorySearch = page.getByTestId('inventory-keyring-inventory-search');
    await inventorySearch.fill('Primary');
    await expect(page.getByTestId('inventory-keyring-items')).toContainText('Guard Captain Sword');
    await inventorySearch.fill('999999');
    await expect(page.getByTestId('inventory-keyring-items')).toContainText('No items match this search');
    await expect(page.getByTestId('inventory-keyring-items')).not.toContainText('Guard Captain Sword');
    await inventorySearch.press('Escape');
    await expect(inventorySearch).toHaveValue('');
    await expect(page.getByTestId('inventory-keyring-items')).toContainText('Guard Captain Sword');

    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 760, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      const searchSpacing = await inventorySearch.evaluate(input => {
        const icon = input.parentElement?.querySelector(':scope > i');
        const inputBounds = input.getBoundingClientRect();
        const iconBounds = icon?.getBoundingClientRect();
        const paddingLeft = Number(String(getComputedStyle(input).paddingLeft).replace('px', ''));
        return {
          clearance: iconBounds ? inputBounds.left + paddingLeft - iconBounds.right : 0,
          paddingLeft,
        };
      });
      expect(searchSpacing.paddingLeft, `${viewport.width}px search input left padding`).toBeGreaterThanOrEqual(36);
      expect(searchSpacing.clearance, `${viewport.width}px placeholder/icon clearance`).toBeGreaterThanOrEqual(10);
    }

    const tabs = page.getByRole('tablist', { name: 'Player storage area' });
    const inventoryTab = tabs.getByRole('tab', { name: /Inventory/ });
    await inventoryTab.focus();
    await inventoryTab.press('ArrowRight');
    await expect(tabs.getByRole('tab', { name: /Keyring/ })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('inventory-keyring-keys')).toContainText('Key of the Spire');
    await tabs.getByRole('tab', { name: /Keyring/ }).press('ArrowRight');
    await expect(tabs.getByRole('tab', { name: /Snapshots/ })).toHaveAttribute('aria-selected', 'true');
    const snapshot = page.locator('.snapshot-list > button').first();
    await expect(snapshot).toContainText('1 captured items');
    await snapshot.click();
    await expect(page.locator('.snapshot-preview-heading')).toContainText('1 items');
    await expect(page.locator('.snapshot-item-list')).toContainText('Guard Captain Sword');

    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 760, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      const geometry = await page.locator('.spire-editor-workspace').evaluate(element => {
        const bounds = element.getBoundingClientRect();
        const offenders = Array.from(element.querySelectorAll('*'))
          .map(node => {
            const rect = node.getBoundingClientRect();
            return {
              element: `${node.tagName.toLowerCase()}.${String(node.className || '').replace(/\s+/g, '.')}`,
              right: Math.round(rect.right - bounds.right),
            };
          })
          .filter(record => record.right > 1)
          .sort((left, right) => right.right - left.right)
          .slice(0, 5);
        const editorShell = element.querySelector('.eq-window-simple');
        return {
          overflow: element.scrollWidth - element.clientWidth,
          pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          background: editorShell ? getComputedStyle(editorShell).backgroundImage : 'none',
          offenders,
        };
      });
      expect(geometry.offenders, `${viewport.width}px overflowing descendants`).toEqual([]);
      expect(geometry.pageOverflow, `${viewport.width}px page overflow`).toBeLessThanOrEqual(2);
      // EQ window corner pseudo-elements intentionally extend a few pixels past their boxes.
      expect(geometry.overflow, `${viewport.width}px workspace chrome overflow`).toBeLessThanOrEqual(12);
      expect(geometry.background).not.toBe('none');
    }
  });

  test('creates an item through smart lookup, named destination, and required audit reason', async ({ page }) => {
    const state: InventoryKeyringMockState = {};
    await installInventoryKeyringMocks(page, state);
    await page.goto('/admin/inventory-keyring?character=42');

    await page.getByTestId('inventory-keyring-add-item').click();
    const lookup = page.getByRole('dialog', { name: 'Choose an item' });
    await expect(lookup).toBeVisible();
    await lookup.getByPlaceholder(/Search item name/).fill('Celestial');
    await lookup.getByRole('button', { name: /Distillate of Celestial Healing/ }).click();

    const editor = page.getByTestId('inventory-item-editor');
    const instanceNoDrop = editor.getByRole('switch', { name: 'Instance no-drop' });
    await expect(instanceNoDrop).toHaveAttribute('aria-checked', 'false');
    await instanceNoDrop.click();
    await expect(instanceNoDrop).toHaveAttribute('aria-checked', 'true');
    await instanceNoDrop.click();

    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 760, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      const controlGeometry = await editor.evaluate(element => {
        const centerOffset = (control: Element, icon: Element) => {
          const controlBounds = control.getBoundingClientRect();
          const iconBounds = icon.getBoundingClientRect();
          return {
            x: Math.abs((controlBounds.left + controlBounds.width / 2) - (iconBounds.left + iconBounds.width / 2)),
            y: Math.abs((controlBounds.top + controlBounds.height / 2) - (iconBounds.top + iconBounds.height / 2)),
          };
        };
        const closeButton = element.querySelector('button[aria-label="Close item editor"]')!;
        const closeIcon = closeButton.querySelector('i')!;
        const toggle = element.querySelector('button[role="switch"]')!;
        const toggleKnob = toggle.querySelector('span')!;
        const tintControls = Array.from(element.querySelector('.inventory-color-control')!.children);
        return {
          closeCenter: centerOffset(closeButton, closeIcon),
          closePadding: getComputedStyle(closeButton).padding,
          tintHeights: tintControls.map(control => Math.round(control.getBoundingClientRect().height)),
          tintOverflow: element.querySelector('.inventory-color-control')!.scrollWidth -
            element.querySelector('.inventory-color-control')!.clientWidth,
          toggleCenter: centerOffset(toggle, toggleKnob),
          toggleDisplay: getComputedStyle(toggle).display,
          togglePadding: getComputedStyle(toggle).padding,
        };
      });
      expect(controlGeometry.closeCenter.x, `${viewport.width}px close icon horizontal centering`).toBeLessThanOrEqual(1);
      expect(controlGeometry.closeCenter.y, `${viewport.width}px close icon vertical centering`).toBeLessThanOrEqual(1);
      expect(controlGeometry.closePadding).toBe('0px');
      expect(new Set(controlGeometry.tintHeights).size, `${viewport.width}px tint control height consistency`).toBe(1);
      expect(controlGeometry.tintHeights[0], `${viewport.width}px tint control usable height`).toBeGreaterThanOrEqual(24);
      expect(controlGeometry.tintOverflow).toBeLessThanOrEqual(1);
      expect(controlGeometry.toggleCenter.y, `${viewport.width}px switch vertical centering`).toBeLessThanOrEqual(1);
      expect(controlGeometry.toggleDisplay).toBe('flex');
      expect(controlGeometry.togglePadding).toBe('2px');
    }

    const destination = page.locator('#inventory-keyring-slot');
    await expect(destination.locator('option[value="2"]')).toBeDisabled();
    await expect(destination.locator('option[value="2"]')).toContainText('incompatible');
    await expect(destination.locator('option[value="13"]')).toBeDisabled();
    await expect(destination).toHaveValue('23');
    await page.locator('#inventory-keyring-charges').fill('5');
    await page.getByLabel('Choose item tint').fill('#112233');
    await expect(page.locator('#inventory-keyring-color')).toHaveValue('4279312947');
    await expect(page.locator('.inventory-color-summary')).toHaveText('Stored ARGB #FF112233');
    await page.locator('#inventory-keyring-inventory-reason').fill('QA');
    await page.getByTestId('inventory-item-editor').getByRole('button', { name: 'Add item' }).click();

    await expect.poll(() => state.inventoryCreate).toBeDefined();
    expect(state.inventoryCreate).toMatchObject({
      item_id: 1002,
      slot_id: 23,
      target_slot_id: 23,
      charges: 5,
      color: 4279312947,
      reason: 'QA',
    });
  });

  test('copies a safe item instance into an empty named destination with a distinct audit reason', async ({ page }) => {
    const state: InventoryKeyringMockState = {};
    await installInventoryKeyringMocks(page, state);
    await page.goto('/admin/inventory-keyring?character=42');

    await page.getByRole('button', { name: /Guard Captain Sword/ }).click();
    const editor = page.getByTestId('inventory-item-editor');
    await editor.getByRole('button', { name: 'Copy' }).click();

    await expect(editor).toContainText('Creating a separate audited instance');
    await expect(page.locator('#inventory-keyring-slot')).toHaveValue('23');
    await expect(page.locator('#inventory-keyring-slot option[value="13"]')).toBeDisabled();
    await page.locator('#inventory-keyring-inventory-reason').fill('Creating a verified replacement for player support');
    await editor.getByRole('button', { name: 'Create copy' }).click();

    await expect.poll(() => state.inventoryCreate).toBeDefined();
    expect(state.inventoryCreate).toMatchObject({
      item_id: 1001,
      slot_id: 23,
      target_slot_id: 23,
      reason: 'Creating a verified replacement for player support',
    });
  });

  test('guards dirty item drafts when browser history changes the selected character', async ({ page }) => {
    const state: InventoryKeyringMockState = {};
    await installInventoryKeyringMocks(page, state);
    await page.goto('/admin/inventory-keyring?character=43');
    await page.getByTestId('inventory-keyring-character-directory').getByRole('button', { name: /Alder/ }).click();
    await expect(page).toHaveURL(/character=42/);
    await page.getByRole('button', { name: /Guard Captain Sword/ }).click();
    await page.locator('#inventory-keyring-charges').fill('2');

    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Discard unsaved inventory or keyring changes?');
      await dialog.dismiss();
    });
    await page.goBack();
    await expect(page).toHaveURL(/character=42/);
    await expect(page.getByTestId('inventory-keyring-inspector')).toContainText('Alder');
    await expect(page.locator('#inventory-keyring-charges')).toHaveValue('2');

    await page.goto('/admin/inventory-keyring?character=43');
    await page.getByTestId('inventory-keyring-character-directory').getByRole('button', { name: /Alder/ }).click();
    await page.getByRole('button', { name: /Guard Captain Sword/ }).click();
    await page.locator('#inventory-keyring-charges').fill('2');
    page.once('dialog', async dialog => {
      await dialog.accept();
    });
    await page.goBack();
    await expect(page).toHaveURL(/character=43/);
    await expect(page.getByTestId('inventory-keyring-inspector')).toContainText('Mira');
    await expect(page.getByTestId('inventory-item-editor')).toBeHidden();
  });

  test('guards destructive inventory writes and locks all mutations while a character is online', async ({ page }) => {
    const state: InventoryKeyringMockState = {};
    await installInventoryKeyringMocks(page, state);
    await page.goto('/admin/inventory-keyring?character=42');

    await page.getByRole('button', { name: /Guard Captain Sword/ }).click();
    await page.getByRole('button', { name: 'Remove' }).click();
    const removal = page.getByRole('dialog', { name: 'Remove inventory item' });
    await expect(removal.getByRole('button', { name: 'Remove' })).toBeDisabled();
    await page.locator('#inventory-keyring-delete-reason').fill('QA');
    const confirmationSlider = page.locator('#inventory-keyring-delete-confirmation');
    await expect(confirmationSlider).toHaveValue('0');
    await confirmationSlider.fill('99');
    await expect(removal.getByRole('button', { name: 'Remove' })).toBeDisabled();
    await confirmationSlider.fill('100');
    await expect(removal).toContainText('Removal armed');
    await removal.getByRole('button', { name: 'Remove' }).click();
    await expect.poll(() => state.inventoryDelete).toBeDefined();
    expect(state.inventoryDelete).toEqual({
      confirmation: 'REMOVE Guard Captain Sword',
      reason: 'QA',
    });

    state.online = true;
    await page.reload();
    await expect(page.getByText('Live character protection')).toBeVisible();
    await expect(page.getByTestId('inventory-keyring-add-item')).toBeDisabled();
    await page.getByRole('tab', { name: /Keyring/ }).click();
    await expect(page.getByTestId('inventory-keyring-add-key')).toBeDisabled();
  });
});
