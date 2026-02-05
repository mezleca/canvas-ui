import { describe, it, expect } from "bun:test";
import { CheckboxWidget } from "../src/widgets/checkbox.ts";
import { SliderWidget } from "../src/widgets/slider.ts";
import { BoxWidget } from "../src/widgets/box.ts";
import { create_mock_ui } from "./helpers.ts";

const click_widget = (widget: CheckboxWidget, ui: any) => {
    const input = ui.get_input_state();
    input.cursor.x = widget.x + widget.w / 2;
    input.cursor.y = widget.y + widget.h / 2;
    input.keys.add("mouse1");
    widget.update(0.016);
    input.keys.delete("mouse1");
    widget.update(0.016);
};

describe("checkbox widget", () => {
    it("toggles and fires on_change", () => {
        const ui = create_mock_ui();
        const parent = new BoxWidget(100, 100);
        parent.propagate_ui_reference(ui as any);

        const checkbox = new CheckboxWidget(18);
        parent.add_children(checkbox);

        let changes: boolean[] = [];
        checkbox.on_change((value) => changes.push(value));

        click_widget(checkbox, ui);
        expect(checkbox.is_checked()).toBe(true);
        expect(changes).toEqual([true]);

        click_widget(checkbox, ui);
        expect(checkbox.is_checked()).toBe(false);
        expect(changes).toEqual([true, false]);
    });

    it("radio mode unchecks siblings", () => {
        const ui = create_mock_ui();
        const parent = new BoxWidget(120, 120);
        parent.propagate_ui_reference(ui as any);

        const a = new CheckboxWidget(18).set_radio(true, "group");
        const b = new CheckboxWidget(18).set_radio(true, "group");
        a.x = 10;
        b.x = 40;
        parent.add_children(a, b);

        click_widget(a, ui);
        expect(a.is_checked()).toBe(true);
        expect(b.is_checked()).toBe(false);

        click_widget(b, ui);
        expect(a.is_checked()).toBe(false);
        expect(b.is_checked()).toBe(true);
    });
});

describe("slider widget", () => {
    it("updates value from drag and snaps to step", () => {
        const ui = create_mock_ui();
        const slider = new SliderWidget(100, 8);
        slider.propagate_ui_reference(ui as any);
        slider.set_range(0, 10).set_step(1);

        const input = ui.get_input_state();
        input.cursor.x = 99;
        input.cursor.y = 4;
        input.keys.add("mouse1");

        slider.update(0.016);
        expect(slider.value).toBe(10);

        input.cursor.x = 55;
        slider.update(0.016);
        expect(slider.value).toBe(6);

        input.keys.delete("mouse1");
        slider.update(0.016);
        expect(slider.dragging).toBe(false);
    });
});
