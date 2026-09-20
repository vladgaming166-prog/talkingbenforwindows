package dev.astralblaze.client.core.setting;

import com.google.gson.JsonElement;
import com.google.gson.JsonPrimitive;
import org.lwjgl.glfw.GLFW;

public final class KeybindSetting extends Setting<Integer> {
	public static final int UNBOUND = GLFW.GLFW_KEY_UNKNOWN;

	public KeybindSetting(String name, String description, int defaultKey) {
		super(name, description, defaultKey);
	}

	public boolean isUnbound() {
		return get() == null || get() == UNBOUND;
	}

	public String label() {
		int key = get();
		if (key == UNBOUND) {
			return "None";
		}
		String name = GLFW.glfwGetKeyName(key, 0);
		if (name != null && !name.isBlank()) {
			return name.toUpperCase();
		}
		return switch (key) {
			case GLFW.GLFW_KEY_RIGHT_SHIFT -> "RSHIFT";
			case GLFW.GLFW_KEY_LEFT_SHIFT -> "LSHIFT";
			case GLFW.GLFW_KEY_RIGHT_CONTROL -> "RCTRL";
			case GLFW.GLFW_KEY_LEFT_CONTROL -> "LCTRL";
			case GLFW.GLFW_KEY_RIGHT_ALT -> "RALT";
			case GLFW.GLFW_KEY_LEFT_ALT -> "LALT";
			case GLFW.GLFW_KEY_SPACE -> "SPACE";
			case GLFW.GLFW_MOUSE_BUTTON_LEFT -> "LMB";
			case GLFW.GLFW_MOUSE_BUTTON_RIGHT -> "RMB";
			case GLFW.GLFW_MOUSE_BUTTON_MIDDLE -> "MMB";
			default -> "KEY " + key;
		};
	}

	@Override
	public JsonElement toJson() {
		return new JsonPrimitive(get());
	}

	@Override
	public void fromJson(JsonElement element) {
		if (element != null && element.isJsonPrimitive()) {
			set(element.getAsInt());
		}
	}
}
