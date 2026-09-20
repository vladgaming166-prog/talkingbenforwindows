package dev.astralblaze.client.hud.elements;

import dev.astralblaze.client.core.ModuleCategory;
import dev.astralblaze.client.core.setting.BooleanSetting;
import dev.astralblaze.client.hud.HudElement;
import dev.astralblaze.client.perf.ClientStats;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;

public final class PingHud extends HudElement {
	private final BooleanSetting icon = add(new BooleanSetting("Icon", "Prefix ping with a signal glyph.", true));

	public PingHud() {
		super("Ping", "Displays connection latency from the tab list. No extra packets.", ModuleCategory.HUD, true, 0.012F, 0.055F);
	}

	@Override
	protected int[] renderContent(GuiGraphics g, Minecraft mc, float tickDelta, boolean editor) {
		String text = (icon.get() ? "● " : "") + ClientStats.pingText();
		return drawTextPanel(g, mc, text);
	}
}
