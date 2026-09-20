package dev.astralblaze.client.hud.elements;

import dev.astralblaze.client.core.ModuleCategory;
import dev.astralblaze.client.hud.HudElement;
import dev.astralblaze.client.input.CpsTracker;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;

public final class CpsHud extends HudElement {
	public CpsHud() {
		super("CPS", "Left and right clicks per second. Display only.", ModuleCategory.PVP, true, 0.012F, 0.38F);
	}

	@Override
	protected int[] renderContent(GuiGraphics g, Minecraft mc, float tickDelta, boolean editor) {
		return drawTextPanel(g, mc, "L " + CpsTracker.left() + " CPS", "R " + CpsTracker.right() + " CPS");
	}
}
