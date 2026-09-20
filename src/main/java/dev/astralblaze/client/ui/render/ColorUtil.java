package dev.astralblaze.client.ui.render;

public final class ColorUtil {
	private ColorUtil() {
	}

	public static int alpha(int argb) {
		return (argb >>> 24) & 0xFF;
	}

	public static int red(int argb) {
		return (argb >>> 16) & 0xFF;
	}

	public static int green(int argb) {
		return (argb >>> 8) & 0xFF;
	}

	public static int blue(int argb) {
		return argb & 0xFF;
	}

	public static int argb(int a, int r, int g, int b) {
		return ((a & 0xFF) << 24) | ((r & 0xFF) << 16) | ((g & 0xFF) << 8) | (b & 0xFF);
	}

	public static int rgb(int r, int g, int b) {
		return argb(255, r, g, b);
	}

	public static int withAlpha(int argb, int a) {
		return (a & 0xFF) << 24 | (argb & 0x00FFFFFF);
	}

	public static int scaleAlpha(int argb, float mul) {
		int a = Math.max(0, Math.min(255, Math.round(alpha(argb) * mul)));
		return withAlpha(argb, a);
	}

	public static int lerp(int from, int to, float t) {
		t = t < 0 ? 0 : (t > 1 ? 1 : t);
		int a = Math.round(alpha(from) + (alpha(to) - alpha(from)) * t);
		int r = Math.round(red(from) + (red(to) - red(from)) * t);
		int g = Math.round(green(from) + (green(to) - green(from)) * t);
		int b = Math.round(blue(from) + (blue(to) - blue(from)) * t);
		return argb(a, r, g, b);
	}

	public static int mulOpacity(int argb, float opacity) {
		return scaleAlpha(argb, opacity);
	}

	public static String toHex(int argb) {
		return String.format("#%08X", argb);
	}

	public static Integer parseHex(String raw) {
		if (raw == null) {
			return null;
		}
		String s = raw.trim();
		if (s.startsWith("#")) {
			s = s.substring(1);
		}
		try {
			if (s.length() == 6) {
				return 0xFF000000 | Integer.parseInt(s, 16);
			}
			if (s.length() == 8) {
				return (int) Long.parseLong(s, 16);
			}
		} catch (NumberFormatException ignored) {
		}
		return null;
	}

	public static int hsva(float h, float s, float v, int a) {
		h = ((h % 360F) + 360F) % 360F;
		s = clamp01(s);
		v = clamp01(v);
		float c = v * s;
		float x = c * (1 - Math.abs((h / 60F) % 2 - 1));
		float m = v - c;
		float r = 0, g = 0, b = 0;
		if (h < 60) {
			r = c; g = x;
		} else if (h < 120) {
			r = x; g = c;
		} else if (h < 180) {
			g = c; b = x;
		} else if (h < 240) {
			g = x; b = c;
		} else if (h < 300) {
			r = x; b = c;
		} else {
			r = c; b = x;
		}
		return argb(a, Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255));
	}

	public static float[] rgbToHsv(int argb) {
		float r = red(argb) / 255F;
		float g = green(argb) / 255F;
		float b = blue(argb) / 255F;
		float max = Math.max(r, Math.max(g, b));
		float min = Math.min(r, Math.min(g, b));
		float d = max - min;
		float h;
		if (d == 0) {
			h = 0;
		} else if (max == r) {
			h = 60 * (((g - b) / d) % 6);
		} else if (max == g) {
			h = 60 * (((b - r) / d) + 2);
		} else {
			h = 60 * (((r - g) / d) + 4);
		}
		if (h < 0) {
			h += 360;
		}
		float s = max == 0 ? 0 : d / max;
		return new float[]{h, s, max};
	}

	private static float clamp01(float v) {
		return v < 0 ? 0 : (v > 1 ? 1 : v);
	}
}
