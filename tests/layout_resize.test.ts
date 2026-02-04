import { test, expect } from "bun:test";
import { FlexLayout } from "../src/layout/flex.ts";
import { BoxWidget } from "../src/widgets/box.ts";
import { create_mock_ui } from "./helpers.ts";

test("flex layout - auto resize width with max constraint", () => {
    const layout = new FlexLayout(0, 100);
    // mock ui for bounds calculation
    (layout as any).ui = create_mock_ui();

    layout.style.max_width(200);
    layout.set_resize({ width: true }); // limit to 200
    layout.set_gap(0);
    layout.set_wrap(false);

    // add children that sum to 300 width
    // child 1: 150w
    const child1 = new BoxWidget(150, 50);
    layout.add_children(child1);

    layout.calculate({} as any);

    // padding/border 0 default
    // width should be 150
    expect(layout.w).toBe(150);

    // add child 2: 150w + 10 gap = 310 total content width
    const child2 = new BoxWidget(150, 50);
    layout.add_children(child2);

    layout.calculate({} as any);

    // should be clamped to 200
    expect(layout.w).toBe(200);
});

test("flex layout - auto resize height with max constraint", () => {
    const layout = new FlexLayout(100, 0);
    // mock ui
    (layout as any).ui = create_mock_ui();

    layout.set_direction("column");
    layout.set_gap(0);
    layout.set_wrap(false);
    layout.style.max_height(200);
    layout.set_resize({ height: true });

    const child1 = new BoxWidget(50, 150);
    layout.add_children(child1);

    layout.calculate({} as any);
    expect(layout.h).toBe(150);

    const child2 = new BoxWidget(50, 150);
    layout.add_children(child2);

    layout.calculate({} as any);

    // total content height ~310
    // clamped to 200
    expect(layout.h).toBe(200);
});

test("flex layout - available space constraint support", () => {
    // parent with 300 width
    const parent = new FlexLayout(300, 300);
    (parent as any).ui = create_mock_ui();

    // child with auto resize but no explicit max_width
    const child = new FlexLayout(0, 100);
    // mock ui required for child calculation if it tries to get parent bounds and fails
    (child as any).ui = create_mock_ui();
    child.set_resize({ width: true });

    // HUGE content inside child
    const huge_content = new BoxWidget(500, 50);
    child.add_children(huge_content);

    parent.add_children(child);

    parent.calculate({} as any);

    // child should be clamped to parent width (300) minus padding?
    // actually calculate checks available_size
    // parent passes its width as available size to child

    // wait, layout calculation order:
    // parent calculate -> child calculate(available_w, available_h)
    // if parent is fixed 300, available is 300 (minus padding)
    expect(child.w).toBeLessThanOrEqual(300);
});
