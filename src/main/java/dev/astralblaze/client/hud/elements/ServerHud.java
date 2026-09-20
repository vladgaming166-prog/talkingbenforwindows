package dev.astralblaze.client.hud.elements;

import dev.astralblaze.client.core.ModuleCategory;
import dev.astralblaze.client.hud.HudElement;
import dev.astralblaze.client.perf.ClientStats;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;

public final class ServerHud extends HudElement {
	public ServerHud() {
		super("Server", "Current server or singleplayer world.", ModuleCategory.SOCIAL, true, 0.78F, 0.86F);
	}

	@Override
	protected int[] renderContent(GuiGraphics g, Minecraft mc, float tickDelta, boolean editor) {
		return drawTextPanel(g, mc, ClientStats.server());
	}
}
