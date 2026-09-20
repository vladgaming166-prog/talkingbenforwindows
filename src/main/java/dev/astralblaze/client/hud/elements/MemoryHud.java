package dev.astralblaze.client.hud.elements;

import dev.astralblaze.client.core.ModuleCategory;
import dev.astralblaze.client.hud.HudElement;
import dev.astralblaze.client.perf.ClientStats;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;

public final class MemoryHud extends HudElement {
	public MemoryHud() {
		super("Memory", "Used / allocated Java heap.", ModuleCategory.MISC, false, 0.012F, 0.80F);
	}

	@Override
	protected int[] renderContent(GuiGraphics g, Minecraft mc, float tickDelta, boolean editor) {
		return drawTextPanel(g, mc, ClientStats.ramText());
	}
}
