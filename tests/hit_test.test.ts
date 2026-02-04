import { test, expect } from "bun:test";
import { FlexLayout } from "../src/layout/flex.ts";
import { ScrollBehavior } from "../src/behaviors/scroll.ts";
import { BoxWidget } from "../src/widgets/box.ts";
import { UI } from "../src/core/ui.ts";
import { create_mock_ui } from "./helpers.ts";

test("hit testing - accounts for scroll offset", () => {
    const layout = new FlexLayout(400, 200);
    layout.set_position(0, 0);

    // add box at top
    const box = new BoxWidget(100, 100);
    layout.add_children(box);

    // add scroll behavior
    const scroll = new ScrollBehavior(layout);
    layout.behaviors.push(scroll);

    // mock ui
    const mock_ui = create_mock_ui({
        cursor: { x: 50, y: 50 }
    });
    box.ui = mock_ui;
    layout.ui = mock_ui;

    // link parent manually since we didn't use UI.add
    box.parent = layout;

    // 1. No scroll
    // Box is at (0,0) to (100,100). Cursor at (50,50). Should hover.
    expect(box.is_hovered()).toBe(true);

    // 2. Scroll down 100px
    // Box logical y is still 0.
    // Visual y becomes 0 - 100 = -100.
    // Box visually is at (-100, 0) relative to screen Y? No.
    // Translate(0, -100).
    // Box visual bounds: (-100, 0) Y?
    // Wait. Box y=0. Translate y=-100.
    // Visual Y = 0 + (-100) = -100. Height 100.
    // Visual Range: -100 to 0.
    // Cursor at 50. Should NOT hover.

    scroll.scroll_top = 100;

    // verify get_visual_offset returns correct value
    const offset = box.get_visual_offset();
    expect(offset.y).toBe(-100);

    // verify hit test uses offset
    // Box visual range: 0-100 (y) + offset(-100) = -100 to 0.
    // Cursor 50 is outside.
    expect(box.is_hovered()).toBe(false);

    // 3. Move cursor to where box logic suggests it is (0-100), but visual is scrolled away.
    // Confirmed above.

    // 4. Move cursor to where box visual would be if we scrolled up?
    // Let's reset scroll.
    scroll.scroll_top = 0;

    // Move box to y=200
    box.y = 200;
    // Scroll down 200.
    scroll.scroll_top = 200;

    // Visual Y = 200 - 200 = 0.
    // Cursor at 50. Should hover.

    expect(box.is_hovered()).toBe(true);
});

test("ui hit testing - respects scroll and clipping bounds", () => {
    const ui = new UI({} as any);

    const layout = new FlexLayout(200, 200);
    layout.set_position(50, 50);
    layout.style.padding(20);
    const scroll = new ScrollBehavior(layout);
    layout.add_behavior(scroll);

    const child = new BoxWidget(40, 40);
    // absolute position inside content area
    child.set_position(layout.x + 20, layout.y + 120);

    layout.add_children(child);
    ui.set_root(layout);

    // scroll so the child is visually inside the view
    scroll.scroll_top = 100;

    ui.on_mouse_move({ x: layout.x + 30, y: layout.y + 40 });
    ui.update(16);
    expect(ui.get_input_state().focused_node).toBe(child);

    // move cursor to padding area outside content bounds (should not hit child)
    ui.on_mouse_move({ x: layout.x + 5, y: layout.y + 5 });
    ui.update(32);
    expect(ui.get_input_state().focused_node).toBe(layout);
});
