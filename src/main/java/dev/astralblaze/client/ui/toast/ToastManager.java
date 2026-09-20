package dev.astralblaze.client.ui.toast;

import dev.astralblaze.client.AstralBlaze;
import dev.astralblaze.client.theme.Theme;
import dev.astralblaze.client.ui.render.ColorUtil;
import dev.astralblaze.client.ui.render.GlassRenderer;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.util.Mth;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

public final class ToastManager {
	private static final int MAX = 5;
	private final List<Toast> toasts = new ArrayList<>(MAX);
	public int durationMs = 2400;

	public void push(String title, String body) {
		if (toasts.size() >= MAX) {
			toasts.remove(0);
		}
		toasts.add(new Toast(title, body, System.currentTimeMillis()));
	}

	public void render(GuiGraphics g, int width, int height) {
		if (toasts.isEmpty()) {
			return;
		}
		Minecraft mc = Minecraft.getInstance();
		Theme theme = GlassRenderer.theme();
		long now = System.currentTimeMillis();
		int y = 18;
		Iterator<Toast> it = toasts.iterator();
		while (it.hasNext()) {
			Toast toast = it.next();
			float life = (now - toast.at) / (float) durationMs;
			if (life >= 1F) {
				it.remove();
				continue;
			}
			float appear = Mth.clamp(life * 10F, 0F, 1F);
			float fade = life > 0.78F ? 1F - (life - 0.78F) / 0.22F : 1F;
			float a = appear * fade;
			int w = 196;
			int h = 40;
			int x = width - w - 16;
			int drawY = y;
			GlassRenderer.panel(g, x, drawY, w, h, theme.cornerRadius, ColorUtil.scaleAlpha(theme.panelFill(), a), ColorUtil.scaleAlpha(theme.border(), a), ColorUtil.scaleAlpha(theme.shadow(), a));
			g.fill(x + 8, drawY + 10, x + 11, drawY + h - 10, ColorUtil.scaleAlpha(theme.accent(), a));
			GlassRenderer.text(g, mc.font, toast.title, x + 18, drawY + 8, ColorUtil.scaleAlpha(theme.text(), a));
			GlassRenderer.text(g, mc.font, toast.body, x + 18, drawY + 22, ColorUtil.scaleAlpha(theme.textMuted(), a));
			y += 48;
		}
	}

	private record Toast(String title, String body, long at) {
	}
}
