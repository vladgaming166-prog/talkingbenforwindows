package dev.astralblaze.client.hud.elements;

import dev.astralblaze.client.core.ModuleCategory;
import dev.astralblaze.client.hud.HudElement;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;

public final class StatusHud extends HudElement {
	public StatusHud() {
		super("Status", "Sprint, sneak, flying and on-ground state.", ModuleCategory.PVP, false, 0.40F, 0.86F);
	}

	@Override
	protected int[] renderContent(GuiGraphics g, Minecraft mc, float tickDelta, boolean editor) {
		if (mc.player == null) {
			return drawTextPanel(g, mc, "Status");
		}
		StringBuilder b = new StringBuilder();
		if (mc.player.isSprinting()) b.append("Sprint  ");
		if (mc.player.isCrouching()) b.append("Sneak  ");
		if (mc.player.getAbilities().flying) b.append("Fly  ");
		if (mc.player.onGround()) b.append("Ground");
		else b.append("Air");
		return drawTextPanel(g, mc, b.toString().trim());
	}
}
