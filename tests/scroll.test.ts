import { test, expect } from "bun:test";
import { FlexLayout } from "../src/layout/flex.ts";
import { BoxWidget } from "../src/widgets/box.ts";
import { ScrollBehavior } from "../src/behaviors/scroll.ts";
import { create_mock_renderer_with_transforms, create_mock_ui } from "./helpers.ts";

test("scroll behavior - calculates max scroll based on content height", () => {
    const layout = new FlexLayout(400, 200);
    layout.set_direction("column");
    layout.set_wrap(false);
    layout.set_gap(10);
    layout.style.padding(0);

    // add boxes that exceed layout height
    const box1 = new BoxWidget(100, 100);
    const box2 = new BoxWidget(100, 100);
    const box3 = new BoxWidget(100, 100);

    layout.add_children(box1, box2, box3);

    const scroll = new ScrollBehavior(layout);
    layout.behaviors.push(scroll);

    // mock ui with layout focused
    (layout as any).ui = create_mock_ui({
        focused_node: layout
    });

    const renderer = create_mock_renderer_with_transforms();
    layout.calculate(renderer);

    // content height should be 3 boxes + 2 gaps = 320px
    // layout height is 200px
    // max scroll should be 120px
    expect(scroll.max_scroll).toBe(120);
});

test("scroll behavior - scroll updates with mouse wheel", () => {
    const layout = new FlexLayout(400, 300);
    const scroll = new ScrollBehavior(layout);
    layout.behaviors.push(scroll);

    // mock ui with wheel event and layout focused
    (layout as any).ui = create_mock_ui({
        cursor: { x: 200, y: 150, delta_y: 50 },
        focused_node: layout
    });

    // setup content
    scroll.content_height = 600;
    scroll.max_scroll = 300;

    // simulate update
    scroll.update(0.016);

    // scroll should increase by delta_y
    expect(scroll.scroll_top).toBe(50);
});

test("scroll behavior - clamps scroll to valid range", () => {
    const layout = new FlexLayout(400, 200);
    const scroll = new ScrollBehavior(layout);
    layout.behaviors.push(scroll);

    scroll.content_height = 400;
    scroll.max_scroll = 200;

    // try to scroll beyond max
    (layout as any).ui = create_mock_ui({
        cursor: { x: 200, y: 100, delta_y: 300 },
        focused_node: layout
    });

    scroll.update(0.016);

    // should be clamped to max_scroll
    expect(scroll.scroll_top).toBe(200);

    // try to scroll to negative
    (layout as any).ui = create_mock_ui({
        cursor: { x: 200, y: 100, delta_y: -500 },
        focused_node: layout
    });

    scroll.update(0.016);

    // should be clamped to 0
    expect(scroll.scroll_top).toBe(0);
});

test("scroll behavior - no scrollbar when content fits", () => {
    const layout = new FlexLayout(400, 400);
    layout.set_direction("column");
    layout.set_wrap(false);
    layout.style.padding(0);

    // content smaller than layout
    const box = new BoxWidget(100, 100);
    layout.add_children(box);

    const scroll = new ScrollBehavior(layout);
    layout.behaviors.push(scroll);

    (layout as any).ui = create_mock_ui();

    const renderer = create_mock_renderer_with_transforms();
    layout.calculate(renderer);

    // no overflow = no scroll
    expect(scroll.max_scroll).toBe(0);
    expect(layout.content_height).toBeLessThanOrEqual(layout.h);
});

test("scroll behavior - content height calculation with padding", () => {
    const layout = new FlexLayout(400, 200);
    layout.set_direction("column");
    layout.set_wrap(false);
    layout.set_gap(0);
    layout.style.padding(20);

    const box = new BoxWidget(100, 100);
    layout.add_children(box);

    const scroll = new ScrollBehavior(layout);
    layout.behaviors.push(scroll);

    (layout as any).ui = create_mock_ui();

    const renderer = create_mock_renderer_with_transforms();
    layout.calculate(renderer);

    // content = 100 (box) + 20 (top padding) + 20 (bottom padding) = 140
    expect(layout.content_height).toBe(140);
});

test("scroll behavior - max scroll respects content bounds height", () => {
    const layout = new FlexLayout(200, 200);
    layout.set_direction("column");
    layout.set_wrap(false);
    layout.set_gap(0);
    layout.style.padding(20);

    const box = new BoxWidget(100, 300);
    layout.add_children(box);

    const scroll = new ScrollBehavior(layout);
    layout.behaviors.push(scroll);

    (layout as any).ui = create_mock_ui({
        focused_node: layout
    });

    const renderer = create_mock_renderer_with_transforms();
    layout.calculate(renderer);

    // content bounds height = 200 - 20 - 20 = 160
    // content height = 300 + 20 + 20 = 340
    // max scroll should be 180
    scroll.update(0.016);
    expect(scroll.max_scroll).toBe(180);
});

test("scroll behavior - resets scroll when no overflow", () => {
    const layout = new FlexLayout(200, 200);
    layout.set_direction("column");
    layout.set_wrap(false);
    layout.set_gap(0);

    const box = new BoxWidget(100, 100);
    layout.add_children(box);

    const scroll = new ScrollBehavior(layout);
    layout.behaviors.push(scroll);

    (layout as any).ui = create_mock_ui({
        focused_node: layout
    });

    // force a previous scroll state
    scroll.scroll_top = 50;
    layout.is_dirty = false;

    const renderer = create_mock_renderer_with_transforms();
    layout.calculate(renderer);

    scroll.update(0.016);

    expect(scroll.scroll_top).toBe(0);
    expect(layout.is_dirty).toBe(true);
});

test("scroll behavior - marks dirty when viewport changes", () => {
    const layout = new FlexLayout(200, 200);
    layout.set_direction("column");
    layout.set_wrap(false);
    layout.set_gap(0);
    layout.style.padding(10);

    const box = new BoxWidget(100, 300);
    layout.add_children(box);

    const scroll = new ScrollBehavior(layout);
    layout.behaviors.push(scroll);

    (layout as any).ui = create_mock_ui({
        focused_node: layout
    });

    const renderer = create_mock_renderer_with_transforms();
    layout.calculate(renderer);

    // first update initializes cached viewport/content values
    scroll.update(0.016);
    layout.is_dirty = false;
    scroll.update(0.016);
    expect(layout.is_dirty).toBe(false);

    // change padding which changes viewport height
    layout.style.padding(20);
    scroll.update(0.016);
    expect(layout.is_dirty).toBe(true);
});

test("scroll behavior - scrollbar not rendered when content fits", () => {
    const layout = new FlexLayout(400, 500);
    layout.set_direction("column");
    layout.set_wrap(false);
    layout.style.padding(10);

    // small content that fits
    const box = new BoxWidget(100, 100);
    layout.add_children(box);

    const scroll = new ScrollBehavior(layout);
    layout.behaviors.push(scroll);

    (layout as any).ui = create_mock_ui();

    // track render calls
    let render_box_calls = 0;
    const renderer = {
        measure_text: () => ({ width: 0, height: 0 }),
        render_box: () => {
            render_box_calls++;
        },
        render_text: () => {},
        push_transform: () => {},
        pop_transform: () => {},
        translate: () => {},
        set_clip: () => {},
        restore_clip: () => {}
    } as any;

    layout.calculate(renderer);

    // verify no overflow
    expect(scroll.max_scroll).toBe(0);

    // reset counter and render scrollbar
    render_box_calls = 0;
    scroll.render(renderer);

    // scrollbar should not render any boxes when max_scroll is 0
    expect(render_box_calls).toBe(0);
});
