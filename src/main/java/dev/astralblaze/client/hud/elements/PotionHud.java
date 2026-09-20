package dev.astralblaze.client.hud.elements;

import dev.astralblaze.client.core.ModuleCategory;
import dev.astralblaze.client.hud.HudElement;
import dev.astralblaze.client.theme.Theme;
import dev.astralblaze.client.ui.render.ColorUtil;
import dev.astralblaze.client.ui.render.GlassRenderer;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.renderer.RenderPipelines;
import net.minecraft.core.Holder;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.resources.Identifier;
import net.minecraft.world.effect.MobEffect;
import net.minecraft.world.effect.MobEffectInstance;

import java.util.Collection;

public final class PotionHud extends HudElement {
	public PotionHud() {
		super("Potion Effects", "Active effects with amplifier and remaining time.", ModuleCategory.HUD, true, 0.78F, 0.012F);
	}

	@Override
	protected int[] renderContent(GuiGraphics g, Minecraft mc, float tickDelta, boolean editor) {
		if (mc.player == null) {
			return new int[]{80, 16};
		}
		Collection<MobEffectInstance> effects = mc.player.getActiveEffects();
		if (effects.isEmpty()) {
			return editor ? drawTextPanel(g, mc, "No effects") : new int[]{0, 0};
		}
		Theme theme = GlassRenderer.theme();
		float op = opacity.floatValue();
		int row = 16;
		int w = 128;
		int h = 6 + effects.size() * row;
		if (background.get() && style.get() != Style.TEXT_ONLY) {
			GlassRenderer.panel(g, 0, 0, w, h, radius.intValue(), ColorUtil.scaleAlpha(theme.panelFill(), op), border.get() ? ColorUtil.scaleAlpha(theme.border(), op) : 0, 0);
		}
		int y = 3;
		for (MobEffectInstance inst : effects) {
			Holder<MobEffect> holder = inst.getEffect();
			Identifier id = BuiltInRegistries.MOB_EFFECT.getKey(holder.value());
			if (id != null) {
				Identifier sprite = Identifier.fromNamespaceAndPath(id.getNamespace(), "mob_effect/" + id.getPath());
				g.blitSprite(RenderPipelines.GUI_TEXTURED, sprite, 4, y, 12, 12);
			}
			String amp = inst.getAmplifier() > 0 ? " " + roman(inst.getAmplifier() + 1) : "";
			String name = holder.value().getDisplayName().getString() + amp;
			String time = formatTicks(inst.getDuration());
			GlassRenderer.text(g, mc.font, name, 20, y + 2, ColorUtil.scaleAlpha(color.get(), op));
			GlassRenderer.text(g, mc.font, time, w - 6 - mc.font.width(time), y + 2, ColorUtil.scaleAlpha(theme.textMuted(), op));
			y += row;
		}
		return new int[]{w, h};
	}

	private static String formatTicks(int ticks) {
		int s = Math.max(0, ticks) / 20;
		return (s / 60) + ":" + String.format("%02d", s % 60);
	}

	private static String roman(int n) {
		return switch (n) {
			case 2 -> "II";
			case 3 -> "III";
			case 4 -> "IV";
			case 5 -> "V";
			default -> String.valueOf(n);
		};
	}
}
