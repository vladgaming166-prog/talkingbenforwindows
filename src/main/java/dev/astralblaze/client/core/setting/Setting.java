package dev.astralblaze.client.core.setting;

import com.google.gson.JsonElement;
import dev.astralblaze.client.AstralBlaze;

public abstract class Setting<T> {
	private final String name;
	private final String description;
	private T value;
	private final T defaultValue;

	protected Setting(String name, String description, T defaultValue) {
		this.name = name;
		this.description = description;
		this.defaultValue = defaultValue;
		this.value = defaultValue;
	}

	public String name() {
		return name;
	}

	public String description() {
		return description;
	}

	public T get() {
		return value;
	}

	public T defaultValue() {
		return defaultValue;
	}

	public void set(T value) {
		if (value == null) {
			return;
		}
		this.value = value;
		onChanged();
	}

	public void reset() {
		set(defaultValue);
	}

	protected void onChanged() {
		if (AstralBlaze.config() != null) {
			AstralBlaze.config().markDirty();
		}
	}

	public boolean matches(String query) {
		if (query == null || query.isEmpty()) {
			return true;
		}
		String q = query.toLowerCase();
		return name.toLowerCase().contains(q) || description.toLowerCase().contains(q);
	}

	public abstract JsonElement toJson();

	public abstract void fromJson(JsonElement element);
}
