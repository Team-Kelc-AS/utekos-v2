import { Menu } from "@base-ui/react/menu";
import { AlignCenterHorizontal, AlignCenterVertical, ArrowDown, ArrowDownToLine, ArrowUp, ArrowUpToLine, CopyPlus, Ellipsis, ScanText, Trash2, Type } from "lucide-react";
import type { StudioLayerAction } from "@/lib/studio/selection";
import { SELECTION_TOOLBAR_HEIGHT, SELECTION_TOOLBAR_WIDTH, type Point } from "@/lib/studio/viewport";
import styles from "./studio.module.css";

export type StudioSelectionActions = {
  duplicate(): void; remove(): void; order(action: StudioLayerAction): void; center(axis: "horizontal" | "vertical"): void; fitText(): void;
  canDuplicate: boolean; canForward: boolean; canBackward: boolean; disabled: boolean;
};

export function StudioObjectToolbar({ position, text, actions, onEditText }: {
  position: Point; text: boolean; actions: StudioSelectionActions; onEditText(): void;
}) {
  return <div data-studio-object-toolbar className={styles.objectToolbar} role="group" aria-label="Verktøy for valgt element"
    style={{ left: position.x, top: position.y, width: SELECTION_TOOLBAR_WIDTH, height: SELECTION_TOOLBAR_HEIGHT }}>
    <button type="button" aria-label="Dupliser" title="Dupliser" className={styles.objectToolButton}
      disabled={actions.disabled || !actions.canDuplicate} onClick={actions.duplicate}><CopyPlus aria-hidden="true" size={20} /></button>
    <button type="button" aria-label="Slett" title="Slett" className={styles.objectToolButton}
      disabled={actions.disabled} onClick={actions.remove}><Trash2 aria-hidden="true" size={20} /></button>
    <Menu.Root modal={false}>
      <Menu.Trigger aria-label="Flere valg" title="Flere valg" className={styles.objectToolButton} disabled={actions.disabled}>
        <Ellipsis aria-hidden="true" size={22} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={styles.objectMenuPositioner} side="bottom" align="end" sideOffset={8} collisionPadding={8}>
          <Menu.Popup className={styles.objectMenu} data-studio-object-menu>
            {text && <><Menu.Group>
              <Menu.GroupLabel className={styles.objectMenuLabel}>Tekst</Menu.GroupLabel>
              <Menu.Item className={styles.objectMenuItem} onClick={() => requestAnimationFrame(onEditText)}><Type aria-hidden="true" size={18} />Rediger tekst</Menu.Item>
              <Menu.Item className={styles.objectMenuItem} onClick={actions.fitText}><ScanText aria-hidden="true" size={18} />Tilpass boksen til teksten</Menu.Item>
            </Menu.Group><Menu.Separator className={styles.objectMenuSeparator} /></>}
            <Menu.Group>
              <Menu.GroupLabel className={styles.objectMenuLabel}>Lag</Menu.GroupLabel>
              <Menu.Item className={styles.objectMenuItem} disabled={!actions.canForward} onClick={() => actions.order("forward")}><ArrowUp aria-hidden="true" size={18} />Fremover</Menu.Item>
              <Menu.Item className={styles.objectMenuItem} disabled={!actions.canBackward} onClick={() => actions.order("backward")}><ArrowDown aria-hidden="true" size={18} />Bakover</Menu.Item>
              <Menu.Item className={styles.objectMenuItem} disabled={!actions.canForward} onClick={() => actions.order("front")}><ArrowUpToLine aria-hidden="true" size={18} />Legg fremst</Menu.Item>
              <Menu.Item className={styles.objectMenuItem} disabled={!actions.canBackward} onClick={() => actions.order("back")}><ArrowDownToLine aria-hidden="true" size={18} />Legg bakerst</Menu.Item>
            </Menu.Group>
            <Menu.Separator className={styles.objectMenuSeparator} />
            <Menu.Group>
              <Menu.GroupLabel className={styles.objectMenuLabel}>Plassering på kortet</Menu.GroupLabel>
              <Menu.Item className={styles.objectMenuItem} onClick={() => actions.center("horizontal")}><AlignCenterVertical aria-hidden="true" size={18} />Midtstill vannrett</Menu.Item>
              <Menu.Item className={styles.objectMenuItem} onClick={() => actions.center("vertical")}><AlignCenterHorizontal aria-hidden="true" size={18} />Midtstill loddrett</Menu.Item>
            </Menu.Group>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  </div>;
}
