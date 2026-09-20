package dev.astralblaze.client.hud.elements;

import dev.astralblaze.client.core.ModuleCategory;
import dev.astralblaze.client.core.setting.EnumSetting;
import dev.astralblaze.client.hud.HudElement;
import dev.astralblaze.client.perf.ClientStats;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;

public final class FpsHud extends HudElement {
	public enum Mode { FPS_ONLY, FPS_MIN, FPS_AVG, FPS_MAX }

	private final EnumSetting<Mode> mode = add(new EnumSetting<>("Mode", "Which FPS statistics to show.", Mode.FPS_ONLY));

	public FpsHud() {
		super("FPS", "Polished FPS counter with optional min/avg/max.", ModuleCategory.HUD, true, 0.012F, 0.012F);
	}

	@Override
	protected int[] renderContent(GuiGraphics g, Minecraft mc, float tickDelta, boolean editor) {
		String primary = ClientStats.fpsText();
		String extra = switch (mode.get()) {
			case FPS_ONLY -> null;
			case FPS_MIN -> "min " + ClientStats.minFps();
			case FPS_AVG -> "avg " + Math.round(ClientStats.avgFps());
			case FPS_MAX -> "max " + ClientStats.maxFps();
		};
		return drawTextPanel(g, mc, primary, extra);
	}
}
