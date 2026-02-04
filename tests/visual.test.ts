import { test, expect } from "bun:test";
import { FlexLayout } from "../src/layout/flex.ts";
import { ButtonWidget } from "../src/widgets/button.ts";
import { TextWidget } from "../src/widgets/text.ts";
import { BoxWidget } from "../src/widgets/box.ts";
import { create_mock_ui } from "./helpers.ts";

// mock renderer with text measurement
const create_mock_renderer = () =>
    ({
        measure_text: (text: string, style: any) => {
            // simple character-based calculation
            const char_width = 10;
            const char_height = 16;
            return {
                width: text.length * char_width,
                height: char_height
            };
        }
    }) as any;

test("button widget - auto sizing with padding", () => {
    const renderer = create_mock_renderer();
    const button = new ButtonWidget("test");
    button.style.padding(10);

    button.calculate(renderer);

    // "test" = 4 chars * 10px = 40px text width
    // padding = 10px left + 10px right = 20px
    // border = 1px * 2 = 2px
    // total = 40 + 20 + 2 = 62px
    expect(button.w).toBe(62);

    // text height = 16px
    // padding = 10px top + 10px bottom = 20px
    // border = 1px * 2 = 2px
    // total = 16 + 20 + 2 = 38px
    expect(button.h).toBe(38);
});

test("button widget - different padding values", () => {
    const renderer = create_mock_renderer();
    const button = new ButtonWidget("hello");
    button.style.padding(5, 15, 5, 15); // top, right, bottom, left

    button.calculate(renderer);

    // "hello" = 5 chars * 10px = 50px
    // padding left + right = 15 + 15 = 30px
    // border = 1px * 2 = 2px
    // total = 50 + 30 + 2 = 82px
    expect(button.w).toBe(82);

    // text height = 16px
    // padding top + bottom = 5 + 5 = 10px
    // border = 1px * 2 = 2px
    // total = 16 + 10 + 2 = 28px
    expect(button.h).toBe(28);
});

test("text widget - calculates based on content", () => {
    const renderer = create_mock_renderer();
    const text = new TextWidget("testing");

    text.calculate(renderer);

    // "testing" = 7 chars * 10px = 70px
    expect(text.w).toBe(70);
    expect(text.h).toBe(16);
});

test("flex layout - children are calculated before positioning", () => {
    const renderer = create_mock_renderer();
    const layout = new FlexLayout(400, 200);
    layout.set_direction("row");
    layout.set_gap(10);
    layout.style.padding(0); // no padding on layout itself

    const btn1 = new ButtonWidget("a");
    const btn2 = new ButtonWidget("b");

    btn1.style.padding(10);
    btn2.style.padding(10);

    layout.add_children(btn1, btn2);

    // mock ui reference
    (layout as any).ui = create_mock_ui();

    layout.calculate(renderer);

    // verify buttons were calculated (have size)
    expect(btn1.w).toBeGreaterThan(0);
    expect(btn2.w).toBeGreaterThan(0);

    // verify they are positioned side by side
    expect(btn2.x).toBeGreaterThan(btn1.x);
    expect(btn2.x).toBe(btn1.x + btn1.w + 10); // gap
});

test("flex layout - respects content bounds when positioning", () => {
    const renderer = create_mock_renderer();
    const layout = new FlexLayout(400, 200);
    layout.set_direction("row");
    layout.set_gap(0);
    layout.style.padding(20); // add padding

    const box = new BoxWidget(50, 50);
    layout.add_children(box);

    // mock ui
    (layout as any).ui = create_mock_ui();

    layout.calculate(renderer);

    // box should start at padding offset (20, 20)
    expect(box.x).toBe(20);
    expect(box.y).toBe(20);
});

test("flex layout - center justify works correctly", () => {
    const renderer = create_mock_renderer();
    const layout = new FlexLayout(400, 200);
    layout.set_direction("row");
    layout.set_justify("center");
    layout.set_gap(0);
    layout.style.padding(0);

    const box = new BoxWidget(100, 50);
    layout.add_children(box);

    // mock ui
    (layout as any).ui = create_mock_ui();

    layout.calculate(renderer);

    // box should be centered in 400px width
    // (400 - 100) / 2 = 150
    expect(box.x).toBe(150);
});

test("flex layout - wrapping with multiple rows", () => {
    const renderer = create_mock_renderer();
    const layout = new FlexLayout(200, 400);
    layout.set_direction("row");
    layout.set_gap(10);
    layout.set_wrap(true);
    layout.style.padding(0);

    const box1 = new BoxWidget(100, 50);
    const box2 = new BoxWidget(100, 50);
    const box3 = new BoxWidget(100, 50);

    layout.add_children(box1, box2, box3);

    // mock ui
    (layout as any).ui = create_mock_ui();

    layout.calculate(renderer);

    // first row: box1, box2 (210px total with gap exceeds 200px, so box2 wraps)
    // box1 should be on first row
    // box2 should be on second row (higher y)
    // box3 should be on third row
    expect(box1.y).toBe(0);
    expect(box2.y).toBe(box1.y + box1.h + 10); // gap
    expect(box3.y).toBe(box2.y + box2.h + 10);
});
