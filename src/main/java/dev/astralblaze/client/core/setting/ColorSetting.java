package dev.astralblaze.client.core.setting;

import com.google.gson.JsonElement;
import com.google.gson.JsonPrimitive;
import dev.astralblaze.client.ui.render.ColorUtil;

public final class ColorSetting extends Setting<Integer> {
	public ColorSetting(String name, String description, int defaultArgb) {
		super(name, description, defaultArgb);
	}

	public int rgb() {
		return get() | 0xFF000000;
	}

	@Override
	public JsonElement toJson() {
		return new JsonPrimitive(ColorUtil.toHex(get()));
	}

	@Override
	public void fromJson(JsonElement element) {
		if (element == null || !element.isJsonPrimitive()) {
			return;
		}
		if (element.getAsJsonPrimitive().isNumber()) {
			set(element.getAsInt());
			return;
		}
		Integer parsed = ColorUtil.parseHex(element.getAsString());
		if (parsed != null) {
			set(parsed);
		}
	}
}
