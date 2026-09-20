package dev.astralblaze.client.hud.elements;

import dev.astralblaze.client.core.ModuleCategory;
import dev.astralblaze.client.core.setting.BooleanSetting;
import dev.astralblaze.client.core.setting.NumberSetting;
import dev.astralblaze.client.hud.HudElement;
import dev.astralblaze.client.theme.Theme;
import dev.astralblaze.client.ui.render.ColorUtil;
import dev.astralblaze.client.ui.render.GlassRenderer;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.Options;
import org.lwjgl.glfw.GLFW;

public final class KeystrokesHud extends HudElement {
	private final BooleanSetting space = add(new BooleanSetting("Space", "Show the jump key.", true));
	private final BooleanSetting mouse = add(new BooleanSetting("Mouse buttons", "Show LMB and RMB.", true));
	private final BooleanSetting extras = add(new BooleanSetting("Sprint / sneak", "Show sprint and sneak keys.", false));
	private final NumberSetting keySize = add(new NumberSetting("Key size", "Size of each key cap.", 22, 14, 40, 1));
	private final NumberSetting spacing = add(new NumberSetting("Spacing", "Gap between keys.", 3, 0, 10, 1));
	private float w, a, s, d, sp, lmb, rmb, spr, snk;

	public KeystrokesHud() {
		super("Keystrokes", "Modern PvP-style WASD, space and mouse indicators.", ModuleCategory.PVP, true, 0.012F, 0.12F);
		style.set(Style.GLASS_PANEL);
	}

	@Override
	protected int[] renderContent(GuiGraphics g, Minecraft mc, float tickDelta, boolean editor) {
		Options opt = mc.options;
		float speed = 18F * tickDelta;
		w = anim(w, down(opt.keyUp.isDown()), speed);
		a = anim(a, down(opt.keyLeft.isDown()), speed);
		s = anim(s, down(opt.keyDown.isDown()), speed);
		d = anim(d, down(opt.keyRight.isDown()), speed);
		sp = anim(sp, down(opt.keyJump.isDown()), speed);
		spr = anim(spr, down(opt.keySprint.isDown()), speed);
		snk = anim(snk, down(opt.keyShift.isDown()), speed);
		long handle = mc.getWindow().handle();
		lmb = anim(lmb, GLFW.glfwGetMouseButton(handle, GLFW.GLFW_MOUSE_BUTTON_LEFT) == GLFW.GLFW_PRESS ? 1F : 0F, speed);
		rmb = anim(rmb, GLFW.glfwGetMouseButton(handle, GLFW.GLFW_MOUSE_BUTTON_RIGHT) == GLFW.GLFW_PRESS ? 1F : 0F, speed);

		int size = keySize.intValue();
		int gap = spacing.intValue();
		int col = size + gap;
		key(g, mc, col, 0, size, "W", w);
		key(g, mc, 0, col, size, "A", a);
		key(g, mc, col, col, size, "S", s);
		key(g, mc, col * 2, col, size, "D", d);
		int y = col * 2;
		int width = col * 2 + size;
		if (space.get()) {
			key(g, mc, 0, y, width, size, "SPACE", sp);
			y += col;
		}
		if (mouse.get()) {
			int half = (width - gap) / 2;
			key(g, mc, 0, y, half, size, "LMB", lmb);
			key(g, mc, half + gap, y, width - half - gap, size, "RMB", rmb);
			y += col;
		}
		if (extras.get()) {
			int half = (width - gap) / 2;
			key(g, mc, 0, y, half, size, "SPR", spr);
			key(g, mc, half + gap, y, width - half - gap, size, "SNK", snk);
			y += col;
		}
		return new int[]{width, y - gap};
	}

	private void key(GuiGraphics g, Minecraft mc, int x, int y, int size, String label, float press) {
		key(g, mc, x, y, size, size, label, press);
	}

	private void key(GuiGraphics g, Minecraft mc, int x, int y, int w, int h, String label, float press) {
		Theme theme = GlassRenderer.theme();
		float op = opacity.floatValue();
		int idle = ColorUtil.scaleAlpha(theme.panelFill(), op * 0.92F);
		int active = ColorUtil.lerp(idle, ColorUtil.scaleAlpha(theme.accent(), op), press);
		int bord = border.get() ? ColorUtil.scaleAlpha(ColorUtil.lerp(theme.border(), theme.accent(), press), op) : 0;
		GlassRenderer.panel(g, x, y, w, h, Math.min(radius.intValue(), h / 2), active, bord, 0);
		int text = ColorUtil.lerp(ColorUtil.scaleAlpha(color.get(), op), 0xFFFFFFFF, press * 0.65F);
		GlassRenderer.centered(g, mc.font, label, x + w / 2, y + (h - 8) / 2, text);
	}

	private static float down(boolean v) {
		return v ? 1F : 0F;
	}

	private static float anim(float cur, float target, float speed) {
		return GlassRenderer.lerp(cur, target, Math.min(1F, speed));
	}
}
