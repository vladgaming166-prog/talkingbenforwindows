package dev.astralblaze.client.hud.elements;

import dev.astralblaze.client.core.ModuleCategory;
import dev.astralblaze.client.hud.HudElement;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

public final class ClockHud extends HudElement {
	private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("HH:mm:ss");
	private String cached = "";
	private int lastSec = -1;

	public ClockHud() {
		super("Clock", "Real-world session clock.", ModuleCategory.MISC, false, 0.88F, 0.012F);
	}

	@Override
	protected int[] renderContent(GuiGraphics g, Minecraft mc, float tickDelta, boolean editor) {
		LocalTime now = LocalTime.now();
		if (now.getSecond() != lastSec) {
			lastSec = now.getSecond();
			cached = now.format(FMT);
		}
		return drawTextPanel(g, mc, cached);
	}
}
