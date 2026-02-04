// base style property with validation and change tracking
export class StyleProperty<T> {
    protected _value: T;
    protected _default: T;
    protected _min?: number;
    protected _max?: number;
    protected _validator?: (value: T) => boolean;
    protected _on_change: (new_value: T, old_value: T) => void;

    constructor(
        initial_value: T,
        options: {
            min?: number;
            max?: number;
            validator?: (value: T) => boolean;
            on_change?: (new_value: T, old_value: T) => void;
        } = {}
    ) {
        this._value = initial_value;
        this._default = initial_value;
        this._min = options.min;
        this._max = options.max;
        this._validator = options.validator;
        this._on_change = options.on_change || (() => {});
    }

    get value(): T {
        return this._value;
    }

    set value(new_value: T) {
        if (this._validator && !this._validator(new_value)) {
            console.error(`invalid value for property: ${new_value}`);
            return;
        }

        // apply min/max constraints for numbers
        if (typeof new_value == "number") {
            if (this._min != undefined && (new_value as number) < this._min) {
                new_value = this._min as T;
            }
            if (this._max != undefined && (new_value as number) > this._max) {
                new_value = this._max as T;
            }
        }

        const old_value = this._value;
        this._value = new_value;
        this._on_change(new_value, old_value);
    }

    reset(): this {
        this.value = this._default;
        return this;
    }

    is_default(): boolean {
        return this._value == this._default;
    }

    clone(): StyleProperty<T> {
        return new StyleProperty(this._value, {
            min: this._min,
            max: this._max,
            validator: this._validator,
            on_change: this._on_change
        });
    }
}
