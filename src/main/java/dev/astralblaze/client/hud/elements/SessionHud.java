package dev.astralblaze.client.hud.elements;

import dev.astralblaze.client.core.ModuleCategory;
import dev.astralblaze.client.hud.HudElement;
import dev.astralblaze.client.perf.ClientStats;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;

public final class SessionHud extends HudElement {
	public SessionHud() {
		super("Session Time", "Time since the client launched.", ModuleCategory.SOCIAL, false, 0.88F, 0.055F);
	}

	@Override
	protected int[] renderContent(GuiGraphics g, Minecraft mc, float tickDelta, boolean editor) {
		return drawTextPanel(g, mc, ClientStats.sessionText());
	}
}
