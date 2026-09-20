package dev.astralblaze.client.hud.elements;

import dev.astralblaze.client.core.ModuleCategory;
import dev.astralblaze.client.core.setting.BooleanSetting;
import dev.astralblaze.client.core.setting.EnumSetting;
import dev.astralblaze.client.core.setting.NumberSetting;
import dev.astralblaze.client.flags.VisualFlags;
import dev.astralblaze.client.hud.HudElement;
import dev.astralblaze.client.ui.render.ColorUtil;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;

public final class CrosshairHud extends HudElement {
	public enum Shape { CROSS, CIRCLE, SQUARE, T, DOT }

	private final EnumSetting<Shape> shape = add(new EnumSetting<>("Shape", "Crosshair shape.", Shape.CROSS));
	private final NumberSetting size = add(new NumberSetting("Size", "Arm length or radius.", 6, 1, 20, 1));
	private final NumberSetting thickness = add(new NumberSetting("Thickness", "Stroke width.", 2, 1, 6, 1));
	private final NumberSetting gap = add(new NumberSetting("Gap", "Center gap.", 3, 0, 12, 1));
	private final BooleanSetting outline = add(new BooleanSetting("Outline", "1px contrasting outline.", true));
	private final BooleanSetting dot = add(new BooleanSetting("Center dot", "Draw a center dot.", true));
	private final BooleanSetting dynamic = add(new BooleanSetting("Dynamic", "Expand while attacking or using items.", true));

	public CrosshairHud() {
		super("Crosshair", "Client-side custom crosshair. Purely visual.", ModuleCategory.PVP, true, 0.5F, 0.5F);
		background.set(false);
		border.set(false);
		style.set(Style.TEXT_ONLY);
		color.set(0xFFFFFFFF);
	}

	@Override
	protected void onEnable() {
		VisualFlags.customCrosshair = true;
	}

	@Override
	protected void onDisable() {
		VisualFlags.customCrosshair = false;
	}

	@Override
	protected int[] renderContent(GuiGraphics g, Minecraft mc, float tickDelta, boolean editor) {
		int s = size.intValue();
		int t = thickness.intValue();
		int gp = gap.intValue();
		if (dynamic.get() && mc.player != null && (mc.player.swinging || mc.options.keyUse.isDown())) {
			gp += 3;
		}
		int col = ColorUtil.scaleAlpha(color.get(), opacity.floatValue());
		int out = outline.get() ? ColorUtil.argb(ColorUtil.alpha(col), 0, 0, 0) : 0;
		int span = s + gp;
		drawShape(g, 0, 0, s, t, gp, col, out);
		int box = (span + t + 2) * 2;
		return new int[]{box, box};
	}

	public void renderCentered(GuiGraphics g, Minecraft mc, int sw, int sh) {
		if (!enabled()) {
			return;
		}
		int s = size.intValue();
		int t = thickness.intValue();
		int gp = gap.intValue();
		if (dynamic.get() && mc.player != null && (mc.player.swinging || mc.options.keyUse.isDown())) {
			gp += 3;
		}
		int col = ColorUtil.scaleAlpha(color.get(), opacity.floatValue());
		int out = outline.get() ? ColorUtil.argb(Math.min(220, ColorUtil.alpha(col)), 0, 0, 0) : 0;
		int cx = sw / 2;
		int cy = sh / 2;
		drawShape(g, cx, cy, s, t, gp, col, out);
	}

	private void drawShape(GuiGraphics g, int cx, int cy, int s, int t, int gp, int col, int out) {
		switch (shape.get()) {
			case CROSS -> {
				rect(g, cx - t / 2, cy - gp - s, t, s, col, out);
				rect(g, cx - t / 2, cy + gp, t, s, col, out);
				rect(g, cx - gp - s, cy - t / 2, s, t, col, out);
				rect(g, cx + gp, cy - t / 2, s, t, col, out);
			}
			case T -> {
				rect(g, cx - s - gp, cy - t / 2, (s + gp) * 2 + t, t, col, out);
				rect(g, cx - t / 2, cy + gp, t, s, col, out);
			}
			case SQUARE -> {
				int half = s + gp;
				rect(g, cx - half, cy - half, half * 2, t, col, out);
				rect(g, cx - half, cy + half - t, half * 2, t, col, out);
				rect(g, cx - half, cy - half, t, half * 2, col, out);
				rect(g, cx + half - t, cy - half, t, half * 2, col, out);
			}
			case CIRCLE -> {
				int r = s + gp;
				for (int i = 0; i < 32; i++) {
					double a0 = i / 32.0 * Math.PI * 2;
					double a1 = (i + 1) / 32.0 * Math.PI * 2;
					int x0 = cx + (int) Math.round(Math.cos(a0) * r);
					int y0 = cy + (int) Math.round(Math.sin(a0) * r);
					int x1 = cx + (int) Math.round(Math.cos(a1) * r);
					int y1 = cy + (int) Math.round(Math.sin(a1) * r);
					g.fill(x0, y0, x0 + t, y0 + t, col);
					g.fill(x1, y1, x1 + t, y1 + t, col);
				}
			}
			case DOT -> {
			}
		}
		if (dot.get() || shape.get() == Shape.DOT) {
			rect(g, cx - 1, cy - 1, 2, 2, col, out);
		}
	}

	private static void rect(GuiGraphics g, int x, int y, int w, int h, int col, int out) {
		if (out != 0) {
			g.fill(x - 1, y - 1, x + w + 1, y + h + 1, out);
		}
		g.fill(x, y, x + w, y + h, col);
	}
}
