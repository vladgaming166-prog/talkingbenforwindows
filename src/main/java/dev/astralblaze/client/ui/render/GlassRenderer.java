package dev.astralblaze.client.ui.render;

import dev.astralblaze.client.AstralBlaze;
import dev.astralblaze.client.flags.VisualFlags;
import dev.astralblaze.client.theme.Theme;
import net.minecraft.client.gui.Font;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.renderer.RenderPipelines;
import net.minecraft.resources.Identifier;
import net.minecraft.util.Mth;

/**
 * Cached 9-slice rounded glass drawing. Textures are shipped in the jar and never reloaded per frame.
 */
public final class GlassRenderer {
	private static final int[] RADII = {4, 6, 8, 10, 12, 14, 16, 18, 20, 24};
	private static final Identifier WHITE = AstralBlaze.id("textures/gui/white.png");
	private static final Identifier LOGO = AstralBlaze.id("textures/gui/logo.png");

	private GlassRenderer() {
	}

	public static Theme theme() {
		return AstralBlaze.themes() == null ? Theme.astralWhite() : AstralBlaze.themes().current();
	}

	public static Identifier logo() {
		return LOGO;
	}

	public static void logo(GuiGraphics g, int x, int y, int size) {
		g.blit(RenderPipelines.GUI_TEXTURED, LOGO, x, y, 0, 0, size, size, 128, 128);
	}

	public static void panel(GuiGraphics g, int x, int y, int w, int h) {
		Theme t = theme();
		panel(g, x, y, w, h, t.cornerRadius, t.panelFill(), t.border(), t.shadow());
	}

	public static void panel(GuiGraphics g, int x, int y, int w, int h, int radius, int fill, int border, int shadow) {
		if (w <= 0 || h <= 0) {
			return;
		}
		if (ColorUtil.alpha(shadow) > 0) {
			rounded(g, x + 1, y + 3, w, h, radius + 1, shadow);
		}
		if (ColorUtil.alpha(border) > 0) {
			rounded(g, x, y, w, h, radius, border);
			rounded(g, x + 1, y + 1, w - 2, h - 2, Math.max(1, radius - 1), fill);
		} else {
			rounded(g, x, y, w, h, radius, fill);
		}
		int highlight = ColorUtil.argb(Math.min(90, ColorUtil.alpha(fill) / 3), 255, 255, 255);
		if (h > 6 && w > radius * 2) {
			g.fill(x + radius, y + 1, x + w - radius, y + 2, highlight);
		}
	}

	public static void rounded(GuiGraphics g, int x, int y, int w, int h, int radius, int argb) {
		if (w <= 0 || h <= 0 || ColorUtil.alpha(argb) <= 0) {
			return;
		}
		if (radius <= 1) {
			g.fill(x, y, x + w, y + h, argb);
			return;
		}
		int r = snapRadius(Math.min(radius, Math.min(w, h) / 2));
		Identifier tex = AstralBlaze.id("textures/gui/round_" + r + ".png");
		int size = r * 2 + 1;
		int midW = Math.max(0, w - 2 * r);
		int midH = Math.max(0, h - 2 * r);
		blit(g, tex, x, y, 0, 0, r, r, r, r, size, size, argb);
		if (midW > 0) {
			blit(g, tex, x + r, y, r, 0, midW, r, 1, r, size, size, argb);
		}
		blit(g, tex, x + r + midW, y, r + 1, 0, r, r, r, r, size, size, argb);
		if (midH > 0) {
			blit(g, tex, x, y + r, 0, r, r, midH, r, 1, size, size, argb);
			if (midW > 0) {
				blit(g, tex, x + r, y + r, r, r, midW, midH, 1, 1, size, size, argb);
			}
			blit(g, tex, x + r + midW, y + r, r + 1, r, r, midH, r, 1, size, size, argb);
		}
		blit(g, tex, x, y + r + midH, 0, r + 1, r, r, r, r, size, size, argb);
		if (midW > 0) {
			blit(g, tex, x + r, y + r + midH, r, r + 1, midW, r, 1, r, size, size, argb);
		}
		blit(g, tex, x + r + midW, y + r + midH, r + 1, r + 1, r, r, r, r, size, size, argb);
	}

	public static void fill(GuiGraphics g, int x, int y, int w, int h, int argb) {
		if (w <= 0 || h <= 0) {
			return;
		}
		g.fill(x, y, x + w, y + h, argb);
	}

	public static void text(GuiGraphics g, Font font, String text, int x, int y, int color, boolean shadow) {
		g.drawString(font, text, x, y, color, shadow);
	}

	public static void text(GuiGraphics g, Font font, String text, int x, int y, int color) {
		text(g, font, text, x, y, color, false);
	}

	public static int textWidth(Font font, String text) {
		return font.width(text);
	}

	public static void centered(GuiGraphics g, Font font, String text, int cx, int y, int color) {
		g.drawString(font, text, cx - font.width(text) / 2, y, color, false);
	}

	public static float lerp(float from, float to, float speed) {
		if (VisualFlags.reduceMotion || VisualFlags.reduceGuiMotion) {
			return to;
		}
		float t = Mth.clamp(speed, 0F, 1F);
		return from + (to - from) * t;
	}

	public static int snapRadius(int radius) {
		int best = RADII[0];
		int dist = Math.abs(radius - best);
		for (int r : RADII) {
			int d = Math.abs(radius - r);
			if (d < dist) {
				best = r;
				dist = d;
			}
		}
		return best;
	}

	private static void blit(GuiGraphics g, Identifier id, int x, int y, float u, float v, int w, int h, int regionW, int regionH, int texW, int texH, int color) {
		if (w <= 0 || h <= 0) {
			return;
		}
		g.blit(RenderPipelines.GUI_TEXTURED, id, x, y, u, v, w, h, regionW, regionH, texW, texH, color);
	}
}
