import { test, expect } from "bun:test";
import { Node } from "../src/core/node.ts";
import { ButtonWidget } from "../src/widgets/button.ts";
import { FlexLayout } from "../src/layout/flex.ts";
import { ScrollBehavior } from "../src/behaviors/scroll.ts";
import { create_mock_ui } from "./helpers.ts";

test("node state - default to hover transition", () => {
    const node = new Node();
    node.set_bounds(10, 10, 100, 50);
    node.ui = create_mock_ui({
        cursor: { x: 50, y: 50 }
    });

    // default state
    expect(node.style.current_state).toBe("default");

    // simulate hover (cursor at 50, 50 which is inside node bounds)
    node.update();

    // should transition to hover
    expect(node.style.current_state).toBe("hover");
});

test("node state - hover to default when cursor leaves", () => {
    const node = new Node();
    node.set_bounds(10, 10, 100, 50);

    const mock_ui = create_mock_ui({
        cursor: { x: 50, y: 50 }
    });
    const input_state = mock_ui.input_state;
    node.ui = mock_ui;

    // hover
    node.update();
    expect(node.style.current_state).toBe("hover");

    // move cursor outside
    input_state.cursor.x = 200;
    input_state.cursor.y = 200;
    node.update();

    // should go back to default
    expect(node.style.current_state).toBe("default");
});

test("button widget - has distinct styles for each state", () => {
    const btn = new ButtonWidget("test");

    // verify all states have been configured
    const default_bg = btn.style.states.default.background_color.value;
    const hover_bg = btn.style.states.hover.background_color.value;
    const active_bg = btn.style.states.active.background_color.value;

    // all states should have different colors
    expect(default_bg.r).toBe(58);
    expect(hover_bg.r).toBe(70); // lighter on hover
    expect(active_bg.r).toBe(45); // darker on active

    // hover should be lighter than default
    expect(hover_bg.r).toBeGreaterThan(default_bg.r);

    // active should be darker than default
    expect(active_bg.r).toBeLessThan(default_bg.r);
});

test("node state - multiple updates maintain correct state", () => {
    const node = new Node();
    node.set_bounds(10, 10, 100, 50);
    node.ui = create_mock_ui({
        cursor: { x: 50, y: 50 }
    });

    // hover
    node.update();
    expect(node.style.current_state).toBe("hover");

    // hover again (should stay)
    node.update();
    expect(node.style.current_state).toBe("hover");

    // hover third time
    node.update();
    expect(node.style.current_state).toBe("hover");
});

test("button state transitions fire events correctly", () => {
    const btn = new ButtonWidget("test");
    btn.set_bounds(10, 10, 100, 50);

    let hover_count = 0;
    let leave_count = 0;
    let click_count = 0;

    btn.on_hover(() => hover_count++);
    btn.on_mouseleave(() => leave_count++);
    btn.on_click(() => click_count++);

    // mock ui with cursor inside button
    const mock_ui = create_mock_ui({
        cursor: { x: 50, y: 50 }
    });
    const input_state = mock_ui.input_state;
    btn.ui = mock_ui;

    // hover
    btn.update();
    expect(hover_count).toBe(1);

    // click (mouse down then up)
    input_state.keys.add("mouse1");
    btn.update();

    input_state.keys.delete("mouse1");
    btn.update();
    expect(click_count).toBe(1);

    // leave
    input_state.cursor.x = 200;
    input_state.cursor.y = 200;
    btn.update();
    expect(leave_count).toBe(1);
});

test("hover state stays stable with scroll offset", () => {
    const layout = new FlexLayout(200, 200);
    const scroll = new ScrollBehavior(layout);
    layout.add_behavior(scroll);

    const node = new Node();
    node.x = 0;
    node.y = 200;
    node.w = 50;
    node.h = 50;
    layout.add_children(node);

    const mock_ui = create_mock_ui({
        cursor: { x: 25, y: 25 }
    });
    const input_state = mock_ui.input_state;
    layout.ui = mock_ui;
    node.ui = mock_ui;

    // scroll so node is visually at y=0..50
    scroll.scroll_top = 200;

    // multiple updates should keep hover state
    node.update();
    expect(node.style.current_state).toBe("hover");
    node.update();
    expect(node.style.current_state).toBe("hover");
});

test("style updates - no dirty on no-op values", () => {
    const node = new Node();
    node.is_dirty = false;

    const current_bg = node.style.states.default.background_color.value;
    node.style.background_color(current_bg);
    expect(node.is_dirty).toBe(false);

    node.style.padding_left(0);
    expect(node.is_dirty).toBe(false);
});
