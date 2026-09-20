package dev.astralblaze.client.hud.elements;

import dev.astralblaze.client.core.ModuleCategory;
import dev.astralblaze.client.hud.HudElement;
import dev.astralblaze.client.perf.ClientStats;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;

public final class SpeedHud extends HudElement {
	public SpeedHud() {
		super("Speed", "Horizontal speed in blocks per second.", ModuleCategory.MOVEMENT, false, 0.012F, 0.74F);
	}

	@Override
	protected int[] renderContent(GuiGraphics g, Minecraft mc, float tickDelta, boolean editor) {
		return drawTextPanel(g, mc, ClientStats.speedText());
	}
}
