package dev.astralblaze.client.ui;

import dev.astralblaze.client.theme.Theme;
import dev.astralblaze.client.ui.render.GlassRenderer;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.gui.components.AbstractWidget;
import net.minecraft.client.gui.narration.NarrationElementOutput;
import net.minecraft.client.input.MouseButtonEvent;
import net.minecraft.network.chat.Component;

public final class GlassTextButton extends AbstractWidget {
	private final Runnable onPress;

	public GlassTextButton(int x, int y, int w, int h, Component label, Runnable onPress) {
		super(x, y, w, h, label);
		this.onPress = onPress;
	}

	@Override
	public void onClick(MouseButtonEvent event, boolean doubled) {
		onPress.run();
	}

	@Override
	protected void renderWidget(GuiGraphics graphics, int mouseX, int mouseY, float partialTick) {
		Theme theme = GlassRenderer.theme();
		int fill = isHovered() ? theme.accentSoft() : theme.panelFill();
		int border = isHovered() ? theme.accent() : theme.border();
		GlassRenderer.panel(graphics, getX(), getY(), getWidth(), getHeight(), Math.min(12, getHeight() / 2), fill, border, 0);
		GlassRenderer.centered(graphics, Minecraft.getInstance().font, getMessage().getString(), getX() + getWidth() / 2, getY() + (getHeight() - 8) / 2, isHovered() ? theme.accent() : theme.text());
	}

	@Override
	protected void updateWidgetNarration(NarrationElementOutput narrationElementOutput) {
	}
}
