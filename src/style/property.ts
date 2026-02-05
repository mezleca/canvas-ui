// base style property with validation and change tracking
export class StyleProperty<T> {
    protected value_data: T;
    protected default_value: T;
    protected min_value?: number;
    protected max_value?: number;
    protected validator?: (value: T) => boolean;
    protected on_change: (new_value: T, old_value: T) => void;

    constructor(
        initial_value: T,
        options: {
            min?: number;
            max?: number;
            validator?: (value: T) => boolean;
            on_change?: (new_value: T, old_value: T) => void;
        } = {}
    ) {
        this.value_data = initial_value;
        this.default_value = initial_value;
        this.min_value = options.min;
        this.max_value = options.max;
        this.validator = options.validator;
        this.on_change = options.on_change || (() => {});
    }

    get value(): T {
        return this.value_data;
    }

    set value(new_value: T) {
        if (this.validator && !this.validator(new_value)) {
            console.error(`invalid value for property: ${new_value}`);
            return;
        }

        // apply min/max constraints for numbers
        if (typeof new_value == "number") {
            if (this.min_value != undefined && (new_value as number) < this.min_value) {
                new_value = this.min_value as T;
            }
            if (this.max_value != undefined && (new_value as number) > this.max_value) {
                new_value = this.max_value as T;
            }
        }

        const old_value = this.value_data;
        this.value_data = new_value;
        this.on_change(new_value, old_value);
    }

    reset(): this {
        this.value = this.default_value;
        return this;
    }

    is_default(): boolean {
        return this.value_data == this.default_value;
    }

    clone(): StyleProperty<T> {
        return new StyleProperty(this.value_data, {
            min: this.min_value,
            max: this.max_value,
            validator: this.validator,
            on_change: this.on_change
        });
    }
}
