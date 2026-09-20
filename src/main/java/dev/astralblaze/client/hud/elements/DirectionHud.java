package dev.astralblaze.client.hud.elements;

import dev.astralblaze.client.core.ModuleCategory;
import dev.astralblaze.client.core.setting.BooleanSetting;
import dev.astralblaze.client.hud.HudElement;
import dev.astralblaze.client.perf.ClientStats;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;

public final class DirectionHud extends HudElement {
	private final BooleanSetting full = add(new BooleanSetting("Full name", "Show North instead of N.", false));

	public DirectionHud() {
		super("Direction", "Compass facing: N S E W and diagonals.", ModuleCategory.WORLD, true, 0.46F, 0.012F);
	}

	@Override
	protected int[] renderContent(GuiGraphics g, Minecraft mc, float tickDelta, boolean editor) {
		return drawTextPanel(g, mc, full.get() ? ClientStats.facingFull() : ClientStats.facing());
	}
}
