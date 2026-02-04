import {
    CanvasRenderer,
    UI,
    FlexLayout,
    ScrollBehavior,
    CheckboxWidget,
    SliderWidget,
    create_box,
    create_text,
    create_button,
    create_image,
    create_flex,
    create_free
} from "../../index.ts";

import cat_img from "../../static/cat.png";
import ex_audio from "../../static/ex.mp3";

const renderer = new CanvasRenderer();

renderer.initialize({ width: 1200, height: 800, background: "#1a1a1a" });

const ui = new UI(renderer);
const main = create_flex({ w: 1200, h: 800, direction: "row", wrap: true, gap: 20 });

main.style.padding(20);
main.style.background_color({ r: 25, g: 25, b: 30, a: 255 });
main.add_behavior(new ScrollBehavior(main));

ui.set_root(main);
ui.set_resize({ width: true, height: true });

const create_title = (text: string, parent: FlexLayout) => {
    create_text({ text, font: "Arial", size: 18, color: { r: 255, g: 255, b: 255, a: 255 }, parent });
};

// panel 1: column layout with scroll
const panel1 = create_flex({ w: 360, h: 100, direction: "column", wrap: false, gap: 10 });

panel1.set_resize({ width: false, height: true });
panel1.style.padding(15);
panel1.style.background_color({ r: 40, g: 40, b: 45, a: 255 });
panel1.style.border_radius(8);

create_title("column + scroll", panel1);

// add items that overflow
for (let i = 0; i < 20; i++) {
    const row = create_flex({ w: 330, h: 40, direction: "row", justify: "space-between", align: "center" });
    row.style.background_color({ r: 55, g: 55, b: 60, a: 255 });
    row.style.border_radius(4);
    row.style.padding(8, 12, 8, 12);

    create_text({
        text: `scroll item ${i + 1}`,
        font: "Arial",
        size: 14,
        color: { r: 180, g: 180, b: 180, a: 255 },
        parent: row
    });

    create_box({
        w: 24,
        h: 24,
        bg: { r: 80, g: 120, b: 200, a: 255 },
        radius: 12,
        parent: row
    });

    panel1.add_children(row);
}

const scroll1 = new ScrollBehavior(panel1);
panel1.behaviors.push(scroll1);

main.add_children(panel1);

// panel 2: row layout with wrap
const panel2 = create_flex({ w: 360, h: 760, direction: "column", wrap: false, gap: 15 });
panel2.style.padding(15);
panel2.style.background_color({ r: 40, g: 40, b: 45, a: 255 });
panel2.style.border_radius(8);

create_title("row + wrap", panel2);

// container for wrapped boxes
const wrap_container = create_flex({ w: 330, h: 300, direction: "row", wrap: true, gap: 10 });

wrap_container.set_resize({ width: false, height: true });
wrap_container.style.background_color({ r: 50, g: 50, b: 55, a: 255 });
wrap_container.style.border_radius(6);
wrap_container.style.padding(10);

const wrap_colors = [
    { r: 239, g: 68, b: 68, a: 255 },
    { r: 249, g: 115, b: 22, a: 255 },
    { r: 234, g: 179, b: 8, a: 255 },
    { r: 34, g: 197, b: 94, a: 255 },
    { r: 59, g: 130, b: 246, a: 255 },
    { r: 168, g: 85, b: 247, a: 255 }
];

for (const color of wrap_colors) {
    const box = create_box({ w: 95, h: 80, bg: color, radius: 8 });

    box.style.background_color({ r: Math.min(color.r + 30, 255), g: Math.min(color.g + 30, 255), b: Math.min(color.b + 30, 255), a: 255 }, "hover");
    box.style.transition("background_color", 150, "ease_in_out");

    wrap_container.add_children(box);
}

panel2.add_children(wrap_container);

// buttons section
const buttons_section = create_flex({ w: 330, h: 100, direction: "row", wrap: true, gap: 10, justify: "center" });

buttons_section.set_resize({ width: false, height: true });
buttons_section.style.background_color({ r: 50, g: 50, b: 55, a: 255 });
buttons_section.style.border_radius(6);
buttons_section.style.padding(15);

for (let i = 0; i < 5; i++) {
    const btn = create_button({
        text: `btn ${i + 1}`,
        on_click: () => console.log(`clicked btn ${i + 1}`),
        parent: buttons_section
    });
    btn.style.border_radius(4);
}

panel2.add_children(buttons_section);
main.add_children(panel2);

// panel 3: justify modes demo
const panel3 = create_flex({ w: 360, h: 760, direction: "column", wrap: false, gap: 15 });
panel3.style.padding(15);
panel3.style.background_color({ r: 40, g: 40, b: 45, a: 255 });
panel3.style.border_radius(8);

create_title("justify modes", panel3);

const justify_modes = ["start", "center", "end", "space-between", "space-around"] as const;

for (const mode of justify_modes) {
    create_text({ text: mode, size: 12, color: { r: 140, g: 140, b: 140, a: 255 }, parent: panel3 });

    const row = create_flex({ w: 330, h: 50, direction: "row", justify: mode, align: "center" });
    row.style.background_color({ r: 50, g: 50, b: 55, a: 255 });
    row.style.border_radius(6);
    row.style.padding(8);

    for (let i = 0; i < 3; i++) {
        create_box({ w: 60, h: 34, bg: { r: 70, g: 130, b: 180, a: 255 }, radius: 4, parent: row });
    }

    panel3.add_children(row);
}

main.add_children(panel3);

// panel 4: dynamic & cats
const panel4 = create_flex({ w: 300, h: 760, direction: "column", gap: 10, wrap: false });

