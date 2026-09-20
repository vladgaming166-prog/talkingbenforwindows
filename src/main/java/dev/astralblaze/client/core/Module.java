package dev.astralblaze.client.core;

import com.google.gson.JsonObject;
import dev.astralblaze.client.AstralBlaze;
import dev.astralblaze.client.core.setting.BooleanSetting;
import dev.astralblaze.client.core.setting.Setting;
import net.minecraft.client.Minecraft;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public abstract class Module {
	private final String name;
	private final String description;
	private final ModuleCategory category;
	private final List<Setting<?>> settings = new ArrayList<>();
	private final BooleanSetting enabled;

	protected Module(String name, String description, ModuleCategory category, boolean defaultEnabled) {
		this.name = name;
		this.description = description;
		this.category = category;
		this.enabled = new BooleanSetting("Enabled", "Turns this feature on or off.", defaultEnabled) {
			@Override
			protected void onChanged() {
				super.onChanged();
				if (get()) {
					onEnable();
				} else {
					onDisable();
				}
			}
		};
	}

	public String name() {
		return name;
	}

	public String description() {
		return description;
	}

	public ModuleCategory category() {
		return category;
	}

	public boolean enabled() {
		return enabled.get();
	}

	public void setEnabled(boolean value) {
		if (enabled.get() == value) {
			return;
		}
		enabled.set(value);
		if (AstralBlaze.toasts() != null) {
			AstralBlaze.toasts().push(name, value ? "Enabled" : "Disabled");
		}
	}

	public void toggle() {
		setEnabled(!enabled());
	}

	protected <S extends Setting<?>> S add(S setting) {
		settings.add(setting);
		return setting;
	}

	public List<Setting<?>> settings() {
		return Collections.unmodifiableList(settings);
	}

	public BooleanSetting enabledSetting() {
		return enabled;
	}

	protected void onEnable() {
	}

	protected void onDisable() {
	}

	public void tick(Minecraft mc) {
	}

	public boolean matches(String query) {
		if (query == null || query.isEmpty()) {
			return true;
		}
		String q = query.toLowerCase();
		if (name.toLowerCase().contains(q) || description.toLowerCase().contains(q) || category.display().toLowerCase().contains(q)) {
			return true;
		}
		for (Setting<?> setting : settings) {
			if (setting.matches(q)) {
				return true;
			}
		}
		return enabled.matches(q);
	}

	public JsonObject toJson() {
		JsonObject json = new JsonObject();
		json.add("enabled", enabled.toJson());
		JsonObject sets = new JsonObject();
		for (Setting<?> setting : settings) {
			sets.add(setting.name(), setting.toJson());
		}
		json.add("settings", sets);
		return json;
	}

	public void fromJson(JsonObject json) {
		if (json == null) {
			return;
		}
		if (json.has("enabled")) {
			enabled.fromJson(json.get("enabled"));
		}
		if (!json.has("settings") || !json.get("settings").isJsonObject()) {
			return;
		}
		JsonObject sets = json.getAsJsonObject("settings");
		for (Setting<?> setting : settings) {
			if (sets.has(setting.name())) {
				setting.fromJson(sets.get(setting.name()));
			}
		}
	}
}
