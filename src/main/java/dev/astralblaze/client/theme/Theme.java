package dev.astralblaze.client.theme;

import com.google.gson.JsonObject;
import dev.astralblaze.client.ui.render.ColorUtil;

public final class Theme {
	public enum Preset {
		ASTRAL_WHITE("Astral White"),
		DARK_GLASS("Dark Glass"),
		MIDNIGHT("Midnight"),
		MINIMAL("Minimal"),
		CUSTOM("Custom");

		private final String display;

		Preset(String display) {
			this.display = display;
		}

		public String display() {
			return display;
		}
	}

	public Preset preset = Preset.ASTRAL_WHITE;
	public int accent = 0xFF5B7CFA;
	public float backgroundOpacity = 0.72F;
	public float panelOpacity = 0.88F;
	public float borderOpacity = 0.35F;
	public int cornerRadius = 14;
	public float blurStrength = 0.45F;
	public float shadowStrength = 0.28F;
	public float animationSpeed = 1.0F;

	public static Theme astralWhite() {
		Theme t = new Theme();
		t.preset = Preset.ASTRAL_WHITE;
		t.accent = 0xFF5B7CFA;
		t.backgroundOpacity = 0.55F;
		t.panelOpacity = 0.90F;
		t.borderOpacity = 0.40F;
		t.cornerRadius = 16;
		t.blurStrength = 0.35F;
		t.shadowStrength = 0.18F;
		return t;
	}

	public static Theme darkGlass() {
		Theme t = new Theme();
		t.preset = Preset.DARK_GLASS;
		t.accent = 0xFF8AA4FF;
		t.backgroundOpacity = 0.62F;
		t.panelOpacity = 0.78F;
		t.borderOpacity = 0.28F;
		t.cornerRadius = 16;
		t.blurStrength = 0.5F;
		t.shadowStrength = 0.35F;
		return t;
	}

	public static Theme midnight() {
		Theme t = new Theme();
		t.preset = Preset.MIDNIGHT;
		t.accent = 0xFF6E8CFF;
		t.backgroundOpacity = 0.82F;
		t.panelOpacity = 0.94F;
		t.borderOpacity = 0.22F;
		t.cornerRadius = 12;
		t.blurStrength = 0.25F;
		t.shadowStrength = 0.4F;
		return t;
	}

	public static Theme minimal() {
		Theme t = new Theme();
		t.preset = Preset.MINIMAL;
		t.accent = 0xFF4E6EF2;
		t.backgroundOpacity = 0.35F;
		t.panelOpacity = 0.96F;
		t.borderOpacity = 0.18F;
		t.cornerRadius = 8;
		t.blurStrength = 0.0F;
		t.shadowStrength = 0.08F;
		t.animationSpeed = 0.7F;
		return t;
	}

	public boolean light() {
		return preset == Preset.ASTRAL_WHITE || preset == Preset.MINIMAL || preset == Preset.CUSTOM && ColorUtil.red(panelFill()) > 140;
	}

	public int overlay() {
		if (light()) {
			return ColorUtil.argb(Math.round(210 * backgroundOpacity), 246, 248, 252);
		}
		return ColorUtil.argb(Math.round(220 * backgroundOpacity), 8, 10, 14);
	}

	public int panelFill() {
		if (preset == Preset.ASTRAL_WHITE) {
			return ColorUtil.argb(Math.round(255 * panelOpacity), 255, 255, 255);
		}
		if (preset == Preset.MINIMAL) {
			return ColorUtil.argb(Math.round(255 * panelOpacity), 252, 252, 253);
		}
		if (preset == Preset.MIDNIGHT) {
			return ColorUtil.argb(Math.round(255 * panelOpacity), 12, 14, 18);
		}
		if (preset == Preset.DARK_GLASS) {
			return ColorUtil.argb(Math.round(255 * panelOpacity), 22, 24, 32);
		}
		return ColorUtil.argb(Math.round(255 * panelOpacity), 250, 250, 252);
	}

	public int panelAlt() {
		return ColorUtil.scaleAlpha(panelFill(), 0.82F);
	}

	public int sidebar() {
		if (light()) {
			return ColorUtil.argb(Math.round(245 * panelOpacity), 255, 255, 255);
		}
		return ColorUtil.argb(Math.round(250 * panelOpacity), 16, 18, 24);
	}

	public int border() {
		if (light()) {
			return ColorUtil.argb(Math.round(255 * borderOpacity), 210, 216, 228);
		}
		return ColorUtil.argb(Math.round(255 * borderOpacity), 255, 255, 255);
	}

	public int text() {
		return light() ? 0xFF1F2430 : 0xFFF4F6FA;
	}

	public int textMuted() {
		return light() ? 0xFF7A8190 : 0xFF9AA3B5;
	}

	public int shadow() {
		int a = Math.round(70 * shadowStrength);
		return ColorUtil.argb(a, 16, 20, 32);
	}

	public int accent() {
		return accent | 0xFF000000;
	}

	public int accentSoft() {
		return ColorUtil.scaleAlpha(accent(), 0.18F);
	}

	public int hover() {
		return light() ? 0x14FFFFFF : 0x22FFFFFF;
	}

	public int danger() {
		return 0xFFE05D5D;
	}

	public JsonObject toJson() {
		JsonObject json = new JsonObject();
		json.addProperty("preset", preset.name());
		json.addProperty("accent", ColorUtil.toHex(accent));
		json.addProperty("backgroundOpacity", backgroundOpacity);
		json.addProperty("panelOpacity", panelOpacity);
		json.addProperty("borderOpacity", borderOpacity);
		json.addProperty("cornerRadius", cornerRadius);
		json.addProperty("blurStrength", blurStrength);
		json.addProperty("shadowStrength", shadowStrength);
		json.addProperty("animationSpeed", animationSpeed);
		return json;
	}

	public void fromJson(JsonObject json) {
		if (json == null) {
			return;
		}
		if (json.has("preset")) {
			try {
				preset = Preset.valueOf(json.get("preset").getAsString());
			} catch (IllegalArgumentException ignored) {
			}
		}
		if (json.has("accent")) {
			Integer parsed = ColorUtil.parseHex(json.get("accent").getAsString());
			if (parsed != null) {
				accent = parsed;
			}
		}
		if (json.has("backgroundOpacity")) backgroundOpacity = json.get("backgroundOpacity").getAsFloat();
		if (json.has("panelOpacity")) panelOpacity = json.get("panelOpacity").getAsFloat();
		if (json.has("borderOpacity")) borderOpacity = json.get("borderOpacity").getAsFloat();
		if (json.has("cornerRadius")) cornerRadius = json.get("cornerRadius").getAsInt();
		if (json.has("blurStrength")) blurStrength = json.get("blurStrength").getAsFloat();
		if (json.has("shadowStrength")) shadowStrength = json.get("shadowStrength").getAsFloat();
		if (json.has("animationSpeed")) animationSpeed = json.get("animationSpeed").getAsFloat();
	}

	public Theme copy() {
		Theme t = new Theme();
		t.preset = preset;
		t.accent = accent;
		t.backgroundOpacity = backgroundOpacity;
		t.panelOpacity = panelOpacity;
		t.borderOpacity = borderOpacity;
		t.cornerRadius = cornerRadius;
		t.blurStrength = blurStrength;
		t.shadowStrength = shadowStrength;
		t.animationSpeed = animationSpeed;
		return t;
	}
}