panel4.style.padding(15);
panel4.style.background_color({ r: 35, g: 35, b: 40, a: 255 });
panel4.style.border_radius(8);

create_title("dynamic & cats", panel4);

// container for dynamic items
const dynamic_container = create_flex({ w: 270, h: 400, direction: "row", wrap: true, gap: 10 });

dynamic_container.style.background_color({ r: 50, g: 50, b: 55, a: 255 });
dynamic_container.style.border_radius(6);
dynamic_container.style.padding(10);
dynamic_container.set_resize({ width: false, height: false });
dynamic_container.add_behavior(new ScrollBehavior(dynamic_container));

// controls
const controls = create_flex({ w: 270, h: 100, direction: "row", wrap: true, gap: 10 });

controls.set_resize({ width: false, height: true });
controls.style.background_color({ r: 60, g: 60, b: 65, a: 255 });
controls.style.padding(5);
controls.style.border_radius(4);

const btn_add = create_button({ text: "add item" });
const btn_remove = create_button({ text: "remove last" });

btn_add.on_click(() => {
    const item = create_button({ text: "item " + (dynamic_container.children.length + 1) });
    item.style.font("Arial", 14, { r: 220, g: 220, b: 220, a: 255 });
    item.style.background_color({ r: 80, g: 80, b: 90, a: 255 });
    item.style.border(1);
    item.style.border_radius(4);
    item.style.padding(5, 10, 5, 10);
    dynamic_container.add_children(item);
});

btn_remove.on_click(() => {
    if (dynamic_container.children.length > 0) {
        dynamic_container.remove(dynamic_container.children[dynamic_container.children.length - 1]!.id);
    }
});

const play_explosion = () => {
    try {
        const audio = new Audio(ex_audio);
        audio.volume = 0.1;
        audio.play().catch(() => {});
    } catch (e) {
        // ignore
    }
};

const btn_cat = create_button({ text: "spawn cat" });
btn_cat.on_click(() => {
    const cat = create_image({ src: cat_img, w: 60, h: 60 });
    cat.style.border_radius(8);
    cat.style.rotate(0);

    let is_spinning = false;

    cat.on("click", () => {
        if (is_spinning) return;
        is_spinning = true;

        let rotation = 0;
        const spin_loop = () => {
            // stop if cat was removed
            if (!cat.parent) return;

            rotation += 5; // speed
            cat.style.rotate(rotation);

            if (rotation >= 360) {
                play_explosion();
                dynamic_container.remove(cat.id);
            } else {
                requestAnimationFrame(spin_loop);
            }
        };

        requestAnimationFrame(spin_loop);
    });

    dynamic_container.add_children(cat);
});

// dynamic color test box
const anim_box = create_box({ w: 100, h: 60, radius: 8, border: 2, border_color: { r: 255, g: 255, b: 255, a: 100 } });

anim_box.on("update", (node: any) => {
    const time = Date.now() / 500;
    const r = Math.abs(Math.sin(time)) * 255;
    const g = Math.abs(Math.cos(time)) * 255;
    const b = Math.abs(Math.sin(time + 2)) * 255;
    node.style.background_color({ r, g, b, a: 255 });
});

dynamic_container.add_children(anim_box);
controls.add_children(btn_add, btn_remove, btn_cat);
panel4.add_children(controls, dynamic_container);
main.add_children(panel4);

// panel 5: ui helpers + controls
const panel5 = create_flex({ w: 300, h: 760, direction: "column", wrap: false, gap: 12 });
panel5.style.padding(15);
panel5.style.background_color({ r: 35, g: 35, b: 40, a: 255 });
panel5.style.border_radius(8);

create_title("ui helpers", panel5);

const helper_row = create_flex({ w: 260, h: 40, direction: "row", gap: 10, align: "center" });
helper_row.style.background_color({ r: 50, g: 50, b: 55, a: 255 });
helper_row.style.border_radius(6);
helper_row.style.padding(8);

create_text({ text: "factory text", size: 12, color: { r: 180, g: 180, b: 180, a: 255 }, parent: helper_row });
create_box({ w: 16, h: 16, bg: { r: 90, g: 140, b: 200, a: 255 }, radius: 3, parent: helper_row });

panel5.add_children(helper_row);

const control_row = create_flex({ w: 260, h: 80, direction: "row", gap: 12, align: "center", wrap: true });
control_row.style.background_color({ r: 50, g: 50, b: 55, a: 255 });
control_row.style.border_radius(6);
control_row.style.padding(10);

const checkbox = new CheckboxWidget(18);
checkbox.on_change((value) => console.log("checkbox", value));
control_row.add_children(checkbox);

const slider = new SliderWidget(160, 10);
slider.set_range(0, 100).set_step(5).set_value(50);
slider.set_fill_color({ r: 120, g: 160, b: 200, a: 255 });
slider.set_thumb_color({ r: 210, g: 210, b: 210, a: 255 });
slider.on_change((value) => console.log("slider", value));
control_row.add_children(slider);

panel5.add_children(control_row);
const radio_row = create_flex({ w: 260, h: 40, direction: "row", gap: 10, align: "center" });
radio_row.style.background_color({ r: 50, g: 50, b: 55, a: 255 });
radio_row.style.border_radius(6);
radio_row.style.padding(10);

const radio_a = new CheckboxWidget(16).set_radio(true, "mode");
const radio_b = new CheckboxWidget(16).set_radio(true, "mode");
radio_a.set_checked(true);
radio_row.add_children(radio_a, radio_b);

panel5.add_children(radio_row);
main.add_children(panel5);

// render loop
const render_loop = (time: number) => {
    ui.render(time);
    requestAnimationFrame(render_loop);
};

requestAnimationFrame(render_loop);
