package dev.astralblaze.client.theme;

import com.google.gson.JsonObject;
import dev.astralblaze.client.AstralBlaze;

import java.util.EnumMap;
import java.util.Map;

public final class ThemeManager {
	private final Map<Theme.Preset, Theme> presets = new EnumMap<>(Theme.Preset.class);
	private Theme current = Theme.astralWhite();

	public void registerDefaults() {
		presets.put(Theme.Preset.ASTRAL_WHITE, Theme.astralWhite());
		presets.put(Theme.Preset.DARK_GLASS, Theme.darkGlass());
		presets.put(Theme.Preset.MIDNIGHT, Theme.midnight());
		presets.put(Theme.Preset.MINIMAL, Theme.minimal());
		presets.put(Theme.Preset.CUSTOM, Theme.astralWhite());
		presets.get(Theme.Preset.CUSTOM).preset = Theme.Preset.CUSTOM;
		current = presets.get(Theme.Preset.ASTRAL_WHITE).copy();
	}

	public Theme current() {
		return current;
	}

	public void apply(Theme.Preset preset) {
		Theme source = presets.getOrDefault(preset, Theme.astralWhite());
		current = source.copy();
		if (AstralBlaze.toasts() != null) {
			AstralBlaze.toasts().push("Theme", preset.display());
		}
		if (AstralBlaze.config() != null) {
			AstralBlaze.config().markDirty();
		}
	}

	public void setAccent(int argb) {
		current.accent = argb | 0xFF000000;
		current.preset = Theme.Preset.CUSTOM;
		if (AstralBlaze.config() != null) {
			AstralBlaze.config().markDirty();
		}
	}

	public JsonObject toJson() {
		JsonObject json = new JsonObject();
		json.add("current", current.toJson());
		JsonObject stored = new JsonObject();
		for (Map.Entry<Theme.Preset, Theme> e : presets.entrySet()) {
			stored.add(e.getKey().name(), e.getValue().toJson());
		}
		json.add("presets", stored);
		return json;
	}

	public void fromJson(JsonObject json) {
		if (json == null) {
			return;
		}
		if (json.has("current") && json.get("current").isJsonObject()) {
			current.fromJson(json.getAsJsonObject("current"));
		}
		if (json.has("presets") && json.get("presets").isJsonObject()) {
			JsonObject stored = json.getAsJsonObject("presets");
			for (Theme.Preset preset : Theme.Preset.values()) {
				if (stored.has(preset.name())) {
					Theme t = presets.get(preset);
					if (t != null) {
						t.fromJson(stored.getAsJsonObject(preset.name()));
					}
				}
			}
		}
	}
}
