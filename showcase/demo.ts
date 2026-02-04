import { CanvasRenderer, UI, FlexLayout, ButtonWidget, TextWidget, BoxWidget, ScrollBehavior, ImageWidget } from "../index.ts";

import cat_img from "../static/cat.png";
import ex_audio from "../static/ex.mp3";

const renderer = new CanvasRenderer();

renderer.initialize({ width: 1200, height: 800, background: "#1a1a1a" });

const ui = new UI(renderer);
const main = new FlexLayout(1200, 800);

main.set_direction("row");
main.set_wrap(true);
main.set_gap(20);
main.style.padding(20);
main.style.background_color({ r: 25, g: 25, b: 30, a: 255 });
main.add_behavior(new ScrollBehavior(main));

ui.set_root(main);
ui.set_resize({ width: true, height: true });

const create_title = (text: string, parent: FlexLayout) => {
    const title = new TextWidget(text);
    title.style.font("Arial", 18, { r: 255, g: 255, b: 255, a: 255 });
    parent.add_children(title);
};

// panel 1: column layout with scroll
const panel1 = new FlexLayout(360, 100);

panel1.set_resize({ width: false, height: true });
panel1.set_direction("column");
panel1.set_wrap(false);
panel1.set_gap(10);
panel1.style.padding(15);
panel1.style.background_color({ r: 40, g: 40, b: 45, a: 255 });
panel1.style.border_radius(8);

create_title("column + scroll", panel1);

// add items that overflow
for (let i = 0; i < 20; i++) {
    const row = new FlexLayout(330, 40);
    row.set_direction("row");
    row.set_justify("space-between");
    row.set_align("center");
    row.style.background_color({ r: 55, g: 55, b: 60, a: 255 });
    row.style.border_radius(4);
    row.style.padding(8, 12, 8, 12);

    const text = new TextWidget(`scroll item ${i + 1}`);
    text.style.font("Arial", 14, { r: 180, g: 180, b: 180, a: 255 });
    row.add_children(text);

    const badge = new BoxWidget(24, 24);
    badge.style.background_color({ r: 80, g: 120, b: 200, a: 255 });
    badge.style.border_radius(12);
    row.add_children(badge);

    panel1.add_children(row);
}

const scroll1 = new ScrollBehavior(panel1);
panel1.behaviors.push(scroll1);

main.add_children(panel1);

// panel 2: row layout with wrap
const panel2 = new FlexLayout(360, 760);

panel2.set_direction("column");
panel2.set_wrap(false);
panel2.set_gap(15);
panel2.style.padding(15);
panel2.style.background_color({ r: 40, g: 40, b: 45, a: 255 });
panel2.style.border_radius(8);

create_title("row + wrap", panel2);

// container for wrapped boxes
const wrap_container = new FlexLayout(330, 300);

wrap_container.set_resize({ width: false, height: true });
wrap_container.set_direction("row");
wrap_container.set_wrap(true);
wrap_container.set_gap(10);
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
    const box = new BoxWidget(95, 80);
    box.style.background_color(color);
    box.style.border_radius(8);

    box.style.background_color({ r: Math.min(color.r + 30, 255), g: Math.min(color.g + 30, 255), b: Math.min(color.b + 30, 255), a: 255 }, "hover");
    box.style.transition("background_color", 150, "ease_in_out");

    wrap_container.add_children(box);
}

panel2.add_children(wrap_container);

// buttons section
const buttons_section = new FlexLayout(330, 100);

buttons_section.set_resize({ width: false, height: true });
buttons_section.set_direction("row");
buttons_section.set_wrap(true);
buttons_section.set_gap(10);
buttons_section.set_justify("center");
buttons_section.style.background_color({ r: 50, g: 50, b: 55, a: 255 });
buttons_section.style.border_radius(6);
buttons_section.style.padding(15);

for (let i = 0; i < 5; i++) {
    const btn = new ButtonWidget(`btn ${i + 1}`);
    btn.style.border_radius(4);
    btn.on_click(() => console.log(`clicked btn ${i + 1}`));
    buttons_section.add_children(btn);
}

panel2.add_children(buttons_section);
main.add_children(panel2);

// panel 3: justify modes demo
const panel3 = new FlexLayout(360, 760);

panel3.set_direction("column");
panel3.set_wrap(false);
panel3.set_gap(15);
panel3.style.padding(15);
panel3.style.background_color({ r: 40, g: 40, b: 45, a: 255 });
panel3.style.border_radius(8);

create_title("justify modes", panel3);

const justify_modes = ["start", "center", "end", "space-between", "space-around"] as const;

for (const mode of justify_modes) {
    const label = new TextWidget(mode);
    label.style.font("Arial", 12, { r: 140, g: 140, b: 140, a: 255 });
    panel3.add_children(label);

    const row = new FlexLayout(330, 50);
    row.set_direction("row");
    row.set_justify(mode);
    row.set_align("center");
    row.style.background_color({ r: 50, g: 50, b: 55, a: 255 });
    row.style.border_radius(6);
    row.style.padding(8);

    for (let i = 0; i < 3; i++) {
        const box = new BoxWidget(60, 34);
        box.style.background_color({ r: 70, g: 130, b: 180, a: 255 });
        box.style.border_radius(4);
        row.add_children(box);
    }

    panel3.add_children(row);
}

main.add_children(panel3);

// panel 4: dynamic & cats
const panel4 = new FlexLayout(300, 760);

panel4.style.padding(15);
panel4.style.background_color({ r: 35, g: 35, b: 40, a: 255 });
panel4.style.border_radius(8);
panel4.set_direction("column");
panel4.set_gap(10);

create_title("dynamic & cats", panel4);

// container for dynamic items
const dynamic_container = new FlexLayout(270, 400);

dynamic_container.style.background_color({ r: 50, g: 50, b: 55, a: 255 });
dynamic_container.style.border_radius(6);
dynamic_container.style.padding(10);
dynamic_container.set_resize({ width: false, height: false });
dynamic_container.set_wrap(true);
dynamic_container.set_gap(10);
dynamic_container.add_behavior(new ScrollBehavior(dynamic_container));

// controls
const controls = new FlexLayout(270, 100);

controls.set_direction("row");
controls.set_wrap(true);
controls.set_resize({ width: false, height: true });
controls.set_gap(10);
controls.style.background_color({ r: 60, g: 60, b: 65, a: 255 });
controls.style.padding(5);
controls.style.border_radius(4);

const btn_add = new ButtonWidget("add item");
const btn_remove = new ButtonWidget("remove last");

btn_add.on_click(() => {
    const item = new ButtonWidget("item " + (dynamic_container.children.length + 1));
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

const btn_cat = new ButtonWidget("spawn cat");
btn_cat.on_click(() => {
    const cat = new ImageWidget(cat_img, 60, 60);
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
const anim_box = new BoxWidget(100, 60);

anim_box.style.border_radius(8);
anim_box.style.border(2, { r: 255, g: 255, b: 255, a: 100 });

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

// render loop
const render_loop = (time: number) => {
    ui.render(time);
    requestAnimationFrame(render_loop);
};

requestAnimationFrame(render_loop);
