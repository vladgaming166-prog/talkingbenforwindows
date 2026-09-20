package dev.astralblaze.client.ui;

import dev.astralblaze.client.AstralBlaze;
import dev.astralblaze.client.hud.HudElement;
import dev.astralblaze.client.theme.Theme;
import dev.astralblaze.client.ui.render.ColorUtil;
import dev.astralblaze.client.ui.render.GlassRenderer;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.gui.screens.Screen;
import net.minecraft.client.input.MouseButtonEvent;
import net.minecraft.network.chat.Component;
import net.minecraft.util.Mth;

import java.util.ArrayList;
import java.util.List;

public final class HudEditorScreen extends Screen {
	private final Screen parent;
	private HudElement selected;
	private HudElement dragging;
	private double dragOffX;
	private double dragOffY;
	private int guideX = Integer.MIN_VALUE;
	private int guideY = Integer.MIN_VALUE;

	public HudEditorScreen(Screen parent) {
		super(Component.literal("HUD Editor"));
		this.parent = parent;
	}

	@Override
	public void renderBackground(GuiGraphics graphics, int mouseX, int mouseY, float partialTick) {
		graphics.fill(0, 0, width, height, 0x33000000);
	}

	@Override
	public void render(GuiGraphics g, int mouseX, int mouseY, float delta) {
		super.render(g, mouseX, mouseY, delta);
		Theme theme = GlassRenderer.theme();
		int sw = width;
		int sh = height;
		AstralBlaze.hud().render(g, minecraft, true);

		guideX = Integer.MIN_VALUE;
		guideY = Integer.MIN_VALUE;
		if (dragging != null) {
			snap(dragging, sw, sh);
		}

		for (HudElement el : AstralBlaze.hud().elements()) {
			if (!el.enabled() && el != selected) {
				continue;
			}
			int x = el.lastX();
			int y = el.lastY();
			int w = Math.max(el.lastW(), 12);
			int h = Math.max(el.lastH(), 12);
			int box = el == selected ? theme.accent() : ColorUtil.scaleAlpha(theme.text(), 0.45F);
			g.fill(x - 1, y - 1, x + w + 1, y, box);
			g.fill(x - 1, y + h, x + w + 1, y + h + 1, box);
			g.fill(x - 1, y, x, y + h, box);
			g.fill(x + w, y, x + w + 1, y + h, box);
		}

		if (guideX != Integer.MIN_VALUE) {
			g.fill(guideX, 0, guideX + 1, sh, ColorUtil.scaleAlpha(theme.accent(), 0.7F));
		}
		if (guideY != Integer.MIN_VALUE) {
			g.fill(0, guideY, sw, guideY + 1, ColorUtil.scaleAlpha(theme.accent(), 0.7F));
		}

		GlassRenderer.panel(g, 16, height - 78, 320, 62, 14, theme.panelFill(), theme.border(), theme.shadow());
		GlassRenderer.text(g, font, "HUD Editor", 32, height - 66, theme.text());
		GlassRenderer.text(g, font, "Drag to move · snap to edges and center · Esc to close", 32, height - 50, theme.textMuted());
		if (selected != null) {
			GlassRenderer.text(g, font, selected.name() + "  ·  click Reset to restore position", 32, height - 36, theme.textMuted());
			GlassRenderer.rounded(g, 250, height - 42, 70, 22, 8, theme.accentSoft());
			GlassRenderer.centered(g, font, "Reset", 285, height - 35, theme.accent());
		}
	}

	private void snap(HudElement el, int sw, int sh) {
		int x = el.lastX();
		int y = el.lastY();
		int w = el.lastW();
		int h = el.lastH();
		int cx = x + w / 2;
		int cy = y + h / 2;
		int threshold = 6;
		List<Integer> xs = new ArrayList<>();
		List<Integer> ys = new ArrayList<>();
		xs.add(sw / 2);
		xs.add(8);
		xs.add(sw - 8);
		ys.add(sh / 2);
		ys.add(8);
		ys.add(sh - 8);
		for (HudElement other : AstralBlaze.hud().elements()) {
			if (other == el) continue;
			xs.add(other.lastX());
			xs.add(other.lastX() + other.lastW());
			xs.add(other.lastX() + other.lastW() / 2);
			ys.add(other.lastY());
			ys.add(other.lastY() + other.lastH());
			ys.add(other.lastY() + other.lastH() / 2);
		}
		int nx = x;
		int ny = y;
		for (int gx : xs) {
			if (Math.abs(cx - gx) <= threshold) {
				nx = gx - w / 2;
				guideX = gx;
			} else if (Math.abs(x - gx) <= threshold) {
				nx = gx;
				guideX = gx;
			} else if (Math.abs(x + w - gx) <= threshold) {
				nx = gx - w;
				guideX = gx;
			}
		}
		for (int gy : ys) {
			if (Math.abs(cy - gy) <= threshold) {
				ny = gy - h / 2;
				guideY = gy;
			} else if (Math.abs(y - gy) <= threshold) {
				ny = gy;
				guideY = gy;
			} else if (Math.abs(y + h - gy) <= threshold) {
				ny = gy - h;
				guideY = gy;
			}
		}
		el.setRel(nx / (float) sw, ny / (float) sh);
	}

	@Override
	public boolean mouseClicked(MouseButtonEvent event, boolean doubled) {
		int mx = (int) event.x();
		int my = (int) event.y();
		if (selected != null && inside(mx, my, 250, height - 42, 70, 22)) {
			selected.resetPosition();
			AstralBlaze.config().markDirty();
			return true;
		}
		HudElement hit = AstralBlaze.hud().at(mx, my);
		selected = hit;
		if (hit != null) {
			dragging = hit;
			dragOffX = mx - hit.lastX();
			dragOffY = my - hit.lastY();
			return true;
		}
		return super.mouseClicked(event, doubled);
	}

	@Override
	public boolean mouseReleased(MouseButtonEvent event) {
		if (dragging != null) {
			AstralBlaze.config().markDirty();
		}
		dragging = null;
		return super.mouseReleased(event);
	}

	@Override
	public boolean mouseDragged(MouseButtonEvent event, double dx, double dy) {
		if (dragging != null) {
			float nx = (float) ((event.x() - dragOffX) / width);
			float ny = (float) ((event.y() - dragOffY) / height);
			dragging.setRel(Mth.clamp(nx, 0, 0.95F), Mth.clamp(ny, 0, 0.95F));
			return true;
		}
		return super.mouseDragged(event, dx, dy);
	}

	@Override
	public void onClose() {
		minecraft.setScreen(parent);
		AstralBlaze.config().saveNow();
	}

	@Override
	public boolean isPauseScreen() {
		return false;
	}

	private static boolean inside(int mx, int my, int x, int y, int w, int h) {
		return mx >= x && my >= y && mx <= x + w && my <= y + h;
	}
}
