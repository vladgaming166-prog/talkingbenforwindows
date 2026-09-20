package dev.astralblaze.client.core.setting;

import com.google.gson.JsonElement;
import com.google.gson.JsonPrimitive;

public final class NumberSetting extends Setting<Double> {
	private final double min;
	private final double max;
	private final double step;

	public NumberSetting(String name, String description, double defaultValue, double min, double max, double step) {
		super(name, description, defaultValue);
		this.min = min;
		this.max = max;
		this.step = step <= 0 ? 0.01 : step;
	}

	public double min() {
		return min;
	}

	public double max() {
		return max;
	}

	public double step() {
		return step;
	}

	@Override
	public void set(Double value) {
		if (value == null) {
			return;
		}
		double clamped = Math.max(min, Math.min(max, value));
		double snapped = min + Math.round((clamped - min) / step) * step;
		snapped = Math.max(min, Math.min(max, snapped));
		super.set(snapped);
	}

	public float floatValue() {
		return get().floatValue();
	}

	public int intValue() {
		return (int) Math.round(get());
	}

	@Override
	public JsonElement toJson() {
		return new JsonPrimitive(get());
	}

	@Override
	public void fromJson(JsonElement element) {
		if (element != null && element.isJsonPrimitive()) {
			set(element.getAsDouble());
		}
	}
}
