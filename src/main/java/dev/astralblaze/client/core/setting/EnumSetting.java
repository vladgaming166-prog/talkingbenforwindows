package dev.astralblaze.client.core.setting;

import com.google.gson.JsonElement;
import com.google.gson.JsonPrimitive;

public final class EnumSetting<E extends Enum<E>> extends Setting<E> {
	private final E[] values;

	public EnumSetting(String name, String description, E defaultValue) {
		super(name, description, defaultValue);
		this.values = defaultValue.getDeclaringClass().getEnumConstants();
	}

	public E[] values() {
		return values;
	}

	public void cycle() {
		int next = (get().ordinal() + 1) % values.length;
		set(values[next]);
	}

	@Override
	public JsonElement toJson() {
		return new JsonPrimitive(get().name());
	}

	@Override
	public void fromJson(JsonElement element) {
		if (element == null || !element.isJsonPrimitive()) {
			return;
		}
		String raw = element.getAsString();
		for (E value : values) {
			if (value.name().equalsIgnoreCase(raw) || display(value).equalsIgnoreCase(raw)) {
				set(value);
				return;
			}
		}
	}

	public static String display(Enum<?> value) {
		String name = value.name().toLowerCase().replace('_', ' ');
		if (name.isEmpty()) {
			return name;
		}
		return Character.toUpperCase(name.charAt(0)) + name.substring(1);
	}
}
