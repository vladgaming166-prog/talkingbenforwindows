package dev.astralblaze.client.hud.elements;

import dev.astralblaze.client.core.ModuleCategory;
import dev.astralblaze.client.core.setting.BooleanSetting;
import dev.astralblaze.client.hud.HudElement;
import dev.astralblaze.client.perf.ClientStats;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;

public final class CoordinatesHud extends HudElement {
	private final BooleanSetting showBiome = add(new BooleanSetting("Biome", "Show the current biome.", true));
	private final BooleanSetting showDim = add(new BooleanSetting("Dimension", "Show the current dimension.", false));
	private final BooleanSetting showFacing = add(new BooleanSetting("Facing", "Show compass direction.", false));

	public CoordinatesHud() {
		super("Coordinates", "X Y Z with optional biome, dimension and facing.", ModuleCategory.WORLD, true, 0.012F, 0.86F);
	}

	@Override
	protected int[] renderContent(GuiGraphics g, Minecraft mc, float tickDelta, boolean editor) {
		String extra = null;
		if (showBiome.get() || showDim.get() || showFacing.get()) {
			StringBuilder b = new StringBuilder();
			if (showBiome.get()) b.append(ClientStats.biome());
			if (showDim.get()) {
				if (!b.isEmpty()) b.append(" · ");
				b.append(ClientStats.dimension());
			}
			if (showFacing.get()) {
				if (!b.isEmpty()) b.append(" · ");
				b.append(ClientStats.facing());
			}
			extra = b.toString();
		}
		return drawTextPanel(g, mc, ClientStats.coords(), extra);
	}
}
